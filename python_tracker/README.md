# Interview Email Tracker (Python)

This is the local Python/FastAPI implementation of the requested app. The existing TypeScript/Grok dashboard at the repository root is a separate prototype; it uses a Grok Gmail connector and PostgreSQL, so it does not satisfy the requested `credentials.json` OAuth and SQLite architecture.

## Setup

Use Python 3.11+ and run from `python_tracker/`:

```bash
python -m venv .venv
source .venv/bin/activate  # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env       # Windows: copy .env.example .env
```

1. In [Google Cloud Console](https://console.cloud.google.com/), create/select a project, enable **Gmail API**, configure the OAuth consent screen, add your Gmail address as a test user if the app is in testing, and create an **OAuth client ID** of type **Desktop app**. Download the JSON as `python_tracker/credentials.json`. The app only asks for `gmail.readonly`.
2. In `.env`, choose Gemini (`GEMINI_API_KEY`) or OpenAI (`LLM_PROVIDER=openai` and `OPENAI_API_KEY`). Email text is sent to the chosen AI provider for extraction. Use an account and provider you authorize for this data.
3. Run `python -m tracker auth`. A local browser opens for Gmail permission and creates `token.json` (never commit either JSON file).
4. Run `uvicorn tracker.web:app --host 127.0.0.1 --port 8000` and open `http://127.0.0.1:8000`. Keep it bound to localhost: the dashboard is intended for a single user and has no web login.

The dashboard scans when you click **Scan Gmail now** and every 15 minutes while the server runs. `python -m tracker scan --days 90` runs a one-off scan. The first scan can take time and incur AI usage; subsequent scans skip messages already saved as events. Set `LOOKBACK_DAYS` (1–365), `SCAN_INTERVAL_MINUTES` (minimum 5), and `TIMEZONE` in `.env`. The search has a 250-thread cap per run; widen lookback or change the cap in `tracker/gmail.py` for larger histories.

The `interviews` row is unique per Gmail thread. `interview_events` retains each relevant message and the latest dated message determines the current status; a cancellation followed by a new invite returns to Scheduled. Missing extraction fields preserve previously known details. SQLite is local; `DATABASE_URL` accepts a PostgreSQL SQLAlchemy URL with a suitable driver installed. Schema creation uses `create_all` for a fresh database; use Alembic migrations before changing an existing production schema.

Run `pip install -r requirements-dev.txt && pytest -q` for tests. Gmail OAuth and live AI parsing require your own credentials and cannot be verified by the offline tests.
