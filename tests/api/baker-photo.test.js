import assert from "node:assert/strict";
import { test } from "node:test";
import { createTestEnv } from "../helpers/sqlite-d1.js";
import { getAdminBusinessSettingsView, updateAdminBusinessSettings } from "../../apps/api/src/services/admin-settings-service.js";
import { getPublicSettingsView } from "../../apps/api/src/services/catalog-service.js";
import { validateAdminSettingsInput } from "../../packages/shared/schemas/admin-settings-schema.js";

const settings = {
  brandName: "Pink Delight", currency: "INR", inquiryChannel: "website",
  featuredSpotlightTitle: "Old spotlight", featuredSpotlightImageUrl: "https://example.test/old.jpg"
};
const photo = "data:image/jpeg;base64,/9j/AA==";

test("baker photo persists on insert and update, clears independently of old spotlight data", async (t) => {
  const env = createTestEnv();
  t.after(() => env.DB.close());
  let result = await updateAdminBusinessSettings(env, { ...settings, bakerImageUrl: photo });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal((await getAdminBusinessSettingsView(env)).bakerImageUrl, photo);
  assert.equal((await getPublicSettingsView(env)).bakerImageUrl, photo);
  result = await updateAdminBusinessSettings(env, { ...settings, bakerImageUrl: "https://example.test/baker.webp" });
  assert.equal(result.settings.bakerImageUrl, "https://example.test/baker.webp");
  await updateAdminBusinessSettings(env, settings); // older admin tab
  assert.equal((await getPublicSettingsView(env)).bakerImageUrl, "https://example.test/baker.webp");
  await updateAdminBusinessSettings(env, { ...settings, bakerImageUrl: "" });
  const cleared = await getPublicSettingsView(env);
  assert.equal(cleared.bakerImageUrl, null);
  assert.equal(cleared.featuredSpotlightImageUrl, settings.featuredSpotlightImageUrl);
  assert.equal(env.DB.businessSettings.featured_spotlight_title, settings.featuredSpotlightTitle);
});

test("legacy spotlight does not become the baker photo", async (t) => {
  const env = createTestEnv();
  t.after(() => env.DB.close());
  assert.equal((await updateAdminBusinessSettings(env, settings)).ok, true);
  assert.equal((await getPublicSettingsView(env)).bakerImageUrl, null);
});

test("baker photo validation accepts compressed uploads and rejects unsafe or oversized values", async (t) => {
  for (const bakerImageUrl of [photo, "https://example.test/baker.jpg", "", null]) {
    assert.equal(validateAdminSettingsInput({ ...settings, bakerImageUrl }).valid, true);
  }
  const env = createTestEnv();
  t.after(() => env.DB.close());
  await updateAdminBusinessSettings(env, { ...settings, bakerImageUrl: photo });
  for (const bakerImageUrl of ["javascript:alert(1)", "data:image/svg+xml;base64,AAAA", "file:///photo.jpg", 42, "https://example.test/" + "a".repeat(600000)]) {
    const result = await updateAdminBusinessSettings(env, { ...settings, bakerImageUrl });
    assert.equal(result.status, 400);
    assert.equal((await getPublicSettingsView(env)).bakerImageUrl, photo);
  }
});
