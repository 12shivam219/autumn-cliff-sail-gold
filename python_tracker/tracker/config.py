import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")


def path_from_env(name: str, default: str) -> Path:
    path = Path(os.getenv(name, default)).expanduser()
    return path if path.is_absolute() else BASE_DIR / path


CREDENTIALS_PATH = path_from_env("GOOGLE_CREDENTIALS_PATH", "credentials.json")
TOKEN_PATH = path_from_env("GOOGLE_TOKEN_PATH", "token.json")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'interviews.sqlite3'}")
