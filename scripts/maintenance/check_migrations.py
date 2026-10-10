"""Exercise clean installs, upgrades and already-applied migration preservation locally."""

import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MIGRATIONS = sorted((ROOT / "database/migrations").glob("*.sql"))


def database():
    db = sqlite3.connect(":memory:")
    db.execute("PRAGMA foreign_keys = ON")
    db.execute("CREATE TABLE d1_migrations (id INTEGER PRIMARY KEY, name TEXT UNIQUE, applied_at TEXT DEFAULT CURRENT_TIMESTAMP)")
    return db


def apply_pending(db, migrations=MIGRATIONS):
    applied = {row[0] for row in db.execute("SELECT name FROM d1_migrations")}
    count = 0
    for migration in migrations:
        if migration.name in applied:
            continue
        try:
            db.executescript("BEGIN;\n" + migration.read_text(encoding="utf-8"))
            db.execute("INSERT INTO d1_migrations(name) VALUES (?)", (migration.name,))
            db.commit()
        except Exception as error:
            db.rollback()
            raise RuntimeError(f"Migration failed: {migration.name}") from error
        count += 1
    return count


def schema(db):
    tables = [row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")]
    return {table: sorted(db.execute(f'PRAGMA table_info("{table}")').fetchall(), key=lambda row: row[1]) for table in tables}


def column_schema(db):
    # Column ordinal differs when older expanded baselines were used.
    return {table: [row[1:] for row in columns] for table, columns in schema(db).items()}


def seed_customer_fixture(db):
    db.execute("INSERT INTO business_settings (brand_name, city) VALUES ('Migration fixture', 'Preserve city')")
    db.execute("INSERT INTO order_requests (customer_name, customer_phone, product_snapshot, fulfillment_type, status, quoted_amount) VALUES ('Synthetic fixture', '9000000000', '{}', 'local_delivery', 'paid', 1800)")
    db.commit()


def check_database(db):
    assert db.execute("PRAGMA integrity_check").fetchall() == [("ok",)]
    assert not db.execute("PRAGMA foreign_key_check").fetchall()
    assert {"cart_snapshot", "delivery_status", "internal_note"} <= {row[1] for row in db.execute("PRAGMA table_info(order_requests)")}
    assert "video_url" in {row[1] for row in db.execute("PRAGMA table_info(products)")}


def main():
    with database() as clean:
        assert apply_pending(clean) == len(MIGRATIONS)
        check_database(clean)
        expected_schema = column_schema(clean)
        assert clean.execute("SELECT count(*) FROM products").fetchone()[0] > 0
        assert clean.execute("SELECT count(*) FROM testimonials").fetchone()[0] == 0
        before = "\n".join(clean.iterdump())
        assert apply_pending(clean) == 0
        assert "\n".join(clean.iterdump()) == before
    print(f"PASS: clean replay of {len(MIGRATIONS)} migrations; second apply is a no-op")

    # Representative historical releases, including immediately before the
    # duplicate-column migrations and before the order-history backfill.
    for prefix in (1, 3, 5, 12):
        with database() as upgrade:
            apply_pending(upgrade, MIGRATIONS[:prefix])
            seed_customer_fixture(upgrade)
            apply_pending(upgrade)
            check_database(upgrade)
            assert column_schema(upgrade) == expected_schema
            assert upgrade.execute("SELECT customer_name, status, quoted_amount, delivery_status FROM order_requests").fetchone() == ("Synthetic fixture", "paid", 1800, "delivery_pending")
            assert upgrade.execute("SELECT city FROM business_settings").fetchone() == ("Preserve city",)
            assert upgrade.execute("SELECT count(*) FROM order_request_status_history").fetchone() == (1,)
        print(f"PASS: upgrade after {MIGRATIONS[prefix - 1].name} preserves inquiry and settings")

    # The pre-repair 001 included columns also added by 004/005. Recreate that
    # historical layout with those names recorded as applied, without renaming
    # or replaying migrations against an already-provisioned database.
    with database() as existing:
        apply_pending(existing, MIGRATIONS[:1])
        apply_pending(existing, [m for m in MIGRATIONS if m.name.startswith(("004_", "005_"))])
        apply_pending(existing)
        seed_customer_fixture(existing)
        existing.execute("UPDATE business_settings SET delivery_pickup_copy='Preserve custom copy', address_line_1='Synthetic address'")
        existing.commit()
        before = "\n".join(existing.iterdump())
        assert apply_pending(existing) == 0
        assert "\n".join(existing.iterdump()) == before
        assert column_schema(existing) == expected_schema
        check_database(existing)
    print("PASS: existing expanded baseline and applied migration records remain untouched")


if __name__ == "__main__":
    main()
