# Order save and retry guarantees

Admin order responses include an integer `version`. Send that version with every
PATCH, including bulk status updates. The API rejects missing versions with 400
and stale versions with 409. On conflict the dashboard retains the draft. Copy any
needed draft text, use **Refresh orders**, review the latest state, then save again.
The dashboard sends changed fields only. Explicit null clears quote/ETA values.

Each successful update increments the version. A guarded update and its status
history entry run in one D1 transaction. Product creation/options and product
replacement/options also run in one transaction. A failed statement rolls back
all related writes. No new database engine is needed.

Public inquiry POSTs accept `submissionKey` (16–128 letters, digits, underscores
or hyphens). The storefront creates a random UUID and keeps it with a SHA-256
payload digest in sessionStorage; it stores no customer details in that record.
Identical submissions in the same tab, including reload/retry after a lost
response, reuse the key. Changed details generate a new key. Storage restrictions
fall back to page memory. Closing the tab or using another device starts a new
submission; this is not fuzzy matching of independent customer inquiries.

The server stores the unique key and a canonical payload hash on the inquiry.
Matching retries return the original receipt with HTTP 200; first saves use 201.
Reusing a key with different details returns 409. The transaction handles races
as well as sequential retries. Receipt responses exclude internal admin fields
and retry credentials and use `Cache-Control: no-store`. Retried receipts do not
queue another Telegram notification. Notification delivery remains best effort;
there is no durable notification outbox in this change. Normal rate limits still
apply to retries. Legacy clients without a key retain atomic saves, but lack retry
deduplication; current storefront clients always send keys.

Migration `016_order_integrity.sql` adds columns/index only. Existing inquiries
start at version 1 and retain all existing data/history. Apply migrations before
deploying the Worker; refresh already-open admin tabs after release. The existing
Worker deployment workflow takes a verified backup before migrations.

With Node.js 24, `npm test` runs the original HTTP suite against real SQLite plus concurrency,
rollback, retry/privacy, and form regression cases. The SQLite test adapter uses
transactional D1-shaped batches. The Linux validation workflow separately replays
migrations with local D1. Neither check mutates hosted customer data.
