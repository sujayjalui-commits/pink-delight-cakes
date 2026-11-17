# Pink Delight Cakes — repository audit

Audited on 9 October 2026 (Asia/Calcutta). Repository: [sujayjalui-commits/pink-delight-cakes](https://github.com/sujayjalui-commits/pink-delight-cakes). Source revision: [a0a00c2](https://github.com/sujayjalui-commits/pink-delight-cakes/commit/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c), the current main commit returned during the audit, dated 1 July 2026.

The application is a working, inquiry-first home bakery platform with a public website, product catalogue, inquiry bag, tracking, and private operations dashboard. It has a sensible small-business architecture and useful defensive controls. The most urgent findings are inactive scheduled backups/monitoring and a migration history that cannot initialize an empty database. Several customer/admin data-integrity bugs also need correction.

This was an audit. Findings below remain outstanding; no repository changes were pushed, no workflows were enabled, and no live orders or admin data were changed.

**What the project does**

Pink Delight Cakes presents custom cakes and routes customers into a manually confirmed inquiry process. The public site identifies Pinky Sangoi as the founder. Customers browse products, choose options, submit either a single-product inquiry or an inquiry bag, receive a numeric reference, and follow up through WhatsApp. Tracking requires the reference and the original phone number. Pickup and local delivery are supported.

The cart is an inquiry collection, with estimated prices. It is not a payment checkout. Online payments were explicitly deferred in the project history. Manual payment-related statuses still exist in the admin workflow. Historical Razorpay schema/defaults are scaffolding, not evidence of a working payment integration.

| Area | Implementation |
| --- | --- |
| Public frontend | Static multipage HTML, CSS, vanilla JavaScript in apps/web |
| Customer pages | /, /menu/, /cart/, /inquiry-model/, /how-it-works/, /reviews/, /track/ |
| Admin | /admin/, with /admin.html redirect; orders, products, settings, testimonials |
| API | Cloudflare Worker in apps/api/worker.js; controllers, services, shared validators |
| Database | Cloudflare D1; SQL migrations and seeds under database |
| Browser admin authentication | Same-origin Pages Functions /api proxy, HttpOnly signed session cookie, database session version |
| Integrations | Optional Telegram inquiry notification; optional Sentry and monitoring webhook |
| Delivery | GitHub Actions deploy Cloudflare Pages and Worker; Worker workflow applies remote migrations |
| Tests | Node assertion-based API suite using an in-memory fake D1 implementation |

Source of truth for the frontend is apps/web. Root index.html and the loose HTML/TXT/PY design artifacts are historical/reference material.

**Confirmed findings, ordered by practical priority**

1. **P1 — Scheduled backups and health checks are disabled.** GitHub's API returned `disabled_inactivity` for both “D1 Backup” and “Production Healthcheck”. Their latest successful runs returned by the API were on 30 August 2026. The files still declare schedules, but those declarations are not currently producing scheduled runs. Restore both schedules, run each once, inspect the available backup artifacts, and verify a recovery procedure. The backup workflow requests 14-day artifact retention; this audit did not inspect Cloudflare-native recovery or other independent backups. Evidence: [workflow status API](https://api.github.com/repos/sujayjalui-commits/pink-delight-cakes/actions/workflows), [backup workflow](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/.github/workflows/d1-backup.yml#L4), [healthcheck workflow](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/.github/workflows/production-healthcheck.yml#L4).

2. **P1 — Fresh database setup fails at migration 004.** Applying the SQL files in filename order to an empty SQLite database succeeds through 003, then fails with `duplicate column name: delivery_pickup_copy`. Migration 001 already includes the six fields added again by 004, and also the profile/opening-time fields added again by 005. A new environment cannot replay the migration chain as committed. Reconcile the baseline with historical migrations and test both a fresh database and an existing database upgrade before changing production migration state. The existing live database was responding successfully. Evidence: [001 baseline](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/database/migrations/001_initial_schema.sql#L13), [004](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/database/migrations/004_business_settings_trust_content.sql#L1), [005](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/database/migrations/005_business_profile_seo_fields.sql#L1).

3. **P2 — Multi-step writes can leave partial data behind.** Product updates commit the product row, delete its options, and only then insert replacement options. An injected failure during the options batch left the product renamed and its options empty. Inquiry creation commits the order before writing its history entry; an injected history failure followed by a retry produced two saved inquiries and zero history entries. Order status updates similarly update the row before appending history. Group related writes atomically and introduce an idempotency strategy for inquiry retries. D1 supports transactional statement batches, so design the dependent inserts accordingly. Evidence: [product update](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/apps/api/src/db/d1-client.js#L438), [inquiry/history writes](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/apps/api/src/db/d1-client.js#L638), [Cloudflare batch semantics](https://developers.cloudflare.com/d1/worker-api/d1-database/).

4. **P2 — Clearing a quote or delivery window silently retains the old value.** The dashboard sends null when these fields are cleared. Persistence uses nullish coalescing, which treats that null as “keep the previous value”. A local reproduction returned success while retaining the old quote and both ETA timestamps. Distinguish an omitted field from an explicit null, then verify the fields stay cleared after reload. Evidence: [dashboard payload](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/apps/web/src/pages/admin/dashboard.js#L1016), [persistence](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/apps/api/src/db/d1-client.js#L551).

5. **P2 — Customer delivery times use the Worker's UTC timezone.** The API formats the customer-facing delivery-window string using en-IN but omits a timeZone. Locale changes formatting, not the runtime timezone. Under UTC, a stored 10:00Z start was rendered as 10:00 am instead of 3:30 pm in India. The frontend displays the preformatted label. Format explicitly in the bakery's configured timezone, or return timestamps and a timezone for client formatting. Evidence: [delivery formatter](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/apps/api/src/services/order-service.js#L453), [Cloudflare UTC runtime documentation](https://developers.cloudflare.com/workers/local-development/).

6. **P2 — Inquiry validation does not enforce the catalogue's current state.** Only the primary product is looked up. Secondary cart product IDs, names, options, and estimated prices come from the browser. A valid first item plus a nonexistent second product was accepted with altered prices. A product marked unavailable was also accepted, and the impossible date 2026-99-99 passed validation. Validate each line against current products/options and derive displayed estimates server-side. Validate calendar dates and deliberately define lead-time rules for this inquiry model. These are inquiry-integrity problems; the site has no automated payment checkout to undercharge. Evidence: [cart snapshot](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/apps/api/src/services/order-service.js#L224), [primary-product-only lookup](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/apps/api/src/services/order-service.js#L622), [request validation](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/packages/shared/schemas/order-request-schema.js#L115).

7. **P2 — Releases bypass the checks already present in the repository.** Neither deployment workflow runs npm test. Pages prepares its output without running the existing bundle checker. There is no pull-request validation workflow in this snapshot. Worker deployments apply remote migrations before release without first validating a fresh migration chain. Add CI gates for API tests, bundle checks, and database migrations; add real browser coverage for the central inquiry/admin flows. Evidence: [Pages deployment](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/.github/workflows/deploy-pages.yml), [Worker deployment](https://github.com/sujayjalui-commits/pink-delight-cakes/blob/a0a00c2e7aeaf9028dee6c63baa3c1f2a46c926c/.github/workflows/deploy-worker.yml).

**Additional improvements**

- **Public payload weight:** the live products response was 791,437 decoded bytes, and settings was 345,448 decoded bytes. Four product images were embedded as data URLs. Brotli was enabled, so these are not measured wire-transfer sizes. The shared storefront initializer fetches products/settings/testimonials on every page that loads it. Move images to cacheable asset storage, fetch only what each page needs, and add an explicit public-data caching policy.
- **Catalogue completeness:** the API returned 22 records; the rendered menu showed 19 public products, including 15 “Photo coming soon” cards. Real cake photography is a clear customer-facing improvement.
- **Media configuration mismatch:** product-video handling accepts external URLs, including Drive/Dropbox transformations, but the live CSP has no media-src and falls back to default-src 'self'. Remote video sources therefore conflict with the policy. No live products currently had video URLs. Align allowed media hosting, validation, and CSP; do not broadly weaken CSP.
- **Operational hardening:** rate limiting uses separate count/insert calls and deliberately fails open on database errors. Monitoring should make those failures actionable. Sensitive admin/tracking responses should explicitly use no-store, and public 500 responses should avoid exposing raw exception details.
- **Maintainability/documentation:** storefront.js is roughly 129 KB, dashboard.js 127 KB, and storefront.css 156 KB. Split by responsibility when touching these areas. README “next steps”, some phase notes, and dev/database scripts still describe earlier scaffolding. Two migrations use the 015 prefix; use unambiguous future numbering, though this duplication was not the reproduced migration failure.

**What was verified**

| Check | Result |
| --- | --- |
| Repository snapshot integrity | All 147 downloaded tracked files match their Git blob hashes |
| Dependency installation | Locked dependencies installed with lifecycle scripts disabled |
| npm dependency audit | 0 known vulnerabilities reported at audit time |
| Existing API suite | All 23 tests passed |
| Pages preparation and bundle validation | Passed; 17 required files and 14 stamped files checked |
| Production HTTP checks | Passed; API returned 22 products and expected brand |
| Repository “browser smoke” script | Passed for all 8 pages; this script checks HTTP/markup/headers, not browser interactions |
| Admin auth read-only checks | Same-origin unauthenticated session returned 401; direct browser-style cross-origin Worker request returned 400 |
| Actual browser spot checks | Home/menu rendered; menu checked at desktop and 390-pixel phone width; no horizontal overflow observed; mobile navigation expanded |
| Fresh migration replay | Failed at migration 004 |
| Local edge-case reproductions | Confirmed findings 3–6 using synthetic data, fake D1, and UTC formatting |

The code already uses parameterized SQL, HTML escaping in many dynamic render paths, password hashing, signed HttpOnly cookies, session invalidation, mutation-intent/fetch-site checks, request limits, and a strict CSP. Existing tests exercise many of these behaviors.

This is a focused source and operational audit, not exhaustive penetration testing or a full accessibility/performance certification. Authentication with a real admin account, Cloudflare secret configuration, backup restoration, every UI interaction, and live mutation paths were not exercised. SQL replay used local SQLite rather than the hosted D1 engine; the duplicate-column failure is directly explained by the committed SQL. Local failure-injection cases demonstrate code behavior, not observed production data loss.

Suggested order of work: restore and verify scheduled operations; repair fresh database provisioning and add deployment checks; fix atomic writes, null clearing, timezone handling, and catalogue validation; then improve media delivery, photos, and maintainability.
