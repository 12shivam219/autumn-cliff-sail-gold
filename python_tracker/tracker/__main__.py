import argparse
import json

from .db import SessionLocal, init_db
from .gmail import authenticate
from .sync import scan


def main():
    parser = argparse.ArgumentParser(description="Local Interview Email Tracker")
    command = parser.add_subparsers(dest="command", required=True)
    command.add_parser("auth", help="Connect Gmail with a Desktop OAuth client")
    scan_command = command.add_parser("scan", help="Run one scan")
    scan_command.add_argument("--days", type=int, default=30)
    args = parser.parse_args()
    if args.command == "auth":
        authenticate()
        print("Gmail connected. Your token is stored locally.")
    else:
        init_db()
        with SessionLocal() as session:
            print(json.dumps(vars(scan(session, args.days)), indent=2))


if __name__ == "__main__":
    main()
