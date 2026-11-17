# Pink Delight Cakes — backend, security, and core functionality audit

Reviewed 10 October 2026, Asia/Calcutta. The latest main commit was rechecked and remains [a0a00c2](https://github.com/sujayjalui-commits/pink-delight-cakes/commit/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c). The complete local source snapshot contains 147 hash-verified tracked files. Live checks covered [the website](https://pink-delight-cakes.pages.dev/), its same-origin API, and the public Worker API. This report extends the 9 October repository audit.

The live pages and public API respond successfully. The biggest weaknesses are order data integrity, recovery readiness, and server-side validation. Authentication has meaningful protections; this review did not demonstrate an admin authentication bypass, SQL injection, or exploitable stored XSS. These findings concern the application and its operations: changing from D1/SQLite to PostgreSQL alone would not resolve them.

Priority labels describe practical repair urgency, not vulnerability scores. High means address before relying on the site for more business; medium means a confirmed defect or protection gap that should follow promptly. Failure and concurrency cases below used synthetic local data, not production customer records.

**1. High — Simultaneous admin edits can undo order status changes**

The service checks a transition against a fetched order, then the database function reads again and writes every editable field using that snapshot. The update only matches the order ID; it has no version check. Two requests can therefore overwrite each other even when editing different fields.

Local SQLite reproduction: a status change from paid to scheduled and a concurrent internal-note edit both returned success, but the final status was paid. History still recorded paid → scheduled. A separate cancellation/scheduling race left the supposedly cancelled inquiry scheduled. Two tabs, overlapping requests, or automation could trigger this; it does not require multiple admin accounts.

Fix: add optimistic concurrency control, reject stale changes with a conflict response, and commit the validated transition and its history together. Patch only fields actually supplied. A transaction around writes alone is insufficient if the earlier validation still uses stale state.

Evidence: [transition validation](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/apps/api/src/services/admin-order-service.js#L106), [whole-row update](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/apps/api/src/db/d1-client.js#L540).

**2. High — Failed saves can leave partial records or duplicate inquiries**

Product editing updates the product, deletes old options, then inserts replacements separately. An injected insertion failure left the product changed with zero options. Inquiry creation saves the inquiry before adding history. Injecting a history failure and retrying produced two saved inquiries, zero history entries, and two failed requests. Status updates also write history separately.

Fix: group related writes into an atomic operation and add a unique idempotency key for inquiry submissions, so a retry returns the original result. D1 supports transactional statement batches; this repair does not require PostgreSQL. [D1 batch documentation](https://developers.cloudflare.com/d1/worker-api/d1-database/).

Evidence: [product writes](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/apps/api/src/db/d1-client.js#L433), [inquiry/history writes](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/apps/api/src/db/d1-client.js#L607). Reproduced with real local SQLite and an adapter that rolls back failed batches.

**3. High — Scheduled backups and health checks are inactive**

GitHub currently reports both D1 Backup and Production Healthcheck as `disabled_inactivity`. The latest successful runs returned during this review were dated 30 August 2026. The backup workflow requests only 14 days of artifact retention, so those historical successes do not establish that a usable backup is available today.

Fix: restore the schedules, run them, check the actual retained backups, and test restoration into an isolated database. Cloudflare-native recovery and any independent backups were not inspected; this finding does not establish that every backup mechanism is absent.

Evidence: [current workflow state](https://api.github.com/repos/sujayjalui-commits/pink-delight-cakes/actions/workflows), [backup workflow](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/.github/workflows/d1-backup.yml), [health-check workflow](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/.github/workflows/production-healthcheck.yml).

**4. High — A clean database cannot run the committed migration chain**

Fresh SQLite replay stops at migration 004 with `duplicate column name: delivery_pickup_copy`. Migration 001 already defines fields that 004 adds again. Migration 005 also repeats baseline fields, including address_line_1. This blocks reproducible environment setup and rebuilding the schema from migrations. It is not evidence that the existing production database is currently down.

Fix: reconcile the baseline and historical migrations without blindly changing production migration bookkeeping. Verify both clean installation and upgrades from the existing schema.

Evidence: [001](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/database/migrations/001_initial_schema.sql#L13), [004](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/database/migrations/004_business_settings_trust_content.sql#L1), [005](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/database/migrations/005_business_profile_seo_fields.sql#L1).

**5. Medium — Rate limits can be exceeded by overlapping requests and fail open**

The limiter counts recent events and inserts a new event in separate operations. Concurrent requests can all observe room in the same limit. A local FakeD1 reproduction admitted 30 simultaneous requests for each configured bucket: login limit 10, tracking limit 12, inquiry limit 6. Subsequent sequential calls were blocked, confirming the race. A simulated limiter database failure permitted every attempt.

This weakens resistance to password guessing, tracking enumeration, and inquiry spam. It is not proof that those attacks have occurred, nor that 30 is a measured production threshold.

Fix: use atomic enforcement, make limiter failures observable, and define a safe fallback for authentication and tracking. Consider additional account-aware and edge controls where appropriate. Verify effective client identity through the Pages proxy before relying on per-IP controls.

Evidence: [count/check/insert and fail-open branch](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/apps/api/src/services/rate-limit-service.js#L45).

**6. Medium — Input limits do not reliably bound accepted data**

String validation checks the trimmed length, but persistence can keep the original string. The public inquiry service accepted and stored a 100,001-character notes value despite its declared 800-character limit. The JSON reader also reads the complete request body without an application-level byte cap. Platform request limits still exist; this finding is about missing application limits.

Fix: normalize values once, validate and store those normalized values, enforce both byte and field limits, and return a controlled rejection before parsing oversized bodies. This closes a straightforward storage and processing abuse path.

Evidence: [trim-based validator](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/packages/shared/helpers/validation.js#L9), [original notes persisted](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/apps/api/src/services/order-service.js#L642), [body reader](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/apps/api/src/validators/request-body.js#L1).

**7. Medium — The server trusts cart details and accepts invalid dates**

Only the primary product is looked up. Cart snapshots preserve client-supplied names, options, and estimates instead of resolving every line against the catalogue. Local requests successfully submitted an unavailable product, a nonexistent second product, invented options, an altered total of ₹2, and event date `2026-99-99`. Admin ETA fields also accepted `not-a-date`.

Fix: validate every product and option against current server data, derive estimates on the server, reject unavailable selections, validate real calendar dates and ETA ordering, and return useful field errors. The site uses manual quotes, so this is inquiry-data corruption and customer confusion—not a demonstrated online-payment undercharge.

Evidence: [cart sanitization](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/apps/api/src/services/order-service.js#L224), [primary lookup](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/apps/api/src/services/order-service.js#L622), [public date validation](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/packages/shared/schemas/order-request-schema.js#L134), [admin validation](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/packages/shared/schemas/admin-order-schema.js#L29).

**8. Medium — Admin editing can silently discard or retain the wrong values**

- Searching, filtering, or sorting calls renderOrderDetail again, replacing the active form with saved values and resetting its dirty baseline. A local UI-function reproduction replaced an unsaved ₹1,800 quote and note with the old ₹1,500 quote and saved note, without a discard confirmation.
- Clearing a quote or delivery window sends null, but database code uses null-coalescing to retain the old value. The API reports success even though the requested clearing did not happen.

Fix: keep draft state separate from list rendering, guard actions that discard a draft, and distinguish an omitted field from explicit null. Add regression checks for both cases.

Evidence: [detail render and baseline reset](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/apps/web/src/pages/admin/dashboard.js#L1520), [search handler](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/apps/web/src/pages/admin/dashboard.js#L3125), [null handling](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/apps/api/src/db/d1-client.js#L551).

**9. Medium — Saved carts can submit different choices from those displayed**

Stored cart choices are not reconciled with changed catalogue options and prices. In a local reproduction, the current dropdown contained Vanilla / 1 kg while the submitted item still contained removed choices Strawberry / 0.5 kg. Two items retained a ₹1,200 old estimate instead of the current ₹2,800 estimate. A newly unavailable product also remained submit-ready.

Fix: reconcile stored carts after catalogue loading, flag changed or unavailable items, update estimates, and require customers to resolve invalid selections. Server validation must independently enforce the same rules.

The tracker also ignores returned cartItems, so customers cannot review the full bag there. Its WhatsApp support links use a hardcoded number rather than current business settings; changing the configured business number will not update that page.

Evidence: [cart rendering and payload](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/apps/web/src/pages/storefront.js#L1013), [tracking renderer/support link](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/apps/web/src/pages/tracking.js#L528).

**10. Medium — Customer delivery windows use the wrong timezone**

The API formats dates with the en-IN locale but no explicit timezone. Locale controls formatting, not timezone. The local UTC reproduction displayed 10:00 am for an instant that is 3:30 pm in India. Cloudflare documents that its production runtime uses UTC. [Runtime documentation](https://developers.cloudflare.com/workers/local-development/).

Fix: choose and label the bakery timezone explicitly, such as Asia/Kolkata, while retaining UTC instants for storage. Evidence: [delivery window formatting](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/apps/api/src/services/order-service.js#L453).

**11. Medium — Deployments bypass the available tests**

Neither deployment workflow runs npm test. Pages deploys without running the existing bundle checker. Worker deployment applies remote migrations without a clean migration rehearsal. The snapshot has no pull-request validation workflow. The existing tests use a fake database, which explains why passing tests do not establish migration or concurrency correctness.

Fix: gate releases on the API suite, Pages checks, fresh/upgrade migration tests, and a small set of real browser and database integration checks for inquiry submission, tracking, and admin editing.

Evidence: [Worker deployment](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/.github/workflows/deploy-worker.yml), [Pages deployment](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/.github/workflows/deploy-pages.yml).

**12. Medium — Tracking privacy relies on a weak shared secret**

Tracking uses a sequential reference plus a phone number. A phone number is often known to other people, so this deserves stronger protection, especially with the limiter weaknesses above. The phone is sent in a GET API query and kept in localStorage for convenience. Query strings can be retained by infrastructure logging, depending on its configuration. The visible page URL contains only the reference, not the phone.

Private JSON responses lack an explicit Cache-Control: no-store directive. A synthetic successful tracking response confirmed this; live unauthenticated admin responses also lacked it. This does not prove cross-user caching or a data leak.

Fix: prefer an unguessable tracking token or verification flow, keep phone data out of request URLs, explicitly disable storage of sensitive responses, provide a way to clear saved inquiry details on shared devices, and redact sensitive request data in logs. Also return generic public 500 errors instead of raw exception messages.

Evidence: [lookup authorization](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/apps/api/src/services/order-service.js#L669), [lookup request/storage](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/apps/web/src/pages/tracking.js#L593), [JSON headers](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/apps/api/src/utils/http.js#L11), [public exception details](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/apps/api/worker.js#L201).

**Additional improvements**

- Products returned 791,437 decoded bytes and public settings 345,448 decoded bytes: approximately 1.14 MB combined before considering other resources. Four product images are inline data URLs. These are decoded body sizes, not measured compressed network transfer. Move media to cacheable assets and reduce page-specific data fetching.
- Admin order listing is unpaginated. Add server-side pagination/search before the order table grows substantially.
- The previous day's browser check found 15 photo placeholders among 19 public products. The current API still returns 22 catalogue records, but the image completeness count was not rechecked in a browser today.
- External product-video URLs are accepted, while the current CSP has no media-src allowance for them. No live product videos were configured during the initial audit. Align supported media hosting and CSP before using this feature.
- The health response checks whether the DB binding exists, rather than itself verifying a database query. Preserve the broader product/settings smoke checks and add a meaningful database readiness check where needed.

**Verification and scope**

| Check | Result |
| --- | --- |
| Latest main/source integrity | Same commit; all 147 snapshot files match Git blob hashes |
| Existing API suite | 23/23 passed |
| npm dependency audit | 0 known advisories reported |
| Production HTTP and repository smoke scripts | Passed; all 8 main pages returned successfully |
| Live anonymous admin orders/settings/session | 401; no private data obtained |
| Direct browser-style cross-origin admin session | 400 |
| Local mutation protection tests | Cross-site and missing-intent requests rejected |
| Fresh SQLite migration replay | Failed at 004; 005 has another duplicate-column conflict |
| Local SQLite failure/concurrency cases | Partial saves, duplicates, lost updates, null clearing and invalid data reproduced |
| Local security fixtures | Rate-limit race/fail-open, length bypass, missing private cache directive reproduced |
| Local UI-function fixtures | Stale cart and discarded admin drafts reproduced |

The code has parameterized SQL, password hashing with salt, signed HttpOnly cookies, session revocation, mutation-intent/fetch-site checks, HTML escaping in reviewed render paths, and a restrictive CSP. Keep those protections while fixing the gaps.

Local reproduction scripts and results are retained under work/backend-audit, work/security-audit, and work/core-flow-audit. Public live evidence is in work/live-security-review-results.json. The scripts use synthetic fixtures; they are audit evidence, not committed regression tests. The repository's script named browser-smoke checks HTTP, markup, and headers rather than driving a browser. Today's UI edge cases used isolated JavaScript functions, not an authenticated production browser session.

This was not an exhaustive penetration test. No real admin login, live inquiry creation, production load test, hosted D1 fault injection, secret inspection, or backup restoration was performed. No repository source, production data, workflows, or deployments were changed.

Recommended sequence: verify recovery and scheduled operations; repair migrations and deployment gates; fix atomic/concurrent writes and inquiry retries; strengthen validation and rate limiting; repair drafts, carts, tracking, and delivery-time display; then optimize media and growing data lists.
