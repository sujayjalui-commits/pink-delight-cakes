import assert from "node:assert/strict";
import { test } from "node:test";
import { createTestEnv, createExecutionContext } from "../helpers/sqlite-d1.js";
import { updateAdminOrder } from "../../apps/api/src/services/admin-order-service.js";
import { createPublicOrderRequest } from "../../apps/api/src/services/order-service.js";
import { createProductWithOptions, updateProductWithOptions } from "../../apps/api/src/db/d1-client.js";
import { handleCreateOrderRequest } from "../../apps/api/src/controllers/public-controller.js";

const product = { id: 11, slug: "test-cake", name: "Test cake", category: "birthday",
  short_description: "Synthetic cake", starting_price: 1800, lead_time_hours: 24, availability_status: "available" };
const inquiry = { customerName: "Fixture", customerPhone: "9000000000", productId: "test-cake",
  fulfillmentType: "pickup", notes: "Synthetic request", submissionKey: "test-submission-key-0001" };
const order = { id: 42, customer_name: "Fixture", customer_phone: "9000000000", product_snapshot: "{}",
  fulfillment_type: "local_delivery", status: "paid", quoted_amount: 1800, internal_note: "Keep this note",
  delivery_status: "delivery_pending", delivery_eta_start: "2026-12-01T10:00:00Z" };
const productInput = { slug: "test-cake", name: "Updated cake", category: "birthday", shortDescription: "New copy",
  startingPrice: 2000, badge: null, leadTimeHours: 24, availabilityStatus: "available", featured: false,
  imageUrl: null, videoUrl: null, flavors: ["Chocolate"], sizes: [{ label: "1 kg", price: 2000, servings: "8" }], addOns: [] };
function fixture(t, seed = {}) {
  const env = createTestEnv(seed);
  t.after(() => env.DB.close());
  return env;
}
function failHistory(db) {
  db.sqlite.exec("CREATE TRIGGER fail_history BEFORE INSERT ON order_request_status_history BEGIN SELECT RAISE(ABORT, 'injected history failure'); END");
}

test("simultaneous status and note edits cannot overwrite each other", async (t) => {
  const env = fixture(t, { orderRequests: [order] });
  const results = await Promise.all([
    updateAdminOrder(env, 42, { version: 1, status: "scheduled" }),
    updateAdminOrder(env, 42, { version: 1, internalNote: "Concurrent note" })
  ]);
  assert.equal(results.filter((result) => result.ok).length, 1);
  assert.equal(results.find((result) => !result.ok).status, 409);
  assert.equal(env.DB.orderRequests[0].version, 2);
  assert.equal(env.DB.orderRequests[0].status, "scheduled");
  assert.equal(env.DB.orderRequests[0].internal_note, "Keep this note");
  assert.deepEqual(env.DB.orderStatusHistory.map(({ from_status, to_status }) => [from_status, to_status]), [["paid", "scheduled"]]);
  const retry = await updateAdminOrder(env, 42, { version: 2, internalNote: "Reviewed note" });
  assert.equal(retry.order.status, "scheduled");
  assert.equal(retry.order.version, 3);
  assert.equal(env.DB.orderStatusHistory.length, 1);
});

test("concurrent cancellation cannot be undone by stale scheduling", async (t) => {
  const env = fixture(t, { orderRequests: [order] });
  const results = await Promise.all([
    updateAdminOrder(env, 42, { version: 1, status: "cancelled" }),
    updateAdminOrder(env, 42, { version: 1, status: "scheduled" })
  ]);
  assert.equal(results[0].ok, true);
  assert.equal(results[1].status, 409);
  assert.equal(env.DB.orderRequests[0].status, "cancelled");
  assert.equal(env.DB.orderStatusHistory.length, 1);
});

test("a stale browser version is rejected before transition validation", async (t) => {
  const env = fixture(t, { orderRequests: [{ ...order, version: 2 }] });
  assert.equal((await updateAdminOrder(env, 42, { version: 1, internalNote: "stale" })).status, 409);
  assert.equal((await updateAdminOrder(env, 42, { internalNote: "unversioned" })).status, 400);
  assert.equal(env.DB.orderRequests[0].internal_note, order.internal_note);
});

test("history failure rolls back order fields and version", async (t) => {
  const env = fixture(t, { orderRequests: [order] });
  failHistory(env.DB);
  await assert.rejects(updateAdminOrder(env, 42, { version: 1, status: "scheduled", quotedAmount: 2200 }), /injected history failure/);
  assert.equal(env.DB.orderRequests[0].status, "paid");
  assert.equal(env.DB.orderRequests[0].quoted_amount, 1800);
  assert.equal(env.DB.orderRequests[0].version, 1);
});

test("explicit null clears quote and ETA without touching other fields", async (t) => {
  const env = fixture(t, { orderRequests: [order] });
  const result = await updateAdminOrder(env, 42, { version: 1, quotedAmount: null, deliveryEtaStart: null });
  assert.equal(result.ok, true);
  assert.equal(result.order.quotedAmount, null);
  assert.equal(result.order.deliveryEtaStart, null);
  assert.equal(result.order.internalNote, order.internal_note);
  assert.equal(result.order.status, "paid");
});

test("inquiry history failure leaves no inquiry, and retry saves exactly one", async (t) => {
  const env = fixture(t, { products: [product] });
  failHistory(env.DB);
  await assert.rejects(createPublicOrderRequest(env, inquiry), /injected history failure/);
  assert.equal(env.DB.orderRequests.length, 0);
  env.DB.sqlite.exec("DROP TRIGGER fail_history");
  const saved = await createPublicOrderRequest(env, inquiry);
  const retried = await createPublicOrderRequest(env, inquiry);
  assert.equal(saved.orderRequest.id, retried.orderRequest.id);
  assert.equal(saved.replayed, false);
  assert.equal(retried.replayed, true);
  assert.equal(env.DB.orderRequests.length, 1);
  assert.equal(env.DB.orderStatusHistory.length, 1);
});

test("simultaneous retries create one inquiry and one history entry", async (t) => {
  const env = fixture(t, { products: [product] });
  const results = await Promise.all(Array.from({ length: 12 }, () => createPublicOrderRequest(env, inquiry)));
  assert.equal(results.filter((result) => !result.replayed).length, 1);
  assert.equal(new Set(results.map((result) => result.orderRequest.id)).size, 1);
  assert.equal(env.DB.orderRequests.length, 1);
  assert.equal(env.DB.orderStatusHistory.length, 1);
});

test("same key with changed details conflicts even in a race; new keys allow new orders", async (t) => {
  const env = fixture(t, { products: [product] });
  const results = await Promise.all([
    createPublicOrderRequest(env, inquiry), createPublicOrderRequest(env, { ...inquiry, notes: "Changed" })
  ]);
  assert.equal(results.filter((result) => result.ok).length, 1);
  assert.equal(results.find((result) => !result.ok).status, 409);
  assert.equal(env.DB.orderRequests.length, 1);
  assert.equal((await createPublicOrderRequest(env, { ...inquiry, submissionKey: "test-submission-key-0002" })).ok, true);
  assert.equal(env.DB.orderRequests.length, 2);
});

test("retry after catalogue/admin edits returns original receipt without private fields", async (t) => {
  const env = fixture(t, { products: [product] });
  const first = await createPublicOrderRequest(env, inquiry);
  env.DB.sqlite.exec("UPDATE products SET name='Changed name'; UPDATE order_requests SET internal_note='Secret', status='quoted', quoted_amount=5000");
  const retry = await createPublicOrderRequest(env, inquiry);
  assert.deepEqual(retry.orderRequest, first.orderRequest);
  for (const field of ["internal_note", "quoted_amount", "version", "submission_key", "submission_hash"]) {
    assert.equal(field in retry.orderRequest, false);
  }
});

test("invalid retry keys are rejected and legacy clients keep atomic creation", async (t) => {
  const env = fixture(t, { products: [product] });
  for (const submissionKey of [null, "", "short", "x".repeat(129), "invalid key with spaces"]) {
    assert.equal((await createPublicOrderRequest(env, { ...inquiry, submissionKey })).status, 400);
  }
  assert.equal(env.DB.orderRequests.length, 0);
  const legacy = { ...inquiry };
  delete legacy.submissionKey;
  assert.equal((await createPublicOrderRequest(env, legacy)).ok, true);
  assert.equal(env.DB.orderRequests.length, 1);
  assert.equal(env.DB.orderStatusHistory.length, 1);
});

test("HTTP retries return 200 and do not repeat owner notifications", async (t) => {
  const env = fixture(t, { products: [product] });
  env.TELEGRAM_BOT_TOKEN = "test-token";
  env.TELEGRAM_CHAT_ID = "fixture";
  const originalFetch = globalThis.fetch;
  let notifications = 0;
  globalThis.fetch = async () => { notifications++; return new Response("{}", { status: 200 }); };
  t.after(() => { globalThis.fetch = originalFetch; });
  const ctx = createExecutionContext();
  const submit = () => handleCreateOrderRequest(new Request("https://example.test/api/order-requests", {
    method: "POST", headers: { "Content-Type": "application/json", "cf-connecting-ip": "203.0.113.1" }, body: JSON.stringify(inquiry)
  }), env, ctx);
  const first = await submit();
  const second = await submit();
  await Promise.all(ctx.tasks);
  assert.equal(first.status, 201);
  assert.equal(second.status, 200);
  assert.equal(second.headers.get("cache-control"), "no-store");
  assert.equal(notifications, 1);
});

test("failed product option replacement rolls back product and all options", async (t) => {
  const env = fixture(t, { products: [product], productOptions: [{ product_id: 11, option_group: "flavor", option_label: "Original" }] });
  env.DB.sqlite.exec("CREATE TRIGGER fail_option BEFORE INSERT ON product_options WHEN NEW.option_group='size' BEGIN SELECT RAISE(ABORT, 'injected option failure'); END");
  await assert.rejects(updateProductWithOptions(env, 11, productInput), /injected option failure/);
  assert.equal(env.DB.products[0].name, product.name);
  assert.equal(env.DB.productOptions.length, 1);
  assert.equal(env.DB.productOptions[0].option_label, "Original");
  await assert.rejects(createProductWithOptions(env, { ...productInput, slug: "new-cake" }), /injected option failure/);
  assert.equal(env.DB.products.length, 1);
  assert.equal(env.DB.productOptions.length, 1);
  env.DB.sqlite.exec("DROP TRIGGER fail_option");
  const created = await createProductWithOptions(env, { ...productInput, slug: "new-cake" });
  assert.equal(env.DB.productOptions.filter((option) => option.product_id === created.id).length, 2);
});
