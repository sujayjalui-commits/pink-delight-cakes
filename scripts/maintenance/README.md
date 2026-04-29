# Maintenance Scripts

One-off cleanup, migration-assist, and support scripts.

## Production Ops

- `check-production.mjs` verifies the live API health endpoint, public products endpoint, public settings endpoint, and storefront page
- `check-admin-auth.mjs` verifies the live admin page wiring plus admin auth CORS/session endpoints without submitting a real login
- `check-browser-smoke.mjs` verifies that the live storefront, menu, inquiry, cart, reviews, tracking, and admin routes load the expected extracted assets and still serve the tightened CSP
- `check-pages-bundle.mjs` verifies a freshly prepared `.deploy/pages-site` bundle still contains the expected current routes, has no unresolved stamp placeholders, and does not resurrect removed output such as `/about/`
- `send-webhook-alert.mjs` posts failure notifications to Slack, Discord, or a generic webhook endpoint

Run from the repo root:

```bash
npm run ops:check:production
npm run ops:check:admin-auth
npm run ops:check:browser-smoke
npm run ops:check:pages-predeploy
```

Expected environment variables for checks:

- `API_BASE_URL`
- `SITE_BASE_URL`
- `ADMIN_BASE_URL` (optional if `SITE_BASE_URL` is set; defaults to `${SITE_BASE_URL}/admin/`)

Expected environment variables for alerts:

- `MONITORING_WEBHOOK_URL`
- `MONITORING_ALERT_TITLE`
- `MONITORING_ALERT_BODY`
- `MONITORING_ALERT_SEVERITY`
