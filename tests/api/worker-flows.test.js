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
  assert.equal(env.DB.rateLimitEvents.length, 1);
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

await runTest("public tracking lookup returns customer-facing status metadata for a matching inquiry", async () => {
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
        event_date: "2026-05-01",
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
  assert.match(payload.orderRequest.timingLabel, /^Event is in \d+ days$/);
  assert.equal(payload.orderRequest.confidenceLabel, "In progress");
  assert.equal(payload.orderRequest.customerActionTitle, "What you can do now");
  assert.equal(payload.orderRequest.bakeryActionTitle, "What the bakery is doing");
  assert.equal(payload.orderRequest.followUpTitle, "When to follow up");
  assert.equal(payload.orderRequest.whatsAppCtaLabel, "Confirm or discuss this quote");
  assert.equal(payload.orderRequest.supportIntent, "I want to confirm or discuss this quote");
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
  assert.equal(env.DB.businessSettings.city, "Pune City");
  assert.equal(env.DB.businessSettings.country_code, "IN");
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
