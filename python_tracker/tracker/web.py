import asyncio
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import select

from .config import TOKEN_PATH
from .db import Interview, InterviewEvent, SessionLocal, init_db
from .sync import scan

templates = Jinja2Templates(directory=str(Path(__file__).parent / "templates"))
scan_lock = asyncio.Lock()
last_scan: dict = {}


def run_scan(days: int) -> dict:
    with SessionLocal() as session:
        result = scan(session, days)
    return vars(result)


async def scan_once(days: int) -> dict:
    async with scan_lock:
        result = await asyncio.to_thread(run_scan, days)
        last_scan.clear()
        last_scan.update(result)
        last_scan["at"] = datetime.now(timezone.utc).isoformat()
        return result


async def periodic_scan():
    interval = max(5, int(os.getenv("SCAN_INTERVAL_MINUTES", "15"))) * 60
    days = max(1, min(365, int(os.getenv("LOOKBACK_DAYS", "30"))))
    while True:
        await asyncio.sleep(interval)
        if TOKEN_PATH.exists():
            try:
                await scan_once(days)
            except Exception as exc:
                last_scan.update({"error": str(exc), "at": datetime.now(timezone.utc).isoformat()})


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    task = asyncio.create_task(periodic_scan())
    try:
        yield
    finally:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


app = FastAPI(title="Interview Email Tracker", lifespan=lifespan)


def serialize(interview: Interview) -> dict:
    return {"id": interview.id, "company_name": interview.company_name, "role": interview.role, "status": interview.status, "interview_date": interview.interview_date.isoformat() + "Z" if interview.interview_date else None, "interviewer_names": interview.interviewer_names, "meeting_link": interview.meeting_link, "subject": interview.subject, "last_email_at": interview.last_email_at.isoformat() + "Z"}


def rows(status: str | None = None, search: str = "") -> list[dict]:
    with SessionLocal() as session:
        interviews = session.scalars(select(Interview).order_by(Interview.last_email_at.desc())).all()
        return [serialize(row) for row in interviews if (not status or row.status == status) and (not search or search.casefold() in (row.company_name + " " + row.role).casefold())]


@app.get("/", response_class=HTMLResponse)
def dashboard(request: Request, status: str = "", q: str = "", sort: str = "recent"):
    with SessionLocal() as session:
        all_rows = [serialize(row) for row in session.scalars(select(Interview)).all()]
    now = datetime.now(timezone.utc)
    metrics = {"total": len(all_rows), "canceled": sum(x["status"] == "Canceled" for x in all_rows), "upcoming": sum(x["status"] == "Scheduled" and x["interview_date"] and datetime.fromisoformat(x["interview_date"].replace("Z", "+00:00")) >= now for x in all_rows)}
    filtered = [x for x in all_rows if (not status or x["status"] == status) and (not q or q.casefold() in (x["company_name"] + " " + x["role"]).casefold())]
    filtered.sort(key=lambda x: x["interview_date"] or "", reverse=sort == "date_desc") if sort.startswith("date_") else filtered.sort(key=lambda x: x["last_email_at"], reverse=True)
    return templates.TemplateResponse(request, "dashboard.html", {"rows": filtered, "metrics": metrics, "status": status, "q": q, "sort": sort, "connected": TOKEN_PATH.exists(), "last_scan": last_scan})


@app.get("/api/interviews")
def list_interviews(status: str | None = None, q: str = ""):
    return rows(status, q)


@app.get("/api/interviews/{interview_id}")
def interview_detail(interview_id: int):
    with SessionLocal() as session:
        interview = session.get(Interview, interview_id)
        if not interview:
            raise HTTPException(404, "Interview not found")
        events = session.scalars(select(InterviewEvent).where(InterviewEvent.interview_id == interview_id).order_by(InterviewEvent.occurred_at, InterviewEvent.id)).all()
        return {"interview": serialize(interview), "events": [{"status": event.status, "subject": event.subject, "occurred_at": event.occurred_at.isoformat() + "Z"} for event in events]}


@app.post("/api/scan")
async def trigger_scan(days: int = Query(default=30, ge=1, le=365)):
    if not TOKEN_PATH.exists():
        raise HTTPException(400, "Connect Gmail first with: python -m tracker auth")
    try:
        return await scan_once(days)
    except Exception as exc:
        raise HTTPException(502, str(exc)) from exc


@app.post("/scan")
async def dashboard_scan(days: int = Query(default=30, ge=1, le=365)):
    await trigger_scan(days)
    return RedirectResponse("/", status_code=303)
