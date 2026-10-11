import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const storefront = readFileSync(new URL("../../apps/web/src/pages/storefront.js", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../../apps/web/src/pages/admin/dashboard.js", import.meta.url), "utf8");

test("form retries reuse their key after a lost response or page reload; changed details get a new key", async () => {
  const values = new Map();
  const source = storefront.slice(storefront.indexOf("        const inquiryRetryRecords"), storefront.indexOf("        async function handleInquirySubmit"));
  function page(storage) {
    const context = vm.createContext({ crypto, TextEncoder, sessionStorage: storage });
    vm.runInContext(source, context);
    return context;
  }
  const storage = { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
  const payload = { customerName: "Private name", customerPhone: "9000000000", notes: "Original" };
  const first = page(storage);
  const key = await first.inquirySubmissionKey("single", payload);
  assert.equal(await first.inquirySubmissionKey("single", payload), key);
  assert.equal(await page(storage).inquirySubmissionKey("single", payload), key);
  assert.notEqual(await first.inquirySubmissionKey("single", { ...payload, notes: "Changed" }), key);
  assert.notEqual(await first.inquirySubmissionKey("cart", payload), key);
  assert.doesNotMatch(JSON.stringify([...values.values()]), /Private name|9000000000|Original|Changed/);
  const unavailable = page({ getItem() { throw Error("storage blocked"); }, setItem() { throw Error("storage blocked"); } });
  const memoryKey = await unavailable.inquirySubmissionKey("single", payload);
  assert.equal(await unavailable.inquirySubmissionKey("single", payload), memoryKey);
});

test("conflicted admin saves retain draft and version and submit only changed fields", async () => {
  const source = dashboard.slice(dashboard.indexOf("async function saveOrderPatch("), dashboard.indexOf("async function handleOrderSave("));
  const requests = [];
  const toasts = [];
  const baseline = { status: "paid", quotedAmount: 1800, internalNote: "Original" };
  const context = vm.createContext({
    state: { activeOrderId: 42, orders: [{ id: 42, fulfillmentType: "pickup", version: 3 }],
      formMeta: { order: { version: 2, baseline: JSON.stringify(baseline) } } },
    orderStatus: { value: "paid" }, orderQuotedAmount: { value: "1800" }, orderInternalNote: { value: "Unsaved draft" },
    orderSaveButton: {}, setButtonBusy() {}, showToast: (message) => toasts.push(message),
    apiRequest: async (path, options) => { requests.push(options.body); throw Object.assign(new Error("Reload the order"), { status: 409 }); },
    renderOverview() { assert.fail("Conflict must not rerender draft"); },
    renderOrdersList() { assert.fail("Conflict must not rerender draft"); },
    renderOrderDetail() { assert.fail("Conflict must not rerender draft"); },
    markFormSaved() { assert.fail("Conflict must not mark draft saved"); }
  });
  vm.runInContext(source, context);
  await context.saveOrderPatch({});
  assert.deepEqual(JSON.parse(JSON.stringify(requests[0])), { version: 2, internalNote: "Unsaved draft" });
  assert.equal(context.orderInternalNote.value, "Unsaved draft");
  assert.equal(context.state.formMeta.order.version, 2);
  assert.match(toasts[0], /Reload/);
  await context.saveOrderPatch({ quotedAmount: null });
  assert.equal(requests[1].quotedAmount, null);
});
