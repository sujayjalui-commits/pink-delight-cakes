import importlib.util
import sqlite3
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("verify_backup", ROOT / "scripts/backups/verify_backup.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class BackupVerificationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / "fixture.sql"
        db = sqlite3.connect(":memory:")
        for migration in sorted((ROOT / "database/migrations").glob("*.sql")):
            db.executescript(migration.read_text(encoding="utf-8"))
        self.sql = "\n".join(db.iterdump())
        db.close()

    def verify(self, sql):
        self.path.write_text(sql, encoding="utf-8")
        return module.verify_backup(self.path)

    def test_complete_export_restores(self):
        result = self.verify(self.sql)
        self.assertEqual(result["restore"], "passed")
        self.assertEqual(len(result["sha256"]), 64)

    def test_empty_export_rejected(self):
        with self.assertRaises(ValueError):
            self.verify(" \n")

    def test_missing_tables_rejected(self):
        with self.assertRaises(ValueError):
            self.verify("CREATE TABLE unrelated(id INTEGER);")

    def test_corrupt_sql_rejected(self):
        with self.assertRaises(sqlite3.Error):
            self.verify(self.sql + "\nTHIS IS NOT SQL;")

    def test_broken_foreign_key_rejected(self):
        with self.assertRaises(ValueError):
            self.verify(self.sql + "\nINSERT INTO product_options(product_id, option_group, option_label) VALUES (999999, 'flavor', 'Synthetic');")

    def test_uncommitted_dump_rejected(self):
        with self.assertRaises(ValueError):
            self.verify(self.sql.removesuffix("COMMIT;"))


if __name__ == "__main__":
    unittest.main()
