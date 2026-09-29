import random
import time
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from .db import Interview, InterviewEvent
from .gmail import Message, fetch_messages, gmail_service
from .parser import Extraction, parse_email


def naive_utc(value: datetime) -> datetime:
    return value.astimezone(timezone.utc).replace(tzinfo=None)


@dataclass
class ScanStats:
    fetched: int = 0
    inserted: int = 0
    updated: int = 0
    skipped: int = 0
    failed: int = 0


def save_extraction(session: Session, message: Message, parsed: Extraction) -> str:
    if not parsed.relevant:
        return "skipped"
    if session.scalar(select(InterviewEvent).where(InterviewEvent.gmail_message_id == message.id)):
        return "skipped"
    received = naive_utc(message.received_at)
    interview = session.scalar(select(Interview).where(Interview.gmail_thread_id == message.thread_id))
    created = interview is None
    if created:
        interview = Interview(gmail_thread_id=message.thread_id, gmail_message_id=message.id, company_name=parsed.company_name.strip() or "Unknown company", role=parsed.role.strip() or "Role not specified", status=parsed.status, interview_date=naive_utc(parsed.interview_date) if parsed.interview_date else None, interviewer_names=parsed.interviewer_names, meeting_link=parsed.meeting_link, subject=message.subject, last_email_at=received)
        session.add(interview)
        session.flush()
    elif received >= interview.last_email_at:
        interview.gmail_message_id = message.id
        interview.status = parsed.status
        interview.last_email_at = received
        interview.subject = message.subject
        if parsed.company_name.strip():
            interview.company_name = parsed.company_name.strip()
        if parsed.role.strip():
            interview.role = parsed.role.strip()
        if parsed.interview_date:
            interview.interview_date = naive_utc(parsed.interview_date)
        if parsed.interviewer_names:
            interview.interviewer_names = parsed.interviewer_names
        if parsed.meeting_link:
            interview.meeting_link = parsed.meeting_link
    session.add(InterviewEvent(interview_id=interview.id, gmail_message_id=message.id, status=parsed.status, occurred_at=received, subject=message.subject))
    session.commit()
    return "inserted" if created else "updated"


def parse_with_retry(message: Message) -> Extraction:
    for attempt in range(4):
        try:
            return parse_email(message)
        except Exception as exc:
            # SDKs expose status_code for API rate limit and transient errors.
            status = getattr(exc, "status_code", None) or getattr(exc, "code", None)
            if status not in (429, 500, 502, 503, 504) or attempt == 3:
                raise
            time.sleep(min(20, 2 ** attempt + random.random()))
    raise RuntimeError("Unreachable retry state")


def scan(session: Session, days: int = 30, *, service=None, parser=None) -> ScanStats:
    service = service or gmail_service()
    parser = parser or parse_with_retry
    messages = fetch_messages(service, days)
    stats = ScanStats(fetched=len(messages))
    seen = set(session.scalars(select(InterviewEvent.gmail_message_id)).all())
    for message in messages:
        if message.id in seen:
            stats.skipped += 1
            continue
        try:
            result = save_extraction(session, message, parser(message))
            setattr(stats, result, getattr(stats, result) + 1)
            if result != "skipped":
                seen.add(message.id)
        except Exception:
            session.rollback()
            stats.failed += 1
            # Failed messages remain unprocessed and will be retried next scan.
    return stats
