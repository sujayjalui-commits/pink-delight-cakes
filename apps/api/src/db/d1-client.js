import { tables } from "./tables.js";

export function hasDatabase(env) {
  return Boolean(env?.DB);
}

export async function getPublicSettings(env) {
  if (!hasDatabase(env)) {
    return null;
  }

  const query = `SELECT * FROM ${tables.businessSettings} ORDER BY id ASC LIMIT 1`;
  const result = await env.DB.prepare(query).first();
  return result || null;
}

export async function getAdminBusinessSettings(env) {
  return getPublicSettings(env);
}

export async function getPublicTestimonials(env) {
  if (!hasDatabase(env)) {
    return [];
  }

  const query = `
    SELECT * FROM ${tables.testimonials}
    WHERE is_published = 1
    ORDER BY sort_order ASC, id ASC
  `;
  const result = await env.DB.prepare(query).all();
  return result.results || [];
}

export async function getAdminTestimonials(env) {
  if (!hasDatabase(env)) {
    return [];
  }

  const query = `SELECT * FROM ${tables.testimonials} ORDER BY sort_order ASC, id ASC`;
  const result = await env.DB.prepare(query).all();
  return result.results || [];
}

export async function replaceTestimonials(env, testimonials) {
  if (!hasDatabase(env)) {
    return [];
  }

  const statements = [
    env.DB.prepare(`DELETE FROM ${tables.testimonials}`)
  ];

  testimonials.forEach((testimonial, index) => {
    statements.push(
      env.DB.prepare(
        `INSERT INTO ${tables.testimonials} (
          customer_name,
          occasion_label,
          quote_text,
          rating,
          is_published,
          sort_order,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
      ).bind(
        testimonial.customerName,
        testimonial.occasionLabel,
        testimonial.quoteText,
        testimonial.rating,
        testimonial.isPublished ? 1 : 0,
        index + 1
      )
    );
  });

  await env.DB.batch(statements);
  return getAdminTestimonials(env);
}

export async function getProducts(env) {
  if (!hasDatabase(env)) {
    return [];
  }

  const query = `SELECT * FROM ${tables.products} ORDER BY featured DESC, name ASC`;
  const result = await env.DB.prepare(query).all();
  return result.results || [];
}

export async function getAdminProducts(env) {
  if (!hasDatabase(env)) {
    return [];
  }

  const query = `SELECT * FROM ${tables.products} ORDER BY created_at DESC, id DESC`;
  const result = await env.DB.prepare(query).all();
  return result.results || [];
}

export async function getProductOptions(env, productId) {
  if (!hasDatabase(env)) {
    return [];
  }

  const query = `SELECT * FROM ${tables.productOptions} WHERE product_id = ? ORDER BY option_group ASC, sort_order ASC, id ASC`;
  const result = await env.DB.prepare(query).bind(productId).all();
  return result.results || [];
}

export async function getProductOptionsByProductIds(env, productIds) {
  if (!hasDatabase(env) || !Array.isArray(productIds) || productIds.length === 0) {
    return [];
  }

  const normalizedIds = Array.from(
    new Set(
      productIds
        .map((productId) => Number(productId))
        .filter((productId) => Number.isInteger(productId) && productId > 0)
    )
  );

  if (normalizedIds.length === 0) {
    return [];
  }

  const placeholders = normalizedIds.map(() => "?").join(", ");
  const query = `
    SELECT * FROM ${tables.productOptions}
    WHERE product_id IN (${placeholders})
    ORDER BY product_id ASC, option_group ASC, sort_order ASC, id ASC
  `;
  const result = await env.DB.prepare(query).bind(...normalizedIds).all();
  return result.results || [];
}

export async function getProductBySlug(env, slug) {
  if (!hasDatabase(env)) {
    return null;
  }

  const query = `SELECT * FROM ${tables.products} WHERE slug = ? LIMIT 1`;
  const product = await env.DB.prepare(query).bind(slug).first();
  return product || null;
}

export async function getAdminProductById(env, productId) {
  if (!hasDatabase(env)) {
    return null;
  }

  const query = `SELECT * FROM ${tables.products} WHERE id = ? LIMIT 1`;
  const product = await env.DB.prepare(query).bind(productId).first();
  return product || null;
}

export async function getAdminUserByEmail(env, email) {
  if (!hasDatabase(env)) {
    return null;
  }

  const query = `SELECT * FROM ${tables.adminUsers} WHERE email = ? LIMIT 1`;
  const result = await env.DB.prepare(query).bind(email).first();
  return result || null;
}

export async function getAdminUserById(env, adminId) {
  if (!hasDatabase(env)) {
    return null;
  }

  const query = `SELECT * FROM ${tables.adminUsers} WHERE id = ? LIMIT 1`;
  const result = await env.DB.prepare(query).bind(adminId).first();
  return result || null;
}

export async function setAdminUserPasswordHash(env, adminId, passwordHash) {
  if (!hasDatabase(env)) {
    return null;
  }

  const query = `
    UPDATE ${tables.adminUsers}
    SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    RETURNING *
  `;

  return env.DB.prepare(query).bind(passwordHash, adminId).first();
}

export async function rotateAdminUserSessionVersion(env, adminId) {
  if (!hasDatabase(env)) {
    return null;
  }

  const query = `
    UPDATE ${tables.adminUsers}
    SET session_version = COALESCE(session_version, 1) + 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    RETURNING *
  `;

  return env.DB.prepare(query).bind(adminId).first();
}

export async function saveBusinessSettings(env, payload) {
  if (!hasDatabase(env)) {
    return null;
  }

  const existing = await getPublicSettings(env);

  if (!existing) {
    return env.DB.prepare(
      `INSERT INTO ${tables.businessSettings} (
        brand_name,
        contact_email,
        contact_phone,
        instagram_handle,
        city,
        address_line_1,
        address_line_2,
        state_region,
        postal_code,
        country_code,
        currency,
        payment_mode,
        inquiry_channel,
        delivery_pickup_copy,
        notice_period_copy,
        bakery_intro_title,
        bakery_intro_paragraph_1,
        bakery_intro_paragraph_2,
        response_time_copy,
        featured_spotlight_title,
        featured_spotlight_description,
        featured_spotlight_image_url,
        featured_spotlight_source_url,
        hero_product_slug_1,
        hero_product_slug_2,
        hero_product_slug_3,
        hero_product_slug_4,
        weekday_open_time,
        weekday_close_time,
        saturday_open_time,
        saturday_close_time,
        sunday_open_time,
        sunday_close_time,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      RETURNING *`
    )
      .bind(
        payload.brandName,
        payload.contactEmail,
        payload.contactPhone,
        payload.instagramHandle,
        payload.city,
        payload.addressLine1,
        payload.addressLine2,
        payload.stateRegion,
        payload.postalCode,
        payload.countryCode,
        payload.currency,
        payload.paymentMode,
        payload.inquiryChannel,
        payload.deliveryPickupCopy,
        payload.noticePeriodCopy,
        payload.bakeryIntroTitle,
        payload.bakeryIntroParagraph1,
        payload.bakeryIntroParagraph2,
        payload.responseTimeCopy,
        payload.featuredSpotlightTitle,
        payload.featuredSpotlightDescription,
        payload.featuredSpotlightImageUrl,
        payload.featuredSpotlightSourceUrl,
        payload.heroProductSlug1,
        payload.heroProductSlug2,
        payload.heroProductSlug3,
        payload.heroProductSlug4,
        payload.weekdayOpenTime,
        payload.weekdayCloseTime,
        payload.saturdayOpenTime,
        payload.saturdayCloseTime,
        payload.sundayOpenTime,
        payload.sundayCloseTime
      )
      .first();
  }

  return env.DB.prepare(
    `UPDATE ${tables.businessSettings}
     SET brand_name = ?, contact_email = ?, contact_phone = ?, instagram_handle = ?, city = ?,
         address_line_1 = ?, address_line_2 = ?, state_region = ?, postal_code = ?, country_code = ?,
         currency = ?, payment_mode = ?, inquiry_channel = ?, delivery_pickup_copy = ?, notice_period_copy = ?,
         bakery_intro_title = ?, bakery_intro_paragraph_1 = ?, bakery_intro_paragraph_2 = ?, response_time_copy = ?,
         featured_spotlight_title = ?, featured_spotlight_description = ?, featured_spotlight_image_url = ?, featured_spotlight_source_url = ?,
         hero_product_slug_1 = ?, hero_product_slug_2 = ?, hero_product_slug_3 = ?, hero_product_slug_4 = ?,
         weekday_open_time = ?, weekday_close_time = ?, saturday_open_time = ?, saturday_close_time = ?,
         sunday_open_time = ?, sunday_close_time = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?
     RETURNING *`
  )
    .bind(
      payload.brandName,
      payload.contactEmail,
      payload.contactPhone,
      payload.instagramHandle,
      payload.city,
      payload.addressLine1,
      payload.addressLine2,
      payload.stateRegion,
      payload.postalCode,
      payload.countryCode,
      payload.currency,
      payload.paymentMode,
      payload.inquiryChannel,
      payload.deliveryPickupCopy,
      payload.noticePeriodCopy,
      payload.bakeryIntroTitle,
      payload.bakeryIntroParagraph1,
      payload.bakeryIntroParagraph2,
      payload.responseTimeCopy,
      payload.featuredSpotlightTitle,
      payload.featuredSpotlightDescription,
      payload.featuredSpotlightImageUrl,
      payload.featuredSpotlightSourceUrl,
      payload.heroProductSlug1,
      payload.heroProductSlug2,
      payload.heroProductSlug3,
      payload.heroProductSlug4,
      payload.weekdayOpenTime,
      payload.weekdayCloseTime,
      payload.saturdayOpenTime,
      payload.saturdayCloseTime,
      payload.sundayOpenTime,
      payload.sundayCloseTime,
      existing.id
    )
    .first();
}

function productOptionStatements(env, productSlug, payload) {
  const statements = [];

  payload.flavors.forEach((flavor, index) => {
    statements.push(
      env.DB.prepare(
        `INSERT INTO ${tables.productOptions} (product_id, option_group, option_label, price, servings, sort_order)
         VALUES ((SELECT id FROM products WHERE slug = ?), 'flavor', ?, NULL, NULL, ?)`
      ).bind(productSlug, flavor, index + 1)
    );
  });

  payload.sizes.forEach((size, index) => {
    statements.push(
      env.DB.prepare(
        `INSERT INTO ${tables.productOptions} (product_id, option_group, option_label, price, servings, sort_order)
         VALUES ((SELECT id FROM products WHERE slug = ?), 'size', ?, ?, ?, ?)`
      ).bind(productSlug, size.label, size.price, size.servings, index + 1)
    );
  });

  payload.addOns.forEach((addOn, index) => {
    statements.push(
      env.DB.prepare(
        `INSERT INTO ${tables.productOptions} (product_id, option_group, option_label, price, servings, sort_order)
         VALUES ((SELECT id FROM products WHERE slug = ?), 'addon', ?, NULL, NULL, ?)`
      ).bind(productSlug, addOn, index + 1)
    );
  });

  return statements;
}

export async function createProductWithOptions(env, payload) {
  if (!hasDatabase(env)) {
    return null;
  }

  const insert = env.DB.prepare(
    `INSERT INTO ${tables.products} (
      slug,
      name,
      category,
      short_description,
      starting_price,
      badge,
      lead_time_hours,
      availability_status,
      featured,
      image_url,
      video_url,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    RETURNING *`
  )
    .bind(
      payload.slug,
      payload.name,
      payload.category,
      payload.shortDescription,
      payload.startingPrice,
      payload.badge,
      payload.leadTimeHours,
      payload.availabilityStatus,
      payload.featured ? 1 : 0,
      payload.imageUrl,
      payload.videoUrl
    );

  const [result] = await env.DB.batch([insert, ...productOptionStatements(env, payload.slug, payload)]);
  return result.results[0] || null;
}

export async function updateProductWithOptions(env, productId, payload) {
  if (!hasDatabase(env)) {
    return null;
  }

  if (!await getAdminProductById(env, productId)) return null;

  const update = env.DB.prepare(
    `UPDATE ${tables.products}
     SET slug = ?, name = ?, category = ?, short_description = ?, starting_price = ?, badge = ?, lead_time_hours = ?,
         availability_status = ?, featured = ?, image_url = ?, video_url = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?
     RETURNING *`
  )
    .bind(
      payload.slug,
      payload.name,
      payload.category,
      payload.shortDescription,
      payload.startingPrice,
      payload.badge,
      payload.leadTimeHours,
      payload.availabilityStatus,
      payload.featured ? 1 : 0,
      payload.imageUrl,
      payload.videoUrl,
      productId
    );

  const [result] = await env.DB.batch([
    update,
    env.DB.prepare(`DELETE FROM ${tables.productOptions} WHERE product_id = ?`).bind(productId),
    ...productOptionStatements(env, payload.slug, payload)
  ]);
  return result.results[0] || null;
}

export async function getAdminOrders(env, filters = {}) {
  if (!hasDatabase(env)) {
    return [];
  }

  let query = `SELECT * FROM ${tables.orderRequests}`;
  const bindings = [];

  if (filters.status) {
    query += ` WHERE status = ?`;
    bindings.push(filters.status);
  }

  query += ` ORDER BY created_at DESC, id DESC`;
  const result = await env.DB.prepare(query).bind(...bindings).all();
  return result.results || [];
}

export async function getAdminOrderById(env, orderId) {
  if (!hasDatabase(env)) {
    return null;
  }

  const query = `SELECT * FROM ${tables.orderRequests} WHERE id = ? LIMIT 1`;
  const order = await env.DB.prepare(query).bind(orderId).first();
  return order || null;
}

export async function getOrderStatusHistoryByOrderId(env, orderId) {
  if (!hasDatabase(env)) {
    return [];
  }

  const query = `
    SELECT * FROM ${tables.orderRequestStatusHistory}
    WHERE order_request_id = ?
    ORDER BY created_at ASC, id ASC
  `;
  const result = await env.DB.prepare(query).bind(orderId).all();
  return result.results || [];
}

export async function updateAdminOrderFields(env, orderId, input, options = {}) {
  if (!hasDatabase(env)) return null;
  // Use the exact snapshot against which the service validated the transition.
  const currentOrder = options.currentOrder;
  const columns = {
    status: "status", quotedAmount: "quoted_amount", internalNote: "internal_note",
    deliveryStatus: "delivery_status", deliveryEtaStart: "delivery_eta_start",
    deliveryEtaEnd: "delivery_eta_end", deliveryNote: "delivery_note"
  };
  const entries = Object.entries(columns).filter(([field]) => input[field] !== undefined);
  const assignments = entries.map(([, column]) => `${column} = ?`);
  const bindings = entries.map(([field]) => input[field]);
  if (entries.some(([field, column]) => field.startsWith("delivery") && input[field] !== currentOrder[column])) {
    assignments.push("delivery_updated_at = ?");
    bindings.push(new Date().toISOString());
  }
  assignments.push("version = version + 1", "updated_at = CURRENT_TIMESTAMP");
  const update = env.DB.prepare(`UPDATE ${tables.orderRequests}
    SET ${assignments.join(", ")} WHERE id = ? AND version = ? RETURNING *`)
    .bind(...bindings, orderId, input.version);
  const statements = [update];
  if (input.status !== undefined && input.status !== currentOrder.status) {
    // changes() refers to the guarded UPDATE immediately before this statement.
    // A stale update adds no history; a history failure rolls back the update.
    statements.push(env.DB.prepare(`INSERT INTO ${tables.orderRequestStatusHistory}
      (order_request_id, from_status, to_status, changed_by_admin_user_id, change_source)
      SELECT ?, ?, ?, ?, ? WHERE changes() = 1`)
      .bind(orderId, currentOrder.status, input.status, options.changedByAdminUserId || null,
        options.changeSource || "admin_dashboard"));
  }
  const [result] = await env.DB.batch(statements);
  return result.results[0] || null;
}

export async function getOrderBySubmissionKey(env, key) {
  return env.DB.prepare(`SELECT * FROM ${tables.orderRequests} WHERE submission_key = ? LIMIT 1`)
    .bind(key).first();
}

export async function createOrderRequest(env, payload) {
  if (!hasDatabase(env)) {
    return null;
  }

  const query = `
    INSERT INTO ${tables.orderRequests} (
      customer_name,
      customer_phone,
      customer_email,
      product_id,
      product_snapshot,
      flavor,
      size_label,
      servings,
      event_date,
      fulfillment_type,
      add_on,
      notes,
      cart_snapshot,
      status,
      source_channel,
      delivery_status,
      delivery_eta_start,
      delivery_eta_end,
      delivery_note,
      delivery_updated_at,
      submission_key,
      submission_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(submission_key) DO NOTHING
    RETURNING *
  `;

  const insert = env.DB.prepare(query)
    .bind(
      payload.customerName,
      payload.customerPhone,
      payload.customerEmail || null,
      payload.productId || null,
      payload.productSnapshot,
      payload.flavor || null,
      payload.sizeLabel || null,
      payload.servings || null,
      payload.eventDate || null,
      payload.fulfillmentType,
      payload.addOn || null,
      payload.notes || null,
      payload.cartSnapshot || null,
      payload.status,
      payload.sourceChannel,
      payload.deliveryStatus,
      payload.deliveryEtaStart || null,
      payload.deliveryEtaEnd || null,
      payload.deliveryNote || null,
      payload.deliveryUpdatedAt || null,
      payload.submissionKey,
      payload.submissionHash
    );

  const results = await env.DB.batch([
    insert,
    env.DB.prepare(`INSERT INTO ${tables.orderRequestStatusHistory}
      (order_request_id, from_status, to_status, changed_by_admin_user_id, change_source)
      SELECT id, NULL, status, NULL, 'public_inquiry' FROM ${tables.orderRequests}
      WHERE submission_key = ? AND changes() = 1`).bind(payload.submissionKey),
    env.DB.prepare(`SELECT * FROM ${tables.orderRequests} WHERE submission_key = ? LIMIT 1`)
      .bind(payload.submissionKey)
  ]);
  return { order: results[2].results[0] || null, replayed: results[0].results.length === 0 };
}
