# Backups, monitoring and deployment checks

## Scheduled operations

- D1 Backup runs daily at 19:37 UTC (01:07 IST the next day), when its workflow or backup scripts change on main, and before each Worker deployment.
- Production Healthcheck runs hourly at minute 19, when its workflow/check scripts change on main, and after successful Pages or Worker deployments.
- Both workflows support manual runs from the GitHub Actions page. Production operations are restricted to main.
- Backup runs export SQL, restore it into an isolated temporary SQLite database, check required tables, integrity and foreign keys, then upload SQL plus a SHA-256 verification manifest. A failed restore prevents the upload and blocks a dependent Worker deployment.
- Artifacts retain the existing 14-day lifetime. SQL contains customer records and authentication data: do not copy it into commits, issues, public logs or shared documents. The verifier prints no row contents or raw SQL errors.
- MONITORING_WEBHOOK_URL remains optional. Without it, there is no webhook delivery; configure GitHub Actions failure notifications for the owner. A passing health run does not verify notification delivery.

GitHub can disable scheduled workflows in a public repository after 60 days without repository activity. A schedule is not a permanent uptime guarantee. Review workflow state and backup freshness regularly; for long inactive periods, use an independently scheduled monitor/backup service. Do not rely on a disabled workflow to alert about its own inactivity.

To restore disabled workflows with an authenticated GitHub CLI:

```sh
gh workflow enable d1-backup.yml --repo sujayjalui-commits/pink-delight-cakes
gh workflow enable production-healthcheck.yml --repo sujayjalui-commits/pink-delight-cakes
gh workflow run d1-backup.yml --ref main --repo sujayjalui-commits/pink-delight-cakes
gh workflow run production-healthcheck.yml --ref main --repo sujayjalui-commits/pink-delight-cakes
```

Check that both runs succeed and that the backup run has a non-expired artifact containing SQL and verification.json. The October 2026 schedule changes also reactivate the previously inactive schedules, as documented by GitHub. Merely seeing a green historical run does not establish current backup coverage.

## Recovery drill

1. Download a recent verified artifact into a private local directory. Verify the SQL hash against verification.json.
2. Run `python scripts/backups/verify_backup.py PATH_TO_DIRECTORY`. This is a local SQLite restore and does not contact production.
3. For a complete Cloudflare recovery drill, create an empty, separate D1 database, import the SQL into that database with Wrangler, and bind a staging Worker to it. Check catalogue, settings and inquiry/admin behavior privately.
4. Promote a recovered database only after checking its data and choosing the intended recovery point. Never import a dump into the live database as a routine test.

The automatic verifier establishes SQL restorability and relational integrity, not a full hosted D1 application recovery, backup freshness outside the retention window, or webhook delivery.

## Migration repair and existing installations

Use the numbered migration chain, not the historical `database/schema/phase-1-schema.sql` snapshot, to provision a new database:

```sh
wrangler d1 migrations apply pink-delight-cakes --local
```

Migration 001 was corrected to exclude columns added by 004 and 005. All existing filenames remain unchanged, including the two distinct 015 filenames, because Wrangler records full filenames in d1_migrations. Already-applied migrations are not replayed; no migration records should be deleted or renamed as part of this repair.

An installation created manually from an expanded schema but missing migration records needs separate inspection. If remote application reports duplicate columns, stop and compare schema and migration records against the verified backup. Do not automatically mark missing migrations as applied or drop columns to force the release through.

## Release gates

Validate runs on pull requests and is reused by both production deployment workflows. It checks:

1. Locked dependency installation and the API regression suite.
2. Real SQLite fresh replay, representative historical upgrades with retained inquiry data, and an unchanged second application.
3. Positive and negative backup restore tests.
4. Stamped Pages bundle integrity.
5. Fresh migration replay and a second apply using Wrangler's local D1 runtime.
6. Worker compilation with `wrangler deploy --dry-run`.

Worker deployment additionally requires a new verified backup before applying pending remote migrations. Pages rechecks its actual URL-stamped bundle. Both deploy workflows serialize their own production runs and only deploy main. Successful releases trigger the production HTTP/auth checks. These checks do not submit live inquiries or sign in as an admin.

Run local checks with Node 24, Python 3.12 and the workflow-pinned Wrangler version:

```sh
npm ci --ignore-scripts
npm test
npm run db:check
npm run test:backups
npm run ops:check:pages-predeploy
```

Repository branch-protection rules are separate from workflow configuration. Deploy jobs enforce their validation dependencies regardless; requiring Validate before merging every PR needs the corresponding repository rule.

References: [GitHub workflow inactivity](https://docs.github.com/en/actions/how-tos/troubleshoot-workflows), [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/), [D1 import/export](https://developers.cloudflare.com/d1/best-practices/import-export-data/).
