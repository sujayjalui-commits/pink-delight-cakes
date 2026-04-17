# Pink Delight Cakes

Monorepo structure for the Pink Delight Cakes website.

## Project Layout

- `apps/web`: customer-facing frontend
- `apps/api`: backend API and Cloudflare Worker entry
- `packages/shared`: shared schemas, types, constants, helpers
- `packages/ui`: reusable UI primitives and styles
- `database`: schema notes, migrations, seed data
- `docs`: phased backend, API, product, order flow, deployment notes
- `scripts`: seed, backup, and maintenance helpers
- `tests`: API, integration, e2e, and fixtures

## Current Frontend

- Main frontend copy preserved at root: `index.html`
- Working app location for the monorepo: `apps/web/index.html`

## Suggested Next Steps

1. Move frontend assets and scripts from `apps/web/index.html` into `apps/web/src`.
2. Use the Phase 1 backend foundation in `apps/api`, `packages/shared`, and `database`.
3. Apply `database/migrations/001_initial_schema.sql` to your D1 database.
4. Build Phase 2 public product and inquiry APIs on top of this foundation.
5. Configure the Phase 3 admin secrets and protected management routes.

## Phase 1 Backend Foundation

- Worker entry: `apps/api/worker.js`
- API config: `apps/api/src/config/api-config.js`
- HTTP helpers: `apps/api/src/utils/http.js`
- Shared constants: `packages/shared/constants/order-statuses.js`
- Shared seed catalog: `packages/shared/constants/seed-catalog.js`
- Shared schemas: `packages/shared/schemas/*.js`
- Initial schema: `database/schema/phase-1-schema.sql`
- Initial migration: `database/migrations/001_initial_schema.sql`
- Seed data snapshot: `database/seeds/phase-1-seed.json`

## Phase 3 Admin Backend

- Admin auth:
  - `POST /api/admin/auth/setup`
  - `POST /api/admin/auth/login`
  - `POST /api/admin/auth/logout`
  - `GET /api/admin/auth/session`
- Admin products:
  - `GET /api/admin/products`
  - `GET /api/admin/products/:id`
  - `POST /api/admin/products`
  - `PATCH /api/admin/products/:id`
- Admin inquiries:
  - `GET /api/admin/orders`
  - `GET /api/admin/orders/:id`
  - `PATCH /api/admin/orders/:id`

Required Worker secrets before first admin login:

- `ADMIN_SETUP_KEY`
- `ADMIN_SESSION_SECRET`

Recommended Worker variable for separate frontend/backend origins:

- `CORS_ALLOWED_ORIGINS=https://your-admin-frontend-origin`
- Use a comma-separated list if you need both a local/admin preview origin and a production origin.
- Example: `CORS_ALLOWED_ORIGINS=https://pink-delight-cakes.pages.dev,https://admin.pinkdelightcakes.com`
- `SITE_URL=https://your-public-site-origin`
- `ADMIN_URL=https://your-admin-site-origin/admin/`
- `API_BASE_URL=https://your-api-origin`

Admin auth is now designed to stay cookie-only in the browser:

- the dashboard talks to a same-origin Pages Functions proxy at `/api/*`
- the proxy forwards requests to the Worker target defined by `API_BASE_URL`
- browser-facing admin requests sent directly to a different-origin Worker are rejected
- the dashboard no longer stores or sends bearer fallback tokens

Apply `database/migrations/002_admin_internal_note.sql` before using inquiry notes in the admin flow.

## GitHub Automatic Deploys

This project is now set up for GitHub Actions based deployments:

- Worker deploy workflow: `.github/workflows/deploy-worker.yml`
- Pages deploy workflow: `.github/workflows/deploy-pages.yml`
- Production health workflow: `.github/workflows/production-healthcheck.yml`
- D1 backup workflow: `.github/workflows/d1-backup.yml`

Add these repository secrets in GitHub before pushing to `main`:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `MONITORING_WEBHOOK_URL` (optional, for Slack/Discord/generic webhook alerts from healthcheck and backup failures)

Recommended repository variables for deploy-time URL stamping:

- `SITE_BASE_URL=https://your-public-site-origin`
- `ADMIN_BASE_URL=https://your-admin-site-origin/admin/`
- `API_BASE_URL=https://your-api-origin`

Deployment behavior:

- pushes that change `apps/api`, `database`, `packages/shared`, or `wrangler.toml` deploy the Worker
- pushes that change `apps/web` deploy the Pages frontend from `apps/web`
- Pages deploys should be prepared through `npm run deploy:prepare:pages`, which creates a stamped bundle in `.deploy/pages-site`

Because the Pages project was created as a direct-upload project, GitHub Actions is the clean automatic deployment path here rather than switching to Cloudflare's built-in Git integration. This is an inference from the current project setup and Cloudflare Pages behavior.

## Production Monitoring

The Worker now supports lightweight runtime monitoring for failed public inquiry submissions and unhandled exceptions.

Recommended Worker secrets / vars:

- `MONITORING_WEBHOOK_URL` as a Worker secret for runtime alerts
- `MONITORING_ENVIRONMENT=production` as an optional Worker variable for cleaner log labels

Worker monitoring behavior:

- failed public inquiry submissions are logged with structured masked context
- inquiry failures with `5xx` responses trigger a webhook alert when configured
- unhandled Worker exceptions trigger a webhook alert when configured

Local / scripted ops commands:

- `npm run ops:check:production`
- `npm run db:backup`
- `npm run ops:alert`

Backup habit:

- the scheduled D1 backup workflow exports the live database to a timestamped `.sql` artifact
- artifacts are retained in GitHub Actions for 14 days by default
- you can also run `npm run db:backup` manually from a machine that has Wrangler access to the Cloudflare account

## Session Documentation

- Full April 2026 upgrade/session record:
  - `docs/session-2026-04-product-and-platform-upgrade.md`
- Long-form historical project evolution:
  - `docs/project-history.md`
