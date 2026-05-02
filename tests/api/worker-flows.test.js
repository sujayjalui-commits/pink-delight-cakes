import assert from "node:assert/strict";

import worker from "../../apps/api/worker.js";
import { createAdminSessionToken } from "../../apps/api/src/auth/sessions.js";
import { hashAdminPassword } from "../../apps/api/src/auth/passwords.js";
import { apiConfig } from "../../apps/api/src/config/api-config.js";
import { createExecutionContext, createTestEnv } from "../helpers/fake-d1.js";

function createProductSeed() {
  return {
    id: 11,
    slug: "signature-black-forest",
    name: "Signature Black Forest",
    category: "birthday",
    short_description: "Dark chocolate sponge with cherries and cream.",
    starting_price: 1800,
    badge: "Best seller",
    lead_time_hours: 24,
    availability_status: "available",
    featured: 1,
    image_url: "https://example.com/cake.jpg"
  };
}

function createBusinessSettingsSeed() {
  return {
    id: 1,
    brand_name: "Pink Delight Cakes",
    contact_email: "hello@pinkdelightcakes.com",
    contact_phone: "+91 87678 12121",
    instagram_handle: "@pinkdelightcakes",
    city: "Pune",
    address_line_1: "",
    address_line_2: "",
    state_region: "Maharashtra",
    postal_code: "",
    country_code: "IN",
    currency: "INR",
    payment_mode: "manual_quote",
    inquiry_channel: "website",
    delivery_pickup_copy: "Pickup and local delivery across Pune.",
    notice_period_copy: "Standard celebration cakes usually need 24 to 48 hours notice.",
    bakery_intro_title: "Fresh, careful, and celebration-ready.",
    bakery_intro_paragraph_1: "Home bakery rooted in warm celebrations.",
    bakery_intro_paragraph_2: "Every inquiry is handled personally.",
    response_time_copy: "Share your date, design idea, and servings for a quick quote.",
    featured_spotlight_title: "Baat Pakki engagement cake",
    featured_spotlight_description: "A customized engagement cake adorned with edible pearls and a fresh gypsy flower wreath at the base.",
    featured_spotlight_image_url: "src/assets/baat-pakki-engagement-cake.webp",
    featured_spotlight_source_url: "https://www.instagram.com/p/DXQtqPNjB1L/",
    hero_product_slug_1: "midnight-chocolate",
    hero_product_slug_2: "vintage-rose",
    hero_product_slug_3: "golden-butterscotch",
    hero_product_slug_4: "rasmalai-festive",
    weekday_open_time: "10:00",
    weekday_close_time: "20:00",
    saturday_open_time: "10:00",
    saturday_close_time: "20:00",
    sunday_open_time: "",
    sunday_close_time: "",
    created_at: "2026-04-18T00:00:00.000Z",
    updated_at: "2026-04-18T00:00:00.000Z"
  };
}

function createTestimonialsSeed() {
  return [
    {
      id: 1,
      customer_name: "Riya S.",
      occasion_label: "Birthday order",
      quote_text: "Exactly the cake we hoped for.",
      rating: 5,
      is_published: 1,
      sort_order: 1,
      created_at: "2026-04-18T00:00:00.000Z",
      updated_at: "2026-04-18T00:00:00.000Z"
    },
    {
      id: 2,
      customer_name: "Draft testimonial",
      occasion_label: "Hidden draft",
      quote_text: "This should stay private.",
      rating: 4,
      is_published: 0,
      sort_order: 2,
      created_at: "2026-04-18T00:00:00.000Z",
      updated_at: "2026-04-18T00:00:00.000Z"
    }
  ];
}

async function runTest(name, testFn) {
  try {
    await testFn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

await runTest("public inquiry submission persists a database-backed request", async () => {
  const env = createTestEnv({
    products: [createProductSeed()]
  });
  const executionCtx = createExecutionContext();
  const request = new Request("https://pink-delight-cakes-api.sujayjalui.workers.dev/api/order-requests", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://pink-delight-cakes.pages.dev",
      "cf-connecting-ip": "203.0.113.12"
    },
    body: JSON.stringify({
      customerName: "Amiya",
      customerPhone: "+91 87678 12121",
      customerEmail: "amiya@example.com",
      productId: "signature-black-forest",
      fulfillmentType: "pickup",
      flavor: "Black Forest",
      sizeLabel: "2 kg",
      servings: "20",
      eventDate: "2026-05-01",
      addOn: "Candles",
      notes: "Less sweet, please."
    })
  });

  const response = await worker.fetch(request, env, executionCtx);
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.ok, true);
  assert.equal(payload.persistence, "database");
  assert.equal(payload.orderRequest.customer_name, "Amiya");
  assert.equal(JSON.parse(payload.orderRequest.product_snapshot).slug, "signature-black-forest");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.equal(env.DB.orderRequests.length, 1);
  assert.equal(env.DB.orderStatusHistory.length, 1);
  assert.equal(env.DB.orderStatusHistory[0].from_status, null);
  assert.equal(env.DB.orderStatusHistory[0].to_status, "new");
  assert.equal(env.DB.orderStatusHistory[0].change_source, "public_inquiry");
  assert.equal(env.DB.rateLimitEvents.length, 1);
});

await runTest("public inquiry submission queues a Telegram owner notification when configured", async () => {
  const env = createTestEnv({
    products: [createProductSeed()]
  });
  env.TELEGRAM_BOT_TOKEN = "telegram-test-token";
  env.TELEGRAM_CHAT_ID = "123456";
  const executionCtx = createExecutionContext();
  const originalFetch = globalThis.fetch;
  const fetchCalls = [];

  globalThis.fetch = async (url, init = {}) => {
    fetchCalls.push({ url: String(url), init });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "content-type": "application/json"
      }
    });
  };

  try {
    const request = new Request("https://pink-delight-cakes-api.sujayjalui.workers.dev/api/order-requests", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://pink-delight-cakes.pages.dev",
        "cf-connecting-ip": "203.0.113.13"
      },
      body: JSON.stringify({
        customerName: "Amiya",
        customerPhone: "+91 87678 12121",
        customerEmail: "amiya@example.com",
        productId: "signature-black-forest",
        fulfillmentType: "pickup",
        flavor: "Black Forest",
        sizeLabel: "2 kg",
        servings: "20",
        eventDate: "2026-05-01",
        addOn: "Candles",
        notes: "Please confirm pickup timing."
      })
    });

    const response = await worker.fetch(request, env, executionCtx);
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.ok, true);
    assert.ok(executionCtx.tasks.length >= 1);

    await Promise.all(executionCtx.tasks);

    assert.equal(fetchCalls.length, 1);
    assert.match(fetchCalls[0].url, /api\.telegram\.org\/bottelegram-test-token\/sendMessage/);
    const telegramPayload = JSON.parse(fetchCalls[0].init.body);
    assert.equal(telegramPayload.chat_id, "123456");
    assert.match(telegramPayload.text, /Reference: #1/);
    assert.match(telegramPayload.text, /Customer: Amiya/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await runTest("public inquiry submission still succeeds when Telegram notification fails", async () => {
  const env = createTestEnv({
    products: [createProductSeed()]
  });
  env.TELEGRAM_BOT_TOKEN = "telegram-test-token";
  env.TELEGRAM_CHAT_ID = "123456";
  const executionCtx = createExecutionContext();
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => {
    throw new Error("Telegram offline");
  };

  try {
    const request = new Request("https://pink-delight-cakes-api.sujayjalui.workers.dev/api/order-requests", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://pink-delight-cakes.pages.dev",
        "cf-connecting-ip": "203.0.113.14"
      },
      body: JSON.stringify({
        customerName: "Amiya",
        customerPhone: "+91 87678 12121",
        customerEmail: "amiya@example.com",
        productId: "signature-black-forest",
        fulfillmentType: "pickup",
        flavor: "Black Forest",
        sizeLabel: "1 kg",
        servings: "8",
        eventDate: "2026-05-03",
        addOn: "",
        notes: "Evening pickup preferred."
      })
    });

    const response = await worker.fetch(request, env, executionCtx);
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.ok, true);
    assert.ok(executionCtx.tasks.length >= 1);
    await Promise.all(executionCtx.tasks);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

await runTest("cart inquiry stores a structured snapshot and remains visible to admin and tracking", async () => {
  const admin = {
    id: 21,
    email: "owner@pinkdelightcakes.com",
    role: "owner",
    is_active: 1
  };
  const env = createTestEnv({
    products: [createProductSeed()],
    adminUsers: [admin]
  });
  const executionCtx = createExecutionContext();
  const request = new Request("https://pink-delight-cakes-api.sujayjalui.workers.dev/api/order-requests", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://pink-delight-cakes.pages.dev",
      "cf-connecting-ip": "203.0.113.44"
    },
    body: JSON.stringify({
      customerName: "Riya",
      customerPhone: "+91 98765 43210",
      customerEmail: "riya@example.com",
      productId: "signature-black-forest",
      fulfillmentType: "pickup",
      flavor: "Black Forest",
      sizeLabel: "1 kg",
      servings: "8",
      eventDate: "2026-05-05",
      addOn: "Candles",
      notes: "Please quote the full bag together.",
      cartItems: [
        {
          productId: "signature-black-forest",
          productName: "Signature Black Forest",
          flavor: "Black Forest",
          sizeLabel: "1 kg",
          servings: "8",
          addOn: "Candles",
          quantity: 2,
          itemNotes: "Birthday message on one cake.",
          startingPrice: 1800,
          estimatedLineTotal: 3600
        },
        {
          productId: "signature-black-forest",
          productName: "Signature Black Forest",
          flavor: "Chocolate",
          sizeLabel: "Half kg",
          servings: "4",
          addOn: "",
          quantity: 1,
          itemNotes: "Less sweet.",
          startingPrice: 950,
          estimatedLineTotal: 950
        }
      ]
    })
  });

  const response = await worker.fetch(request, env, executionCtx);
  const payload = await response.json();
  const cartSnapshot = JSON.parse(env.DB.orderRequests[0].cart_snapshot);

  assert.equal(response.status, 201);
  assert.equal(payload.ok, true);
  assert.equal(cartSnapshot.kind, "inquiry_cart");
  assert.equal(cartSnapshot.items.length, 2);
  assert.equal(cartSnapshot.itemCount, 3);
  assert.equal(cartSnapshot.estimatedStartingTotal, 4550);
  assert.equal(env.DB.orderRequests[0].delivery_status, "not_applicable");

  const sessionToken = await createAdminSessionToken(admin, env);
  const adminResponse = await worker.fetch(
    new Request("https://pink-delight-cakes.pages.dev/api/admin/orders", {
      headers: {
        origin: "https://pink-delight-cakes.pages.dev",
        cookie: `${apiConfig.adminSessionCookieName}=${sessionToken}`
      }
    }),
    env,
    createExecutionContext()
  );
  const adminPayload = await adminResponse.json();

  assert.equal(adminResponse.status, 200);
  assert.equal(adminPayload.orders[0].cartSnapshot.items.length, 2);
  assert.equal(adminPayload.orders[0].cartItemCount, 3);

  const trackingResponse = await worker.fetch(
    new Request(`https://pink-delight-cakes-api.sujayjalui.workers.dev/api/order-requests/lookup?referenceId=${payload.orderRequest.id}&phone=%2B91%2098765%2043210`, {
      headers: {
        origin: "https://pink-delight-cakes.pages.dev"
      }
    }),
    env,
    createExecutionContext()
  );
  const trackingPayload = await trackingResponse.json();

  assert.equal(trackingResponse.status, 200);
  assert.equal(trackingPayload.orderRequest.productName, "Cart inquiry (3 items)");
  assert.equal(trackingPayload.orderRequest.cartItemCount, 3);
  assert.equal(trackingPayload.orderRequest.cartItems.length, 2);
  assert.equal(trackingPayload.orderRequest.deliveryTracking, null);
});

await runTest("local delivery inquiries start with pending delivery tracking metadata", async () => {
  const env = createTestEnv({
    products: [createProductSeed()]
  });
  const executionCtx = createExecutionContext();
  const request = new Request("https://pink-delight-cakes-api.sujayjalui.workers.dev/api/order-requests", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://pink-delight-cakes.pages.dev",
      "cf-connecting-ip": "203.0.113.45"
    },
    body: JSON.stringify({
      customerName: "Riya",
      customerPhone: "+91 99887 66554",
      customerEmail: "riya@example.com",
      productId: "signature-black-forest",
      fulfillmentType: "local_delivery",
      flavor: "Black Forest",
      sizeLabel: "1 kg",
      servings: "8",
      eventDate: "2026-05-08",
      addOn: "Candles",
      notes: "Please ring before delivery."
    })
  });

  const response = await worker.fetch(request, env, executionCtx);
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.ok, true);
  assert.equal(env.DB.orderRequests[0].delivery_status, "delivery_pending");
  assert.equal(env.DB.orderRequests[0].delivery_eta_start, null);
  assert.equal(env.DB.orderRequests[0].delivery_note, null);

  const trackingResponse = await worker.fetch(
    new Request(`https://pink-delight-cakes-api.sujayjalui.workers.dev/api/order-requests/lookup?referenceId=${payload.orderRequest.id}&phone=%2B91%2099887%2066554`, {
      headers: {
        origin: "https://pink-delight-cakes.pages.dev"
      }
    }),
    env,
    createExecutionContext()
  );
  const trackingPayload = await trackingResponse.json();

  assert.equal(trackingResponse.status, 200);
  assert.equal(trackingPayload.orderRequest.fulfillmentType, "local_delivery");
  assert.equal(trackingPayload.orderRequest.deliveryTracking.status, "delivery_pending");
  assert.equal(trackingPayload.orderRequest.deliveryTracking.statusLabel, "Delivery details pending");
});

await runTest("cart inquiry rejects malformed cart payloads", async () => {
  const env = createTestEnv({
    products: [createProductSeed()]
  });
  const request = new Request("https://pink-delight-cakes-api.sujayjalui.workers.dev/api/order-requests", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://pink-delight-cakes.pages.dev",
      "cf-connecting-ip": "203.0.113.45"
    },
    body: JSON.stringify({
      customerName: "Riya",
      customerPhone: "+91 98765 43210",
      productId: "signature-black-forest",
      fulfillmentType: "pickup",
      cartItems: [
        {
          productId: "signature-black-forest",
          quantity: 99
        }
      ]
    })
  });

  const response = await worker.fetch(request, env, createExecutionContext());
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.ok, false);
  assert.equal(payload.details.some((detail) => detail.includes("quantity must be between")), true);
  assert.equal(env.DB.orderRequests.length, 0);
});

await runTest("public catalog loads product options in one bulk query instead of per-product queries", async () => {
  const env = createTestEnv({
    products: [
      createProductSeed(),
      {
        id: 12,
        slug: "mango-celebration",
        name: "Mango Celebration",
        category: "seasonal",
        short_description: "Fresh mango layers with whipped cream.",
        starting_price: 1900,
        badge: "Seasonal",
        lead_time_hours: 24,
        availability_status: "available",
        featured: 0,
        image_url: "https://example.com/mango.jpg"
      }
    ],
    productOptions: [
      { product_id: 11, option_group: "flavor", option_label: "Black Forest", servings: null, price: null, sort_order: 1, id: 1 },
      { product_id: 11, option_group: "size", option_label: "1 kg", servings: "10", price: 1800, sort_order: 1, id: 2 },
      { product_id: 12, option_group: "flavor", option_label: "Mango", servings: null, price: null, sort_order: 1, id: 3 },
      { product_id: 12, option_group: "addon", option_label: "Birthday topper", servings: null, price: null, sort_order: 1, id: 4 }
    ]
  });

  const response = await worker.fetch(
    new Request("https://pink-delight-cakes-api.sujayjalui.workers.dev/api/products", {
      headers: {
        origin: "https://pink-delight-cakes.pages.dev"
      }
    }),
    env,
    createExecutionContext()
  );
  const payload = await response.json();
  const bulkOptionQueries = env.DB.queryLog.filter((entry) => entry.query.includes("select * from product_options where product_id in ("));
  const perProductOptionQueries = env.DB.queryLog.filter((entry) => entry.query.includes("select * from product_options where product_id = ?"));

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.products.length, 2);
  assert.equal(payload.products[0].options.flavors.length > 0, true);
  assert.equal(payload.products[1].options.addOns[0], "Birthday topper");
  assert.equal(bulkOptionQueries.length, 1);
  assert.equal(perProductOptionQueries.length, 0);
});

await runTest("public testimonials endpoint returns only published testimonials", async () => {
  const env = createTestEnv({
    testimonials: createTestimonialsSeed()
  });

  const response = await worker.fetch(
    new Request("https://pink-delight-cakes-api.sujayjalui.workers.dev/api/testimonials", {
      headers: {
        origin: "https://pink-delight-cakes.pages.dev"
      }
    }),
    env,
    createExecutionContext()
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.testimonials.length, 1);
  assert.equal(payload.testimonials[0].customerName, "Riya S.");
});

await runTest("public settings endpoint exposes the featured spotlight fields", async () => {
  const env = createTestEnv({
    businessSettings: createBusinessSettingsSeed()
  });

  const response = await worker.fetch(
    new Request("https://pink-delight-cakes-api.sujayjalui.workers.dev/api/settings/public", {
      headers: {
        origin: "https://pink-delight-cakes.pages.dev"
      }
    }),
    env,
    createExecutionContext()
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.settings.featuredSpotlightTitle, "Baat Pakki engagement cake");
  assert.equal(payload.settings.featuredSpotlightImageUrl, "src/assets/baat-pakki-engagement-cake.webp");
  assert.equal(payload.settings.featuredSpotlightSourceUrl, "https://www.instagram.com/p/DXQtqPNjB1L/");
  assert.equal(payload.settings.heroProductSlug1, "midnight-chocolate");
  assert.equal(payload.settings.heroProductSlug4, "rasmalai-festive");
});

await runTest("public tracking lookup returns customer-facing status metadata for a matching inquiry", async () => {
  const futureDate = new Date(Date.now() + (2 * 86400000)).toISOString().slice(0, 10);
  const env = createTestEnv({
    orderRequests: [
      {
        id: 42,
        customer_name: "Amiya",
        customer_phone: "+91 87678 12121",
        customer_email: "amiya@example.com",
        product_id: 11,
        product_snapshot: JSON.stringify({
          id: 11,
          slug: "signature-black-forest",
          name: "Signature Black Forest",
          category: "birthday",
          startingPrice: 1800
        }),
        flavor: "Black Forest",
        size_label: "2 kg",
        servings: "20",
        event_date: futureDate,
        fulfillment_type: "pickup",
        add_on: "Candles",
        notes: "Less sweet, please.",
        status: "quoted",
        quoted_amount: 3200,
        source_channel: "website",
        created_at: "2026-04-18T00:00:00.000Z",
        updated_at: "2026-04-18T01:00:00.000Z"
      }
    ]
  });

  const request = new Request(
    "https://pink-delight-cakes-api.sujayjalui.workers.dev/api/order-requests/lookup?referenceId=42&phone=%2B91%2087678%2012121",
    {
      headers: {
        origin: "https://pink-delight-cakes.pages.dev"
      }
    }
  );

  const response = await worker.fetch(request, env, createExecutionContext());
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.orderRequest.statusLabel, "Quote shared");
  assert.equal(payload.orderRequest.productName, "Signature Black Forest");
  assert.equal(payload.orderRequest.timeline[2].state, "current");
  assert.equal(payload.orderRequest.quotedAmount, 3200);
  assert.equal(payload.orderRequest.flavor, "Black Forest");
  assert.equal(payload.orderRequest.sizeLabel, "2 kg");
  assert.equal(payload.orderRequest.servings, "20");
  assert.equal(payload.orderRequest.addOn, "Candles");
  assert.match(payload.orderRequest.timingLabel, /^(Event is tomorrow|Event is in \d+ days)$/);
  assert.match(payload.orderRequest.confidenceLabel, /^(In progress|Action needed soon)$/);
  assert.equal(payload.orderRequest.customerActionTitle, "What you can do now");
  assert.equal(payload.orderRequest.bakeryActionTitle, "What the bakery is doing");
  assert.equal(payload.orderRequest.followUpTitle, "When to follow up");
  assert.equal(payload.orderRequest.whatsAppCtaLabel, "Confirm or discuss this quote");
  assert.equal(payload.orderRequest.supportIntent, "I want to confirm or discuss this quote");
});

await runTest("public tracking lookup includes delivery update details for delivery inquiries", async () => {
  const env = createTestEnv({
    orderRequests: [
      {
        id: 84,
        customer_name: "Amiya",
        customer_phone: "+91 87678 12121",
        customer_email: "amiya@example.com",
        product_id: 11,
        product_snapshot: JSON.stringify({
          id: 11,
          slug: "signature-black-forest",
          name: "Signature Black Forest",
          category: "birthday",
          startingPrice: 1800
        }),
        flavor: "Black Forest",
        size_label: "2 kg",
        servings: "20",
        event_date: "2026-05-05",
        fulfillment_type: "local_delivery",
        add_on: "Candles",
        notes: "Please call before arrival.",
        status: "scheduled",
        quoted_amount: 3200,
        source_channel: "website",
        delivery_status: "delivery_scheduled",
        delivery_eta_start: "2026-05-05T11:00:00.000Z",
        delivery_eta_end: "2026-05-05T12:00:00.000Z",
        delivery_note: "Driver will call before arrival.",
        delivery_updated_at: "2026-05-04T10:15:00.000Z",
        created_at: "2026-04-18T00:00:00.000Z",
        updated_at: "2026-05-04T10:15:00.000Z"
      }
    ]
  });

  const request = new Request(
    "https://pink-delight-cakes-api.sujayjalui.workers.dev/api/order-requests/lookup?referenceId=84&phone=%2B91%2087678%2012121",
    {
      headers: {
        origin: "https://pink-delight-cakes.pages.dev"
      }
    }
  );

  const response = await worker.fetch(request, env, createExecutionContext());
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.orderRequest.deliveryTracking.status, "delivery_scheduled");
  assert.equal(payload.orderRequest.deliveryTracking.note, "Driver will call before arrival.");
  assert.match(payload.orderRequest.deliveryTracking.etaWindowLabel, /May/i);
});

await runTest("public tracking lookup falls back safely for unexpected statuses", async () => {
  const nextDay = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const env = createTestEnv({
    orderRequests: [
      {
        id: 77,
        customer_name: "Amiya",
        customer_phone: "+91 87678 12121",
        customer_email: "amiya@example.com",
        product_id: 11,
        product_snapshot: JSON.stringify({
          id: 11,
          slug: "signature-black-forest",
          name: "Signature Black Forest",
          category: "birthday",
          startingPrice: 1800
        }),
        flavor: "",
        size_label: "",
        servings: "",
        event_date: nextDay,
        fulfillment_type: "pickup",
        add_on: "",
        notes: "",
        status: "mystery_state",
        quoted_amount: null,
        source_channel: "website",
        created_at: "2026-04-18T00:00:00.000Z",
        updated_at: "2026-04-18T01:00:00.000Z"
      }
    ]
  });

  const request = new Request(
    "https://pink-delight-cakes-api.sujayjalui.workers.dev/api/order-requests/lookup?referenceId=77&phone=%2B91%2087678%2012121",
    {
      headers: {
        origin: "https://pink-delight-cakes.pages.dev"
      }
    }
  );

  const response = await worker.fetch(request, env, createExecutionContext());
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.orderRequest.statusLabel, "In progress");
  assert.equal(payload.orderRequest.customerActionTitle, "What you can do now");
  assert.equal(payload.orderRequest.bakeryActionTitle, "What the bakery is doing");
  assert.equal(payload.orderRequest.followUpTitle, "When to follow up");
  assert.equal(payload.orderRequest.whatsAppCtaLabel, "Ask about this inquiry");
});

await runTest("public tracking lookup marks past event dates for manual follow-up", async () => {
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const env = createTestEnv({
    orderRequests: [
      {
        id: 78,
        customer_name: "Amiya",
        customer_phone: "+91 87678 12121",
        customer_email: "amiya@example.com",
        product_id: 11,
        product_snapshot: JSON.stringify({
          id: 11,
          slug: "signature-black-forest",
          name: "Signature Black Forest",
          category: "birthday",
          startingPrice: 1800
        }),
        flavor: "Chocolate truffle",
        size_label: "Half kg",
        servings: "4 to 6",
        event_date: yesterday,
        fulfillment_type: "pickup",
        add_on: "Message topper",
        notes: "",
        status: "new",
        quoted_amount: null,
        source_channel: "website",
        created_at: "2026-04-18T00:00:00.000Z",
        updated_at: "2026-04-18T01:00:00.000Z"
      }
    ]
  });

  const request = new Request(
    "https://pink-delight-cakes-api.sujayjalui.workers.dev/api/order-requests/lookup?referenceId=78&phone=%2B91%2087678%2012121",
    {
      headers: {
        origin: "https://pink-delight-cakes.pages.dev"
      }
    }
  );

  const response = await worker.fetch(request, env, createExecutionContext());
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.orderRequest.timingLabel, "Event date has passed");
  assert.equal(payload.orderRequest.confidenceLabel, "Needs a manual check");
});

await runTest("public tracking lookup is rate limited per connection", async () => {
  const env = createTestEnv({
    orderRequests: [
      {
        id: 91,
        customer_name: "Amiya",
        customer_phone: "+91 87678 12121",
        customer_email: "amiya@example.com",
        product_id: 11,
        product_snapshot: JSON.stringify({
          id: 11,
          slug: "signature-black-forest",
          name: "Signature Black Forest",
          category: "birthday",
          startingPrice: 1800
        }),
        flavor: "Black Forest",
        size_label: "1 kg",
        servings: "8",
        event_date: "2026-05-01",
        fulfillment_type: "pickup",
        add_on: "",
        notes: "",
        status: "new",
        quoted_amount: null,
        source_channel: "website",
        created_at: "2026-04-18T00:00:00.000Z",
        updated_at: "2026-04-18T01:00:00.000Z"
      }
    ]
  });

  let lastResponse = null;
  for (let index = 0; index < 12; index += 1) {
    lastResponse = await worker.fetch(
      new Request("https://pink-delight-cakes-api.sujayjalui.workers.dev/api/order-requests/lookup?referenceId=91&phone=%2B91%2087678%2012121", {
        headers: {
          origin: "https://pink-delight-cakes.pages.dev",
          "cf-connecting-ip": "203.0.113.91"
        }
      }),
      env,
      createExecutionContext()
    );

    assert.equal(lastResponse.status, 200);
  }

  const blockedResponse = await worker.fetch(
    new Request("https://pink-delight-cakes-api.sujayjalui.workers.dev/api/order-requests/lookup?referenceId=91&phone=%2B91%2087678%2012121", {
      headers: {
        origin: "https://pink-delight-cakes.pages.dev",
        "cf-connecting-ip": "203.0.113.91"
      }
    }),
    env,
    createExecutionContext()
  );
  const blockedPayload = await blockedResponse.json();

  assert.equal(blockedResponse.status, 429);
  assert.equal(blockedPayload.ok, false);
  assert.match(blockedPayload.error, /tracking attempts/i);
  assert.equal(blockedResponse.headers.get("retry-after"), "900");
});

await runTest("admin order updates enforce valid transitions and append status history", async () => {
  const admin = {
    id: 7,
    email: "owner@pinkdelightcakes.com",
    role: "owner",
    is_active: 1
  };
  const env = createTestEnv({
    adminUsers: [admin],
    orderRequests: [
      {
        id: 42,
        customer_name: "Amiya",
        customer_phone: "+91 87678 12121",
        customer_email: "amiya@example.com",
        product_id: 11,
        product_snapshot: JSON.stringify({
          id: 11,
          slug: "signature-black-forest",
          name: "Signature Black Forest",
          category: "birthday",
          startingPrice: 1800
        }),
        flavor: "Black Forest",
        size_label: "1 kg",
        servings: "8",
        event_date: "2026-05-03",
        fulfillment_type: "pickup",
        add_on: "Candles",
        notes: "Please share the quote first.",
        status: "new",
        quoted_amount: null,
        source_channel: "website",
        internal_note: "",
        created_at: "2026-04-18T00:00:00.000Z",
        updated_at: "2026-04-18T01:00:00.000Z"
      }
    ],
    orderStatusHistory: [
      {
        id: 1,
        order_request_id: 42,
        from_status: null,
        to_status: "new",
        changed_by_admin_user_id: null,
        change_source: "migration_backfill",
        created_at: "2026-04-18T00:00:00.000Z"
      }
    ]
  });
  const sessionToken = await createAdminSessionToken(admin, env);
  const cookieHeader = `${apiConfig.adminSessionCookieName}=${sessionToken}`;

  const patchResponse = await worker.fetch(
    new Request("https://pink-delight-cakes.pages.dev/api/admin/orders/42", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-admin-intent": "mutate",
        origin: "https://pink-delight-cakes.pages.dev",
        cookie: cookieHeader
      },
      body: JSON.stringify({
        status: "reviewing",
        internalNote: "Quote prep in progress."
      })
    }),
    env,
    createExecutionContext()
  );
  const patchPayload = await patchResponse.json();

  assert.equal(patchResponse.status, 200);
  assert.equal(patchPayload.ok, true);
  assert.equal(patchPayload.order.status, "reviewing");
  assert.equal(env.DB.orderStatusHistory.length, 2);
  assert.equal(env.DB.orderStatusHistory[1].from_status, "new");
  assert.equal(env.DB.orderStatusHistory[1].to_status, "reviewing");
  assert.equal(env.DB.orderStatusHistory[1].changed_by_admin_user_id, 7);
  assert.equal(env.DB.orderStatusHistory[1].change_source, "admin_dashboard");

  const detailResponse = await worker.fetch(
    new Request("https://pink-delight-cakes.pages.dev/api/admin/orders/42", {
      headers: {
        origin: "https://pink-delight-cakes.pages.dev",
        cookie: cookieHeader
      }
    }),
    env,
    createExecutionContext()
  );
  const detailPayload = await detailResponse.json();

  assert.equal(detailResponse.status, 200);
  assert.equal(detailPayload.ok, true);
  assert.equal(detailPayload.order.statusHistory.length, 2);
  assert.equal(detailPayload.order.statusHistory[1].toStatus, "reviewing");
});

await runTest("admin delivery updates persist for local delivery inquiries", async () => {
  const admin = {
    id: 17,
    email: "owner@pinkdelightcakes.com",
    role: "owner",
    is_active: 1
  };
  const env = createTestEnv({
    adminUsers: [admin],
    orderRequests: [
      {
        id: 54,
        customer_name: "Amiya",
        customer_phone: "+91 87678 12121",
        customer_email: "amiya@example.com",
        product_id: 11,
        product_snapshot: JSON.stringify({
          id: 11,
          slug: "signature-black-forest",
          name: "Signature Black Forest",
          category: "birthday",
          startingPrice: 1800
        }),
        flavor: "Black Forest",
        size_label: "1 kg",
        servings: "8",
        event_date: "2026-05-06",
        fulfillment_type: "local_delivery",
        add_on: "Candles",
        notes: "Please coordinate before arrival.",
        status: "scheduled",
        quoted_amount: 3200,
        source_channel: "website",
        internal_note: "",
        delivery_status: "delivery_pending",
        delivery_eta_start: null,
        delivery_eta_end: null,
        delivery_note: "",
        delivery_updated_at: null,
        created_at: "2026-04-18T00:00:00.000Z",
        updated_at: "2026-04-18T01:00:00.000Z"
      }
    ],
    orderStatusHistory: [
      {
        id: 1,
        order_request_id: 54,
        from_status: null,
        to_status: "scheduled",
        changed_by_admin_user_id: null,
        change_source: "migration_backfill",
        created_at: "2026-04-18T00:00:00.000Z"
      }
    ]
  });
  const sessionToken = await createAdminSessionToken(admin, env);
  const cookieHeader = `${apiConfig.adminSessionCookieName}=${sessionToken}`;

  const patchResponse = await worker.fetch(
    new Request("https://pink-delight-cakes.pages.dev/api/admin/orders/54", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-admin-intent": "mutate",
        origin: "https://pink-delight-cakes.pages.dev",
        cookie: cookieHeader
      },
      body: JSON.stringify({
        deliveryStatus: "delivery_scheduled",
        deliveryEtaStart: "2026-05-06T10:00:00.000Z",
        deliveryEtaEnd: "2026-05-06T11:00:00.000Z",
        deliveryNote: "Driver will call before arrival."
      })
    }),
    env,
    createExecutionContext()
  );
  const patchPayload = await patchResponse.json();

  assert.equal(patchResponse.status, 200);
  assert.equal(patchPayload.ok, true);
  assert.equal(patchPayload.order.deliveryStatus, "delivery_scheduled");
  assert.equal(patchPayload.order.deliveryEtaStart, "2026-05-06T10:00:00.000Z");
  assert.equal(patchPayload.order.deliveryNote, "Driver will call before arrival.");
  assert.ok(env.DB.orderRequests[0].delivery_updated_at);
});

await runTest("admin order updates reject invalid status jumps", async () => {
  const admin = {
    id: 9,
    email: "owner@pinkdelightcakes.com",
    role: "owner",
    is_active: 1
  };
  const env = createTestEnv({
    adminUsers: [admin],
    orderRequests: [
      {
        id: 61,
        customer_name: "Amiya",
        customer_phone: "+91 87678 12121",
        customer_email: "amiya@example.com",
        product_id: 11,
        product_snapshot: JSON.stringify({
          id: 11,
          slug: "signature-black-forest",
          name: "Signature Black Forest",
          category: "birthday",
          startingPrice: 1800
        }),
        flavor: "Black Forest",
        size_label: "2 kg",
        servings: "20",
        event_date: "2026-05-06",
        fulfillment_type: "pickup",
        add_on: "",
        notes: "",
        status: "new",
        quoted_amount: null,
        source_channel: "website",
        internal_note: "",
        created_at: "2026-04-18T00:00:00.000Z",
        updated_at: "2026-04-18T01:00:00.000Z"
      }
    ],
    orderStatusHistory: [
      {
        id: 1,
        order_request_id: 61,
        from_status: null,
        to_status: "new",
        changed_by_admin_user_id: null,
        change_source: "migration_backfill",
        created_at: "2026-04-18T00:00:00.000Z"
      }
    ]
  });
  const sessionToken = await createAdminSessionToken(admin, env);
  const cookieHeader = `${apiConfig.adminSessionCookieName}=${sessionToken}`;

  const response = await worker.fetch(
    new Request("https://pink-delight-cakes.pages.dev/api/admin/orders/61", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-admin-intent": "mutate",
        origin: "https://pink-delight-cakes.pages.dev",
        cookie: cookieHeader
      },
      body: JSON.stringify({
        status: "completed"
      })
    }),
    env,
    createExecutionContext()
  );
  const payload = await response.json();

  assert.equal(response.status, 409);
  assert.equal(payload.ok, false);
  assert.equal(payload.error, "Invalid status transition");
  assert.match(payload.details[0], /cannot move an order from new to completed/i);
  assert.equal(env.DB.orderRequests[0].status, "new");
  assert.equal(env.DB.orderStatusHistory.length, 1);
});

await runTest("admin settings route reads and updates business settings for an authenticated same-origin admin session", async () => {
  const admin = {
    id: 7,
    email: "owner@pinkdelightcakes.com",
    role: "owner",
    is_active: 1
  };
  const env = createTestEnv({
    adminUsers: [admin],
    businessSettings: createBusinessSettingsSeed()
  });
  const sessionToken = await createAdminSessionToken(admin, env);
  const cookieHeader = `${apiConfig.adminSessionCookieName}=${sessionToken}`;

  const getResponse = await worker.fetch(
    new Request("https://pink-delight-cakes.pages.dev/api/admin/settings", {
      headers: {
        origin: "https://pink-delight-cakes.pages.dev",
        cookie: cookieHeader
      }
    }),
    env,
    createExecutionContext()
  );
  const getPayload = await getResponse.json();

  assert.equal(getResponse.status, 200);
  assert.equal(getPayload.ok, true);
  assert.equal(getPayload.settings.city, "Pune");
  assert.equal(getPayload.settings.featuredSpotlightTitle, "Baat Pakki engagement cake");

  const patchResponse = await worker.fetch(
    new Request("https://pink-delight-cakes.pages.dev/api/admin/settings", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-admin-intent": "mutate",
        origin: "https://pink-delight-cakes.pages.dev",
        cookie: cookieHeader
      },
      body: JSON.stringify({
        brandName: "Pink Delight Cakes",
        contactEmail: "hello@pinkdelightcakes.com",
        contactPhone: "+91 87678 12121",
        instagramHandle: "@pinkdelightcakes",
        city: "  Pune City  ",
        addressLine1: "",
        addressLine2: "",
        stateRegion: " Maharashtra ",
        postalCode: "",
        countryCode: "in",
        currency: "INR",
        inquiryChannel: "website",
        deliveryPickupCopy: " Pickup and local delivery across Pune city. ",
        noticePeriodCopy: " Standard celebration cakes usually need 24 to 48 hours notice. ",
        bakeryIntroTitle: " Crafted from home and designed with care. ",
        bakeryIntroParagraph1: " Pink Delight Cakes is led by Pinky Sangoi. ",
        bakeryIntroParagraph2: " Each celebration gets thoughtful attention. ",
        responseTimeCopy: " Send your date, design notes, and servings for a quick quote. ",
        heroProductSlug1: " midnight-chocolate ",
        heroProductSlug2: " vintage-rose ",
        heroProductSlug3: " golden-butterscotch ",
        heroProductSlug4: " rasmalai-festive ",
        featuredSpotlightTitle: " Pearl engagement cake ",
        featuredSpotlightDescription: " Soft pearls and florals with a clean engagement finish. ",
        featuredSpotlightImageUrl: " data:image/jpeg;base64,spotlight-demo ",
        featuredSpotlightSourceUrl: " https://www.instagram.com/p/example-featured-cake/ ",
        weekdayOpenTime: "10:00",
        weekdayCloseTime: "20:00",
        saturdayOpenTime: "10:00",
        saturdayCloseTime: "20:00",
        sundayOpenTime: "",
        sundayCloseTime: ""
      })
    }),
    env,
    createExecutionContext()
  );
  const patchPayload = await patchResponse.json();

  assert.equal(patchResponse.status, 200);
  assert.equal(patchPayload.ok, true);
  assert.equal(patchPayload.settings.city, "Pune City");
  assert.equal(patchPayload.settings.countryCode, "IN");
  assert.equal(patchPayload.settings.deliveryPickupCopy, "Pickup and local delivery across Pune city.");
  assert.equal(patchPayload.settings.heroProductSlug1, "midnight-chocolate");
  assert.equal(patchPayload.settings.heroProductSlug4, "rasmalai-festive");
  assert.equal(patchPayload.settings.featuredSpotlightTitle, "Pearl engagement cake");
  assert.equal(patchPayload.settings.featuredSpotlightImageUrl, "data:image/jpeg;base64,spotlight-demo");
  assert.equal(patchPayload.settings.featuredSpotlightSourceUrl, "https://www.instagram.com/p/example-featured-cake/");
  assert.equal(env.DB.businessSettings.city, "Pune City");
  assert.equal(env.DB.businessSettings.country_code, "IN");
  assert.equal(env.DB.businessSettings.hero_product_slug_2, "vintage-rose");
  assert.equal(env.DB.businessSettings.featured_spotlight_title, "Pearl engagement cake");
});

await runTest("admin settings mutation rejects requests without the protected dashboard intent header", async () => {
  const admin = {
    id: 9,
    email: "owner@pinkdelightcakes.com",
    role: "owner",
    is_active: 1
  };
  const env = createTestEnv({
    adminUsers: [admin],
    businessSettings: createBusinessSettingsSeed()
  });
  const sessionToken = await createAdminSessionToken(admin, env);
  const cookieHeader = `${apiConfig.adminSessionCookieName}=${sessionToken}`;

  const response = await worker.fetch(
    new Request("https://pink-delight-cakes.pages.dev/api/admin/settings", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        origin: "https://pink-delight-cakes.pages.dev",
        cookie: cookieHeader
      },
      body: JSON.stringify({
        brandName: "Pink Delight Cakes",
        contactEmail: "hello@pinkdelightcakes.com",
        contactPhone: "+91 87678 12121",
        instagramHandle: "@pinkdelightcakes",
        city: "Pune",
        addressLine1: "",
        addressLine2: "",
        stateRegion: "Maharashtra",
        postalCode: "",
        countryCode: "IN",
        currency: "INR",
        inquiryChannel: "website",
        deliveryPickupCopy: "Pickup and local delivery across Pune.",
        noticePeriodCopy: "Standard celebration cakes usually need 24 to 48 hours notice.",
        bakeryIntroTitle: "Fresh, careful, and celebration-ready.",
        bakeryIntroParagraph1: "Home bakery rooted in warm celebrations.",
        bakeryIntroParagraph2: "Every inquiry is handled personally.",
        responseTimeCopy: "Share your date, design idea, and servings for a quick quote.",
        featuredSpotlightTitle: "Baat Pakki engagement cake",
        featuredSpotlightDescription: "A customized engagement cake adorned with edible pearls and a fresh gypsy flower wreath at the base.",
        featuredSpotlightImageUrl: "src/assets/baat-pakki-engagement-cake.webp",
        featuredSpotlightSourceUrl: "https://www.instagram.com/p/DXQtqPNjB1L/",
        weekdayOpenTime: "10:00",
        weekdayCloseTime: "20:00",
        saturdayOpenTime: "10:00",
        saturdayCloseTime: "20:00",
        sundayOpenTime: "",
        sundayCloseTime: ""
      })
    }),
    env,
    createExecutionContext()
  );
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.ok, false);
  assert.match(payload.error, /protected dashboard flow/i);
});

await runTest("admin testimonials route replaces and reorders the published testimonial list", async () => {
  const admin = {
    id: 8,
    email: "owner@pinkdelightcakes.com",
    role: "owner",
    is_active: 1
  };
  const env = createTestEnv({
    adminUsers: [admin],
    testimonials: createTestimonialsSeed()
  });
  const sessionToken = await createAdminSessionToken(admin, env);
  const cookieHeader = `${apiConfig.adminSessionCookieName}=${sessionToken}`;

  const response = await worker.fetch(
    new Request("https://pink-delight-cakes.pages.dev/api/admin/testimonials", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-admin-intent": "mutate",
        origin: "https://pink-delight-cakes.pages.dev",
        cookie: cookieHeader
      },
      body: JSON.stringify({
        testimonials: [
          {
            customerName: "Mitali",
            occasionLabel: "Engagement cake",
            quoteText: "Elegant finish and very smooth coordination.",
            rating: 5,
            isPublished: true
          },
          {
            customerName: "Internal draft",
            occasionLabel: "Keep hidden",
            quoteText: "Still waiting for approval.",
            rating: 4,
            isPublished: false
          }
        ]
      })
    }),
    env,
    createExecutionContext()
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.testimonials.length, 2);
  assert.equal(payload.testimonials[0].customerName, "Mitali");
  assert.equal(payload.testimonials[0].sortOrder, 1);
  assert.equal(payload.testimonials[1].isPublished, false);
  assert.equal(env.DB.testimonials.length, 2);
  assert.equal(env.DB.testimonials[0].customer_name, "Mitali");
});

await runTest("admin login and logout rotate session versions so older cookies stop working", async () => {
  const passwordHash = await hashAdminPassword("strong-password");
  const admin = {
    id: 10,
    email: "owner@pinkdelightcakes.com",
    role: "owner",
    is_active: 1,
    password_hash: passwordHash,
    session_version: 1
  };
  const env = createTestEnv({
    adminUsers: [admin]
  });
  const staleToken = await createAdminSessionToken(admin, env);
  const staleCookie = `${apiConfig.adminSessionCookieName}=${staleToken}`;

  const loginResponse = await worker.fetch(
    new Request("https://pink-delight-cakes.pages.dev/api/admin/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-admin-intent": "mutate",
        origin: "https://pink-delight-cakes.pages.dev"
      },
      body: JSON.stringify({
        email: admin.email,
        password: "strong-password"
      })
    }),
    env,
    createExecutionContext()
  );
  const loginPayload = await loginResponse.json();
  const issuedCookie = loginResponse.headers.get("set-cookie")?.split(";")[0] || "";

  assert.equal(loginResponse.status, 200);
  assert.equal(loginPayload.ok, true);
  assert.equal(env.DB.adminUsers[0].session_version, 2);
  assert.notEqual(issuedCookie, "");

  const staleSessionResponse = await worker.fetch(
    new Request("https://pink-delight-cakes.pages.dev/api/admin/auth/session", {
      headers: {
        origin: "https://pink-delight-cakes.pages.dev",
        cookie: staleCookie
      }
    }),
    env,
    createExecutionContext()
  );
  const staleSessionPayload = await staleSessionResponse.json();

  assert.equal(staleSessionResponse.status, 401);
  assert.equal(staleSessionPayload.error, "Admin session is no longer active");

  const freshSessionResponse = await worker.fetch(
    new Request("https://pink-delight-cakes.pages.dev/api/admin/auth/session", {
      headers: {
        origin: "https://pink-delight-cakes.pages.dev",
        cookie: issuedCookie
      }
    }),
    env,
    createExecutionContext()
  );
  const freshSessionPayload = await freshSessionResponse.json();

  assert.equal(freshSessionResponse.status, 200);
  assert.equal(freshSessionPayload.ok, true);

  const logoutResponse = await worker.fetch(
    new Request("https://pink-delight-cakes.pages.dev/api/admin/auth/logout", {
      method: "POST",
      headers: {
        "x-admin-intent": "mutate",
        origin: "https://pink-delight-cakes.pages.dev",
        cookie: issuedCookie
      }
    }),
    env,
    createExecutionContext()
  );
  const logoutPayload = await logoutResponse.json();

  assert.equal(logoutResponse.status, 200);
  assert.equal(logoutPayload.ok, true);
  assert.equal(env.DB.adminUsers[0].session_version, 3);

  const postLogoutSessionResponse = await worker.fetch(
    new Request("https://pink-delight-cakes.pages.dev/api/admin/auth/session", {
      headers: {
        origin: "https://pink-delight-cakes.pages.dev",
        cookie: issuedCookie
      }
    }),
    env,
    createExecutionContext()
  );
  const postLogoutPayload = await postLogoutSessionResponse.json();

  assert.equal(postLogoutSessionResponse.status, 401);
  assert.equal(postLogoutPayload.error, "Admin session is no longer active");
});

console.log("All API flow tests passed.");
