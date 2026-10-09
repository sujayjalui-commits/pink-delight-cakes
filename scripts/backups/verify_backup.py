"""Restore SQL exports into temporary SQLite databases; never print customer data."""

import argparse
import hashlib
import json
import sqlite3
import tempfile
from pathlib import Path

REQUIRED_TABLES = {
    "business_settings", "admin_users", "products", "product_options",
    "order_requests", "order_request_status_history", "testimonials", "rate_limit_events",
}


def verify_backup(path):
    path = Path(path)
    content = path.read_bytes()
    if not content.strip():
        raise ValueError("Backup is empty")
    with tempfile.TemporaryDirectory(prefix="d1-restore-check-") as temp:
        db = sqlite3.connect(str(Path(temp) / "restored.sqlite"))
        try:
            # A full export can insert child tables before parents. Validate all
            # relationships after import, instead of depending on dump ordering.
            db.execute("PRAGMA foreign_keys = OFF")
            db.set_authorizer(lambda action, *_: sqlite3.SQLITE_DENY
                              if action in (sqlite3.SQLITE_ATTACH, sqlite3.SQLITE_DETACH)
                              else sqlite3.SQLITE_OK)
            db.executescript(content.decode("utf-8-sig"))
            if db.in_transaction:
                raise ValueError("Backup ends with an uncommitted transaction")
            tables = {row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
            missing = REQUIRED_TABLES - tables
            if missing:
                raise ValueError("Required application tables are missing")
            if db.execute("PRAGMA integrity_check").fetchall() != [("ok",)]:
                raise ValueError("Restored database failed integrity check")
            if db.execute("PRAGMA foreign_key_check").fetchone() is not None:
                raise ValueError("Restored database has broken foreign keys")
            return {"file": path.name, "bytes": len(content),
                    "sha256": hashlib.sha256(content).hexdigest(),
                    "restore": "passed", "integrity": "passed", "foreignKeys": "passed"}
        finally:
            db.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    args = parser.parse_args()
    files = sorted(args.directory.glob("*.sql"))
    if not files:
        raise SystemExit("No SQL backups found")
    try:
        reports = [verify_backup(path) for path in files]
    except (OSError, UnicodeError, ValueError, sqlite3.Error):
        # SQL exception text can include data. Keep it out of public Actions logs.
        raise SystemExit("Backup restore verification failed; inspect the export privately.") from None
    (args.directory / "verification.json").write_text(json.dumps(reports, indent=2) + "\n", encoding="utf-8")
    print(f"Verified {len(reports)} SQL backup(s): restore, integrity, and foreign keys passed.")


if __name__ == "__main__":
    main()
