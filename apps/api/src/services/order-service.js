import { seedCatalog } from "../../../../packages/shared/constants/seed-catalog.js";
import { validateOrderRequestDraft } from "../../../../packages/shared/schemas/order-request-schema.js";
import { createOrderRequest, getProductBySlug, hasDatabase } from "../db/d1-client.js";

function findSeedProduct(productIdOrSlug) {
  return seedCatalog.products.find(
    (product) => product.slug === productIdOrSlug || String(product.id) === String(productIdOrSlug)
  );
}

function createSeedProductSnapshot(product) {
  return JSON.stringify({
    slug: product.slug,
    name: product.name,
    category: product.category,
    startingPrice: product.startingPrice
  });
}

function createDatabaseProductSnapshot(product) {
  return JSON.stringify({
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    startingPrice: product.starting_price
  });
}

export async function createPublicOrderRequest(env, input) {
  if (!hasDatabase(env)) {
    return {
      ok: false,
      status: 503,
      error: "Order requests are temporarily unavailable"
    };
  }

  const draft = {
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail || "",
    productId: input.productId,
    fulfillmentType: input.fulfillmentType,
    status: "new"
  };

  const validation = validateOrderRequestDraft(draft);

  if (!validation.valid) {
    return {
      ok: false,
      error: "Validation failed",
      details: validation.errors
    };
  }

  const databaseProduct = await getProductBySlug(env, input.productId);
  const seedProduct = databaseProduct ? null : findSeedProduct(input.productId);
  const selectedProduct = databaseProduct || seedProduct;

  if (!selectedProduct) {
    return {
      ok: false,
      error: "Selected product is invalid"
    };
  }

  const payload = {
    ...draft,
    productId: databaseProduct ? databaseProduct.id : null,
    productSnapshot: databaseProduct ? createDatabaseProductSnapshot(databaseProduct) : createSeedProductSnapshot(seedProduct),
    flavor: input.flavor || "",
    sizeLabel: input.sizeLabel || "",
    servings: input.servings || "",
    eventDate: input.eventDate || "",
    addOn: input.addOn || "",
    notes: input.notes || "",
    sourceChannel: "website"
  };

  const persisted = await createOrderRequest(env, payload);

  if (!persisted) {
    return {
      ok: false,
      status: 503,
      error: "Order requests could not be saved right now"
    };
  }

  return {
    ok: true,
    orderRequest: persisted,
    persistence: "database"
  };
}
