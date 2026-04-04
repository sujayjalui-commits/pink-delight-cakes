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
        currency,
        payment_mode,
        inquiry_channel,
        delivery_pickup_copy,
        notice_period_copy,
        bakery_intro_title,
        bakery_intro_paragraph_1,
        bakery_intro_paragraph_2,
        response_time_copy,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      RETURNING *`
    )
      .bind(
        payload.brandName,
        payload.contactEmail,
        payload.contactPhone,
        payload.instagramHandle,
        payload.city,
        payload.currency,
        payload.paymentMode,
        payload.inquiryChannel,
        payload.deliveryPickupCopy,
        payload.noticePeriodCopy,
        payload.bakeryIntroTitle,
        payload.bakeryIntroParagraph1,
        payload.bakeryIntroParagraph2,
        payload.responseTimeCopy
      )
      .first();
  }

  return env.DB.prepare(
    `UPDATE ${tables.businessSettings}
     SET brand_name = ?, contact_email = ?, contact_phone = ?, instagram_handle = ?, city = ?,
         currency = ?, payment_mode = ?, inquiry_channel = ?, delivery_pickup_copy = ?, notice_period_copy = ?,
         bakery_intro_title = ?, bakery_intro_paragraph_1 = ?, bakery_intro_paragraph_2 = ?, response_time_copy = ?,
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
      payload.currency,
      payload.paymentMode,
      payload.inquiryChannel,
      payload.deliveryPickupCopy,
      payload.noticePeriodCopy,
      payload.bakeryIntroTitle,
      payload.bakeryIntroParagraph1,
      payload.bakeryIntroParagraph2,
      payload.responseTimeCopy,
      existing.id
    )
    .first();
}

async function insertProductOptions(env, productId, payload) {
  const statements = [];

  payload.flavors.forEach((flavor, index) => {
    statements.push(
      env.DB.prepare(
        `INSERT INTO ${tables.productOptions} (product_id, option_group, option_label, price, servings, sort_order)
         VALUES (?, 'flavor', ?, NULL, NULL, ?)`
      ).bind(productId, flavor, index + 1)
    );
  });

  payload.sizes.forEach((size, index) => {
    statements.push(
      env.DB.prepare(
        `INSERT INTO ${tables.productOptions} (product_id, option_group, option_label, price, servings, sort_order)
         VALUES (?, 'size', ?, ?, ?, ?)`
      ).bind(productId, size.label, size.price, size.servings, index + 1)
    );
  });

  payload.addOns.forEach((addOn, index) => {
    statements.push(
      env.DB.prepare(
        `INSERT INTO ${tables.productOptions} (product_id, option_group, option_label, price, servings, sort_order)
         VALUES (?, 'addon', ?, NULL, NULL, ?)`
      ).bind(productId, addOn, index + 1)
    );
  });

  if (statements.length > 0) {
    await env.DB.batch(statements);
  }
}

export async function createProductWithOptions(env, payload) {
  if (!hasDatabase(env)) {
    return null;
  }

  const createdProduct = await env.DB.prepare(
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
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
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
      payload.imageUrl
    )
    .first();

  await insertProductOptions(env, createdProduct.id, payload);
  return createdProduct;
}

export async function updateProductWithOptions(env, productId, payload) {
  if (!hasDatabase(env)) {
    return null;
  }

  const updatedProduct = await env.DB.prepare(
    `UPDATE ${tables.products}
     SET slug = ?, name = ?, category = ?, short_description = ?, starting_price = ?, badge = ?, lead_time_hours = ?,
         availability_status = ?, featured = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
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
      productId
    )
    .first();

  if (!updatedProduct) {
    return null;
  }

  await env.DB.prepare(`DELETE FROM ${tables.productOptions} WHERE product_id = ?`).bind(productId).run();
  await insertProductOptions(env, productId, payload);

  return updatedProduct;
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

export async function updateAdminOrderFields(env, orderId, input) {
  if (!hasDatabase(env)) {
    return null;
  }

  const currentOrder = await getAdminOrderById(env, orderId);

  if (!currentOrder) {
    return null;
  }

  const nextStatus = input.status ?? currentOrder.status;
  const nextQuotedAmount = input.quotedAmount ?? currentOrder.quoted_amount;
  const nextInternalNote = input.internalNote ?? currentOrder.internal_note ?? null;

  const query = `
    UPDATE ${tables.orderRequests}
    SET status = ?, quoted_amount = ?, internal_note = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    RETURNING *
  `;

  return env.DB.prepare(query).bind(nextStatus, nextQuotedAmount, nextInternalNote, orderId).first();
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
      status,
      source_channel
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING *
  `;

  const result = await env.DB.prepare(query)
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
      payload.status,
      payload.sourceChannel
    )
    .first();

  return result || null;
}
