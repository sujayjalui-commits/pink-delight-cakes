# Backend audit and remediation status

Recorded 18 November 2026. This consolidates the original audits and subsequent release records. It is **not a fresh security audit**. An item without a recorded complete fix is a verification backlog item, not proof that it remains exploitable today. Operational checks are point-in-time evidence, not a guarantee of current uptime or backup availability.

## Original findings

- [9 October repository audit](2026-10-09-repository-audit.md)
- [10 October backend, security and core functionality audit](2026-10-10-backend-security-audit.md)

These reports are preserved verbatim, including their original evidence links, limitations and statements that findings were outstanding at the time. Use this status record for later remediation history. Referenced `work/` reproduction files belonged to the original local audit workspace; they are not bundled here.

## Recorded fixes deployed

| Earlier issue | Recorded resolution | Release evidence |
| --- | --- | --- |
| Scheduled backups and health checks inactive | Schedules restored; successful backup and monitoring runs verified | [PR #1](https://github.com/sujayjalui-commits/pink-delight-cakes/pull/1) |
| Fresh database migrations failed on duplicate columns | Baseline repaired; fresh/upgrade and data-preservation checks added | PR #1 |
| Deployments bypassed validation | PR/deploy checks and verified pre-migration backups added | PR #1 |
| Concurrent admin edits overwrote changes | Order versions and conflict responses added | [PR #2](https://github.com/sujayjalui-commits/pink-delight-cakes/pull/2) |
| Failed product/order writes left partial records | Related product/options and order/history writes made atomic | PR #2 |
| Inquiry retries created duplicate records/notifications | Submission retry keys, payload matching and duplicate notification suppression | PR #2 |
| Clearing quotes/delivery windows retained values | Explicit null clearing supported | PR #2 |
| Admin drafts were discarded during updates | Changed-field saves and draft-preservation improvements | PR #2; complete original draft-discard scenarios should remain regression targets |

PR #1 merged as `01728daae0ca88b88a72ac4c4067c5e596f3ae51`. Backup run `38095969451` verified export, temporary restore, integrity, foreign keys and artifact upload. Retention was 14 days; this historic artifact is not evidence of a usable backup today.

PR #2 merged as `88e15cdb95203d40fbba1cada8a93791b0e6431a` on 6 November. Pages run `42222702198` and Worker run `42222702045` succeeded, including backup/restore checks and migrations. Post-deploy health runs `42222812907` and `42222871176` succeeded. No new production mutation testing was performed for this document.

## Earlier gaps without a recorded complete fix

| ID | Finding / missing protection | Follow-up needed |
| --- | --- | --- |
| B01 | Concurrent requests can bypass rate limits; limiter fails open on DB errors | Atomic enforcement, safe failure policy and observable errors |
| B02 | Trimmed-length checks can admit oversized stored strings; no application body-byte cap | Normalize before storage, enforce field and body limits |
| B03 | Inquiry items/options/availability/estimates not all checked against current catalogue | Validate every line and derive estimates server-side |
| B04 | Impossible event dates and invalid ETA values accepted | Calendar validation, ETA ordering and explicit lead-time policy |
| B05 | Saved bags retain removed options, outdated prices and unavailable products | Reconcile against catalogue and require resolution before submission |
| B06 | Delivery times can use UTC instead of bakery timezone | Explicit bakery timezone for customer-facing labels |
| B07 | Sequential reference plus phone number is weak tracking authorization | Unguessable tokens or verification flow |
| B08 | Tracking phone numbers appear in API query strings and browser storage | Safer request transport, log redaction and clearing on shared devices |
| B09 | Sensitive tracking/admin responses lacked explicit no-store | Explicit private-response cache policy |
| B10 | Public errors can expose raw internal exception messages | Generic public errors with private diagnostic logging |
| B11 | Tracking does not display the full inquiry bag | Render returned cart items |
| B12 | Tracking WhatsApp contact is hardcoded | Resolve contact from current settings |
| B13 | Admin order list is unpaginated | Server-side pagination/search |
| B14 | Inline images inflate public API responses; every page fetches broad data | Cacheable media storage, caching policy and page-specific requests |
| B15 | External video URLs conflict with CSP | Align allowed hosts, validation and media policy |
| B16 | Health endpoint checks DB binding rather than successful query | Real database readiness check |
| B17 | Alert delivery unverified; scheduled health runs less frequent than configured | Verify alerts and monitoring frequency; on 1 November observed intervals were roughly 4–7 hours despite hourly configuration |
| B18 | End-to-end browser coverage incomplete | Inquiry, tracking and admin-edit regression coverage using isolated fixtures |

B05, B11 and B12 include frontend behavior affecting the backend/customer workflow; they are retained to preserve the complete earlier functionality list. B18 is not a claim that no automated tests exist: API, migration, backup and bundle checks were added later.

## Other original observations

The original audits also noted incomplete catalogue photography, large shared source modules, stale setup/documentation scripts, and duplicate historical migration numbering. These remain in the original reports rather than being silently omitted or represented as newly confirmed backend defects. The admin About-the-baker photo control was separately added in [PR #12](https://github.com/sujayjalui-commits/pink-delight-cakes/pull/12).

## Intentionally absent features

Online payment checkout and customer accounts were deferred by design. The product uses inquiries and manual quotes. Historical payment-provider scaffolding is not a working payment integration.

## Scope and next review

Original tests used synthetic local fixtures and read-only live checks. No demonstrated admin-auth bypass, SQL injection or exploitable stored XSS was reported. These were not exhaustive penetration tests. Parameterized SQL, password hashing, HttpOnly sessions, session revocation, mutation protections and CSP already existed.

Before closing a backlog item, reproduce it against current code, record the fix/PR, add an appropriate regression check and record deployment verification. Keep historical findings separate from current operational status. Suggested remaining order: rate limits and request limits; catalogue/date validation; tracking/privacy; then data delivery, pagination and broader coverage.
