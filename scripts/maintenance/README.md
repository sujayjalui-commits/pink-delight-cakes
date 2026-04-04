# Maintenance Scripts

One-off cleanup, migration-assist, and support scripts.

## Production Ops

- `check-production.mjs` verifies the live API health endpoint, public products endpoint, public settings endpoint, and storefront page
- `send-webhook-alert.mjs` posts failure notifications to Slack, Discord, or a generic webhook endpoint

Run from the repo root:

```bash
npm run ops:check:production
```

Expected environment variables for checks:

- `API_BASE_URL`
- `SITE_BASE_URL`

Expected environment variables for alerts:

- `MONITORING_WEBHOOK_URL`
- `MONITORING_ALERT_TITLE`
- `MONITORING_ALERT_BODY`
- `MONITORING_ALERT_SEVERITY`
