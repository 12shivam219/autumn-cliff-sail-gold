import base64
import html
import random
import re
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

from google.auth.exceptions import RefreshError
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from .config import CREDENTIALS_PATH, TOKEN_PATH

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]
SEARCH = '{"interview scheduled" "interview invitation" "interview confirmation" "phone screen" "onsite interview" "virtual interview" "update on your application" "not moving forward" "offer letter" cancelled canceled rescheduled zoom.us meet.google.com teams.microsoft.com}'


@dataclass(frozen=True)
class Message:
    id: str
    thread_id: str
    subject: str
    sender: str
    received_at: datetime
    body: str


def authenticate() -> None:
    """One-time interactive Desktop OAuth; subsequent scans refresh the token."""
    if not CREDENTIALS_PATH.exists():
        raise FileNotFoundError(f"Download a Desktop OAuth client as {CREDENTIALS_PATH}")
    flow = InstalledAppFlow.from_client_secrets_file(str(CREDENTIALS_PATH), SCOPES)
    credentials = flow.run_local_server(port=0)
    TOKEN_PATH.write_text(credentials.to_json(), encoding="utf-8")
    TOKEN_PATH.chmod(0o600)


def gmail_service():
    if not TOKEN_PATH.exists():
        raise RuntimeError("Gmail is not connected. Run: python -m tracker auth")
    credentials = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
    if not credentials.valid:
        if not credentials.expired or not credentials.refresh_token:
            raise RuntimeError("Gmail authorization expired. Run: python -m tracker auth")
        try:
            credentials.refresh(Request())
        except RefreshError as exc:
            raise RuntimeError("Gmail authorization was revoked. Run: python -m tracker auth") from exc
        TOKEN_PATH.write_text(credentials.to_json(), encoding="utf-8")
        TOKEN_PATH.chmod(0o600)
    return build("gmail", "v1", credentials=credentials, cache_discovery=False)


def execute(request):
    for attempt in range(5):
        try:
            return request.execute()
        except HttpError as exc:
            status = exc.resp.status
            if status not in (429, 500, 502, 503, 504) or attempt == 4:
                raise
            retry_after = exc.resp.get("retry-after")
            delay = min(30, 2 ** attempt + random.random())
            if retry_after and retry_after.isdigit():
                delay = min(60, max(delay, int(retry_after)))
            time.sleep(delay)


def _body(payload: dict) -> str:
    plain, rich = [], []

    def walk(part):
        data = part.get("body", {}).get("data")
        mime = part.get("mimeType", "")
        if data and mime in ("text/plain", "text/html"):
            decoded = base64.urlsafe_b64decode(data + "=" * (-len(data) % 4)).decode("utf-8", errors="replace")
            (plain if mime == "text/plain" else rich).append(decoded)
        for child in part.get("parts", []):
            walk(child)

    walk(payload)
    if plain:
        return "\n".join(plain)[:12000]
    value = "\n".join(rich)
    value = re.sub(r"(?is)<(script|style).*?</\1>", " ", value)
    return html.unescape(re.sub(r"<[^>]+>", " ", value))[:12000]


def parse_message(raw: dict) -> Message:
    headers = {h["name"].lower(): h["value"] for h in raw.get("payload", {}).get("headers", [])}
    ms = raw.get("internalDate")
    received = datetime.fromtimestamp(int(ms) / 1000, timezone.utc) if ms else parsedate_to_datetime(headers["date"]).astimezone(timezone.utc)
    return Message(raw["id"], raw["threadId"], headers.get("subject", ""), headers.get("from", ""), received, _body(raw.get("payload", {})) or raw.get("snippet", ""))


def fetch_messages(service, days: int, max_messages: int = 250) -> list[Message]:
    """Search recent mail, then fetch complete threads so later status changes win."""
    days = max(1, min(365, days))
    query = f"newer_than:{days}d {SEARCH}"
    thread_ids: set[str] = set()
    page = None
    while len(thread_ids) < max_messages:
        response = execute(service.users().messages().list(userId="me", q=query, maxResults=min(100, max_messages - len(thread_ids)), pageToken=page))
        thread_ids.update(row["threadId"] for row in response.get("messages", []))
        page = response.get("nextPageToken")
        if not page:
            break
    seen: set[str] = set()
    messages: list[Message] = []
    for thread_id in thread_ids:
        thread = execute(service.users().threads().get(userId="me", id=thread_id, format="full"))
        for raw in thread.get("messages", []):
            if raw["id"] not in seen:
                seen.add(raw["id"])
                messages.append(parse_message(raw))
    return sorted(messages, key=lambda m: (m.received_at, m.id))
