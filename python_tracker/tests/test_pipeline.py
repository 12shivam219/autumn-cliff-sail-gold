from datetime import datetime, timezone

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from tracker.db import Base, Interview, InterviewEvent
from tracker.gmail import Message, _body, fetch_messages
from tracker.parser import Extraction
from tracker.sync import save_extraction


@pytest.fixture
def session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        yield db
    engine.dispose()


def message(id: str, day: int) -> Message:
    return Message(id, "thread-1", f"Interview {id}", "Hiring <jobs@example.com>", datetime(2026, 9, day, tzinfo=timezone.utc), "Hello")


def parsed(status: str, date: str | None = None) -> Extraction:
    return Extraction(relevant=True, company_name="Example", role="Engineer", status=status, interview_date=date, interviewer_names=["Alex"], meeting_link="https://meet.google.com/abc")


def test_one_thread_lifecycle_and_idempotency(session):
    assert save_extraction(session, message("invite", 1), parsed("Scheduled", "2026-09-10T10:00:00+05:30")) == "inserted"
    assert save_extraction(session, message("cancel", 2), parsed("Canceled")) == "updated"
    assert save_extraction(session, message("new-time", 3), parsed("Scheduled", "2026-09-12T11:00:00+05:30")) == "updated"
    assert save_extraction(session, message("cancel", 2), parsed("Canceled")) == "skipped"
    assert save_extraction(session, message("older", 1), parsed("Rejected")) == "updated"
    rows = session.scalars(select(Interview)).all()
    assert len(rows) == 1
    assert rows[0].status == "Scheduled"
    assert rows[0].interview_date.isoformat() == "2026-09-12T05:30:00"
    assert session.query(InterviewEvent).count() == 4


def test_irrelevant_email_is_not_saved(session):
    assert save_extraction(session, message("newsletter", 1), Extraction(relevant=False)) == "skipped"
    assert session.query(Interview).count() == 0


def test_date_requires_timezone():
    with pytest.raises(ValueError):
        parsed("Scheduled", "2026-09-10T10:00:00")


def test_plain_body_preferred_to_html():
    import base64

    payload = {"parts": [{"mimeType": "text/html", "body": {"data": base64.urlsafe_b64encode(b"<b>wrong</b>").decode()}}, {"mimeType": "text/plain", "body": {"data": base64.urlsafe_b64encode(b"correct").decode()}}]}
    assert _body(payload) == "correct"


def test_fetch_reads_all_messages_in_matched_thread():
    class Request:
        def __init__(self, data):
            self.data = data

        def execute(self):
            return self.data

    class Messages:
        def list(self, **kwargs):
            return Request({"messages": [{"threadId": "thread-1"}]})

    def raw(id, day):
        return {"id": id, "threadId": "thread-1", "internalDate": str(int(datetime(2026, 9, day, tzinfo=timezone.utc).timestamp() * 1000)), "payload": {"headers": [{"name": "Subject", "value": id}]}, "snippet": id}

    class Threads:
        def get(self, **kwargs):
            return Request({"messages": [raw("cancel", 2), raw("invite", 1)]})

    class Users:
        def messages(self):
            return Messages()

        def threads(self):
            return Threads()

    class Service:
        def users(self):
            return Users()

    assert [item.id for item in fetch_messages(Service(), 30)] == ["invite", "cancel"]
