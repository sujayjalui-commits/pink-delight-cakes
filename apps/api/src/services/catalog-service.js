import { seedCatalog } from "../../../../packages/shared/constants/seed-catalog.js";
import { getProductBySlug, getProducts, getProductOptions, getPublicSettings } from "../db/d1-client.js";

function mapSeedProduct(product) {
  return {
    slug: product.slug,
    name: product.name,
    category: product.category,
    shortDescription: product.shortDescription,
    startingPrice: product.startingPrice,
    badge: product.badge,
    leadTimeHours: product.leadTimeHours,
    availabilityStatus: product.availabilityStatus,
    featured: product.featured,
    options: {
      flavors: product.flavors,
      sizes: product.sizes,
      addOns: product.addOns
    }
  };
}

function groupDatabaseOptions(options) {
  return options.reduce(
    (accumulator, option) => {
      if (option.option_group === "flavor") {
        accumulator.flavors.push(option.option_label);
      }

      if (option.option_group === "size") {
        accumulator.sizes.push({
          label: option.option_label,
          servings: option.servings,
          price: option.price
        });
      }

      if (option.option_group === "addon") {
        accumulator.addOns.push(option.option_label);
      }

      return accumulator;
    },
    { flavors: [], sizes: [], addOns: [] }
  );
}

function mapDatabaseProduct(product, options) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    shortDescription: product.short_description,
    startingPrice: product.starting_price,
    badge: product.badge,
    leadTimeHours: product.lead_time_hours,
    availabilityStatus: product.availability_status,
    featured: Boolean(product.featured),
    imageUrl: product.image_url,
    options: groupDatabaseOptions(options)
  };
}

export async function getPublicCatalog(env) {
  const databaseProducts = await getProducts(env);

  if (!databaseProducts.length) {
    return seedCatalog.products.map(mapSeedProduct);
  }

  const mappedProducts = await Promise.all(
    databaseProducts.map(async (product) => {
      const options = await getProductOptions(env, product.id);
      return mapDatabaseProduct(product, options);
    })
  );

  return mappedProducts;
}

export async function getPublicCatalogItem(env, slug) {
  const databaseProduct = await getProductBySlug(env, slug);

  if (!databaseProduct) {
    const seedProduct = seedCatalog.products.find((product) => product.slug === slug);
    return seedProduct ? mapSeedProduct(seedProduct) : null;
  }

  const options = await getProductOptions(env, databaseProduct.id);
  return mapDatabaseProduct(databaseProduct, options);
}

export async function getPublicSettingsView(env) {
  const databaseSettings = await getPublicSettings(env);

  if (!databaseSettings) {
    return seedCatalog.businessSettings;
  }

  return {
    brandName: databaseSettings.brand_name,
    contactEmail: databaseSettings.contact_email,
    contactPhone: databaseSettings.contact_phone,
    instagramHandle: databaseSettings.instagram_handle,
    city: databaseSettings.city,
    addressLine1: databaseSettings.address_line_1 || seedCatalog.businessSettings.addressLine1 || "",
    addressLine2: databaseSettings.address_line_2 || seedCatalog.businessSettings.addressLine2 || "",
    stateRegion: databaseSettings.state_region || seedCatalog.businessSettings.stateRegion || "Maharashtra",
    postalCode: databaseSettings.postal_code || seedCatalog.businessSettings.postalCode || "",
    countryCode: databaseSettings.country_code || seedCatalog.businessSettings.countryCode || "IN",
    currency: databaseSettings.currency,
    paymentMode: databaseSettings.payment_mode,
    inquiryChannel: databaseSettings.inquiry_channel,
    deliveryPickupCopy: databaseSettings.delivery_pickup_copy || seedCatalog.businessSettings.deliveryPickupCopy,
    noticePeriodCopy: databaseSettings.notice_period_copy || seedCatalog.businessSettings.noticePeriodCopy,
    bakeryIntroTitle: databaseSettings.bakery_intro_title || seedCatalog.businessSettings.bakeryIntroTitle,
    bakeryIntroParagraph1: databaseSettings.bakery_intro_paragraph_1 || seedCatalog.businessSettings.bakeryIntroParagraph1,
    bakeryIntroParagraph2: databaseSettings.bakery_intro_paragraph_2 || seedCatalog.businessSettings.bakeryIntroParagraph2,
    responseTimeCopy: databaseSettings.response_time_copy || seedCatalog.businessSettings.responseTimeCopy,
    weekdayOpenTime: databaseSettings.weekday_open_time || seedCatalog.businessSettings.weekdayOpenTime || "10:00",
    weekdayCloseTime: databaseSettings.weekday_close_time || seedCatalog.businessSettings.weekdayCloseTime || "20:00",
    saturdayOpenTime: databaseSettings.saturday_open_time || seedCatalog.businessSettings.saturdayOpenTime || "10:00",
    saturdayCloseTime: databaseSettings.saturday_close_time || seedCatalog.businessSettings.saturdayCloseTime || "20:00",
    sundayOpenTime: databaseSettings.sunday_open_time || seedCatalog.businessSettings.sundayOpenTime || "",
    sundayCloseTime: databaseSettings.sunday_close_time || seedCatalog.businessSettings.sundayCloseTime || ""
  };
}
