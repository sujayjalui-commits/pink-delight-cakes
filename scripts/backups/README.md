# Backup Scripts

Scripts and notes for exporting or backing up business-critical data.

## Current Backup Flow

- `export-d1.mjs` exports the live D1 database to a timestamped `.sql` file
- default database name: `pink-delight-cakes`
- default output directory: `artifacts/d1-backups`

## Manual Usage

Run from the repo root:

```bash
npm run db:backup
```

Optional environment variables:

- `D1_DATABASE_NAME`
- `D1_BACKUP_OUTPUT_DIR`

## Automated Usage

The GitHub Actions workflow `.github/workflows/d1-backup.yml` runs on a schedule and uploads the SQL export as an artifact.
