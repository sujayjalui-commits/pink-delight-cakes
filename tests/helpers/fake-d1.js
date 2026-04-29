function cloneValue(value) {
  return value === null || value === undefined
    ? value
    : structuredClone(value);
}

function normalizeSql(query) {
  return query.replace(/\s+/g, " ").trim().toLowerCase();
}

function createTimestamp(index = 0) {
  return new Date(Date.UTC(2026, 3, 18, 0, 0, index)).toISOString();
}

function parseWindowSeconds(modifier) {
  const match = String(modifier || "").match(/-(\d+)\s+seconds/i);
  return match ? Number(match[1]) : 0;
}

class FakeD1Statement {
  constructor(database, query) {
    this.database = database;
    this.query = query;
    this.normalizedQuery = normalizeSql(query);
    this.boundValues = [];
  }

  bind(...values) {
    this.boundValues = values;
    return this;
  }

  async first() {
    return cloneValue(this.database.execute(this.normalizedQuery, this.boundValues, "first"));
  }

  async all() {
    const results = this.database.execute(this.normalizedQuery, this.boundValues, "all");
    return { results: cloneValue(results) || [] };
  }

  async run() {
    const result = this.database.execute(this.normalizedQuery, this.boundValues, "run");
    return cloneValue(result) || { success: true };
  }
}

export class FakeD1Database {
  constructor(seed = {}) {
    this.products = cloneValue(seed.products || []);
    this.productOptions = cloneValue(seed.productOptions || []);
    this.orderRequests = cloneValue(seed.orderRequests || []);
    this.adminUsers = cloneValue(seed.adminUsers || []);
    this.businessSettings = seed.businessSettings ? cloneValue(seed.businessSettings) : null;
    this.testimonials = cloneValue(seed.testimonials || []);
    this.rateLimitEvents = cloneValue(seed.rateLimitEvents || []).map((event, index) => ({
      createdAtMs: Date.now() - index,
      ...event
    }));
    this.nextOrderId = this.orderRequests.reduce((maxValue, order) => Math.max(maxValue, Number(order.id) || 0), 0) + 1;
    this.queryLog = [];
  }

  prepare(query) {
    return new FakeD1Statement(this, query);
  }

  async batch(statements) {
    await Promise.all(statements.map((statement) => statement.run()));
    return [];
  }

  execute(query, boundValues, mode) {
    this.queryLog.push({
      query,
      boundValues: cloneValue(boundValues),
      mode
    });

    if (query.includes("select * from products where slug = ? limit 1")) {
      return this.products.find((product) => product.slug === boundValues[0]) || null;
    }

    if (query.includes("select * from products order by featured desc, name asc")) {
      return [...this.products].sort((left, right) => {
        if (Number(right.featured) !== Number(left.featured)) {
          return Number(right.featured) - Number(left.featured);
        }

        return String(left.name).localeCompare(String(right.name));
      });
    }

    if (query.includes("select * from product_options where product_id = ?")) {
      return this.productOptions.filter((option) => option.product_id === boundValues[0]);
    }

    if (query.includes("select * from product_options where product_id in (")) {
      const productIds = new Set(boundValues.map((value) => Number(value)));
      return this.productOptions.filter((option) => productIds.has(Number(option.product_id)));
    }

    if (query.includes("select * from order_requests where id = ? limit 1")) {
      return this.orderRequests.find((order) => Number(order.id) === Number(boundValues[0])) || null;
    }

    if (query.includes("select * from order_requests where status = ?")) {
      return this.orderRequests.filter((order) => order.status === boundValues[0]);
    }

    if (query.includes("select * from order_requests order by created_at desc, id desc")) {
      return [...this.orderRequests].sort((left, right) => {
        const dateSort = String(right.created_at || "").localeCompare(String(left.created_at || ""));
        return dateSort || Number(right.id || 0) - Number(left.id || 0);
      });
    }

    if (query.includes("insert into order_requests")) {
      const [
        customerName,
        customerPhone,
        customerEmail,
        productId,
        productSnapshot,
        flavor,
        sizeLabel,
        servings,
        eventDate,
        fulfillmentType,
        addOn,
        notes,
        cartSnapshot,
        status,
        sourceChannel
      ] = boundValues;

      const createdOrder = {
        id: this.nextOrderId,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        product_id: productId,
        product_snapshot: productSnapshot,
        flavor,
        size_label: sizeLabel,
        servings,
        event_date: eventDate,
        fulfillment_type: fulfillmentType,
        add_on: addOn,
        notes,
        cart_snapshot: cartSnapshot,
        status,
        source_channel: sourceChannel,
        quoted_amount: null,
        internal_note: null,
        created_at: createTimestamp(this.nextOrderId),
        updated_at: createTimestamp(this.nextOrderId)
      };

      this.nextOrderId += 1;
      this.orderRequests.unshift(createdOrder);
      return createdOrder;
    }

    if (query.includes("delete from rate_limit_events")) {
      const [bucket, modifier] = boundValues;
      const windowSeconds = parseWindowSeconds(modifier);
      const cutoff = Date.now() - (windowSeconds * 1000);
      this.rateLimitEvents = this.rateLimitEvents.filter((event) => {
        return event.bucket !== bucket || event.createdAtMs >= cutoff;
      });
      return { success: true };
    }

    if (query.includes("select count(*) as count from rate_limit_events")) {
      const [bucket, identifier, modifier] = boundValues;
      const windowSeconds = parseWindowSeconds(modifier);
      const cutoff = Date.now() - (windowSeconds * 1000);
      const count = this.rateLimitEvents.filter((event) => {
        return event.bucket === bucket && event.identifier === identifier && event.createdAtMs >= cutoff;
      }).length;
      return { count };
    }

    if (query.includes("insert into rate_limit_events")) {
      const [bucket, identifier] = boundValues;
      this.rateLimitEvents.push({
        bucket,
        identifier,
        createdAtMs: Date.now()
      });
      return { success: true };
    }

    if (query.includes("select * from admin_users where id = ? limit 1")) {
      return this.adminUsers.find((admin) => Number(admin.id) === Number(boundValues[0])) || null;
    }

    if (query.includes("select * from admin_users where email = ? limit 1")) {
      return this.adminUsers.find((admin) => admin.email === boundValues[0]) || null;
    }

    if (query.includes("update admin_users set password_hash = ?")) {
      const [passwordHash, adminId] = boundValues;
      const adminIndex = this.adminUsers.findIndex((admin) => Number(admin.id) === Number(adminId));

      if (adminIndex === -1) {
        return null;
      }

      this.adminUsers[adminIndex] = {
        ...this.adminUsers[adminIndex],
        password_hash: passwordHash,
        updated_at: createTimestamp(2)
      };

      return this.adminUsers[adminIndex];
    }

    if (query.includes("update admin_users set session_version = coalesce(session_version, 1) + 1")) {
      const [adminId] = boundValues;
      const adminIndex = this.adminUsers.findIndex((admin) => Number(admin.id) === Number(adminId));

      if (adminIndex === -1) {
        return null;
      }

      const currentSessionVersion = Number(this.adminUsers[adminIndex].session_version || 1);
      this.adminUsers[adminIndex] = {
        ...this.adminUsers[adminIndex],
        session_version: currentSessionVersion + 1,
        updated_at: createTimestamp(2)
      };

      return this.adminUsers[adminIndex];
    }

    if (query.includes("select * from business_settings order by id asc limit 1")) {
      return this.businessSettings || null;
    }

    if (query.includes("select * from testimonials where is_published = 1")) {
      return this.testimonials
        .filter((testimonial) => Number(testimonial.is_published) === 1)
        .sort((left, right) => Number(left.sort_order) - Number(right.sort_order) || Number(left.id) - Number(right.id));
    }

    if (query.includes("select * from testimonials order by sort_order asc, id asc")) {
      return [...this.testimonials]
        .sort((left, right) => Number(left.sort_order) - Number(right.sort_order) || Number(left.id) - Number(right.id));
    }

    if (query.includes("delete from testimonials")) {
      this.testimonials = [];
      return { success: true };
    }

    if (query.includes("insert into testimonials")) {
      const [customerName, occasionLabel, quoteText, rating, isPublished, sortOrder] = boundValues;
      const nextId = this.testimonials.reduce((maxValue, testimonial) => Math.max(maxValue, Number(testimonial.id) || 0), 0) + 1;
      const testimonial = {
        id: nextId,
        customer_name: customerName,
        occasion_label: occasionLabel,
        quote_text: quoteText,
        rating,
        is_published: isPublished,
        sort_order: sortOrder,
        created_at: createTimestamp(nextId),
        updated_at: createTimestamp(nextId)
      };
      this.testimonials.push(testimonial);
      return testimonial;
    }

    if (query.includes("insert into business_settings")) {
      const [
        brandName,
        contactEmail,
        contactPhone,
        instagramHandle,
        city,
        addressLine1,
        addressLine2,
        stateRegion,
        postalCode,
        countryCode,
        currency,
        paymentMode,
        inquiryChannel,
        deliveryPickupCopy,
        noticePeriodCopy,
        bakeryIntroTitle,
        bakeryIntroParagraph1,
        bakeryIntroParagraph2,
        responseTimeCopy,
        featuredSpotlightTitle,
        featuredSpotlightDescription,
        featuredSpotlightImageUrl,
        featuredSpotlightSourceUrl,
        heroProductSlug1,
        heroProductSlug2,
        heroProductSlug3,
        heroProductSlug4,
        weekdayOpenTime,
        weekdayCloseTime,
        saturdayOpenTime,
        saturdayCloseTime,
        sundayOpenTime,
        sundayCloseTime
      ] = boundValues;

      this.businessSettings = {
        id: 1,
        brand_name: brandName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        instagram_handle: instagramHandle,
        city,
        address_line_1: addressLine1,
        address_line_2: addressLine2,
        state_region: stateRegion,
        postal_code: postalCode,
        country_code: countryCode,
        currency,
        payment_mode: paymentMode,
        inquiry_channel: inquiryChannel,
        delivery_pickup_copy: deliveryPickupCopy,
        notice_period_copy: noticePeriodCopy,
        bakery_intro_title: bakeryIntroTitle,
        bakery_intro_paragraph_1: bakeryIntroParagraph1,
        bakery_intro_paragraph_2: bakeryIntroParagraph2,
        response_time_copy: responseTimeCopy,
        featured_spotlight_title: featuredSpotlightTitle,
        featured_spotlight_description: featuredSpotlightDescription,
        featured_spotlight_image_url: featuredSpotlightImageUrl,
        featured_spotlight_source_url: featuredSpotlightSourceUrl,
        hero_product_slug_1: heroProductSlug1,
        hero_product_slug_2: heroProductSlug2,
        hero_product_slug_3: heroProductSlug3,
        hero_product_slug_4: heroProductSlug4,
        weekday_open_time: weekdayOpenTime,
        weekday_close_time: weekdayCloseTime,
        saturday_open_time: saturdayOpenTime,
        saturday_close_time: saturdayCloseTime,
        sunday_open_time: sundayOpenTime,
        sunday_close_time: sundayCloseTime,
        created_at: createTimestamp(1),
        updated_at: createTimestamp(1)
      };

      return this.businessSettings;
    }

    if (query.includes("update business_settings")) {
      const [
        brandName,
        contactEmail,
        contactPhone,
        instagramHandle,
        city,
        addressLine1,
        addressLine2,
        stateRegion,
        postalCode,
        countryCode,
        currency,
        paymentMode,
        inquiryChannel,
        deliveryPickupCopy,
        noticePeriodCopy,
        bakeryIntroTitle,
        bakeryIntroParagraph1,
        bakeryIntroParagraph2,
        responseTimeCopy,
        featuredSpotlightTitle,
        featuredSpotlightDescription,
        featuredSpotlightImageUrl,
        featuredSpotlightSourceUrl,
        heroProductSlug1,
        heroProductSlug2,
        heroProductSlug3,
        heroProductSlug4,
        weekdayOpenTime,
        weekdayCloseTime,
        saturdayOpenTime,
        saturdayCloseTime,
        sundayOpenTime,
        sundayCloseTime,
        id
      ] = boundValues;

      if (!this.businessSettings || Number(this.businessSettings.id) !== Number(id)) {
        return null;
      }

      this.businessSettings = {
        ...this.businessSettings,
        brand_name: brandName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        instagram_handle: instagramHandle,
        city,
        address_line_1: addressLine1,
        address_line_2: addressLine2,
        state_region: stateRegion,
        postal_code: postalCode,
        country_code: countryCode,
        currency,
        payment_mode: paymentMode,
        inquiry_channel: inquiryChannel,
        delivery_pickup_copy: deliveryPickupCopy,
        notice_period_copy: noticePeriodCopy,
        bakery_intro_title: bakeryIntroTitle,
        bakery_intro_paragraph_1: bakeryIntroParagraph1,
        bakery_intro_paragraph_2: bakeryIntroParagraph2,
        response_time_copy: responseTimeCopy,
        featured_spotlight_title: featuredSpotlightTitle,
        featured_spotlight_description: featuredSpotlightDescription,
        featured_spotlight_image_url: featuredSpotlightImageUrl,
        featured_spotlight_source_url: featuredSpotlightSourceUrl,
        hero_product_slug_1: heroProductSlug1,
        hero_product_slug_2: heroProductSlug2,
        hero_product_slug_3: heroProductSlug3,
        hero_product_slug_4: heroProductSlug4,
        weekday_open_time: weekdayOpenTime,
        weekday_close_time: weekdayCloseTime,
        saturday_open_time: saturdayOpenTime,
        saturday_close_time: saturdayCloseTime,
        sunday_open_time: sundayOpenTime,
        sunday_close_time: sundayCloseTime,
        updated_at: createTimestamp(2)
      };

      return this.businessSettings;
    }

    throw new Error(`Unsupported fake D1 query in ${mode}: ${this.query}`);
  }
}

export function createExecutionContext() {
  return {
    tasks: [],
    waitUntil(promise) {
      this.tasks.push(promise);
    }
  };
}

export function createTestEnv(seed = {}) {
  return {
    DB: new FakeD1Database(seed),
    ADMIN_SESSION_SECRET: "test-admin-session-secret",
    ADMIN_SETUP_KEY: "test-setup-key",
    SITE_URL: "https://pink-delight-cakes.pages.dev",
    ADMIN_URL: "https://pink-delight-cakes.pages.dev/admin/",
    API_BASE_URL: "https://pink-delight-cakes-api.sujayjalui.workers.dev",
    CORS_ALLOWED_ORIGINS: "https://pink-delight-cakes.pages.dev"
  };
}
