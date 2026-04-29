import { seedCatalog } from "../../../../packages/shared/constants/seed-catalog.js";
import { validateAdminSettingsInput } from "../../../../packages/shared/schemas/admin-settings-schema.js";
import { getAdminBusinessSettings, saveBusinessSettings } from "../db/d1-client.js";

function mapBusinessSettings(settings) {
  return {
    id: settings.id,
    brandName: settings.brand_name,
    contactEmail: settings.contact_email,
    contactPhone: settings.contact_phone,
    instagramHandle: settings.instagram_handle,
    city: settings.city,
    addressLine1: settings.address_line_1,
    addressLine2: settings.address_line_2,
    stateRegion: settings.state_region,
    postalCode: settings.postal_code,
    countryCode: settings.country_code,
    currency: settings.currency,
    paymentMode: settings.payment_mode,
    inquiryChannel: settings.inquiry_channel,
    deliveryPickupCopy: settings.delivery_pickup_copy,
    noticePeriodCopy: settings.notice_period_copy,
    bakeryIntroTitle: settings.bakery_intro_title,
    bakeryIntroParagraph1: settings.bakery_intro_paragraph_1,
    bakeryIntroParagraph2: settings.bakery_intro_paragraph_2,
    responseTimeCopy: settings.response_time_copy,
    featuredSpotlightTitle: settings.featured_spotlight_title,
    featuredSpotlightDescription: settings.featured_spotlight_description,
    featuredSpotlightImageUrl: settings.featured_spotlight_image_url,
    featuredSpotlightSourceUrl: settings.featured_spotlight_source_url,
    heroProductSlug1: settings.hero_product_slug_1,
    heroProductSlug2: settings.hero_product_slug_2,
    heroProductSlug3: settings.hero_product_slug_3,
    heroProductSlug4: settings.hero_product_slug_4,
    weekdayOpenTime: settings.weekday_open_time,
    weekdayCloseTime: settings.weekday_close_time,
    saturdayOpenTime: settings.saturday_open_time,
    saturdayCloseTime: settings.saturday_close_time,
    sundayOpenTime: settings.sunday_open_time,
    sundayCloseTime: settings.sunday_close_time,
    createdAt: settings.created_at,
    updatedAt: settings.updated_at
  };
}

function createSeedSettingsView() {
  return {
    id: null,
    ...seedCatalog.businessSettings,
    addressLine1: seedCatalog.businessSettings.addressLine1 || "",
    addressLine2: seedCatalog.businessSettings.addressLine2 || "",
    stateRegion: seedCatalog.businessSettings.stateRegion || "Maharashtra",
    postalCode: seedCatalog.businessSettings.postalCode || "",
    countryCode: seedCatalog.businessSettings.countryCode || "IN",
    weekdayOpenTime: seedCatalog.businessSettings.weekdayOpenTime || "10:00",
    weekdayCloseTime: seedCatalog.businessSettings.weekdayCloseTime || "20:00",
    saturdayOpenTime: seedCatalog.businessSettings.saturdayOpenTime || "10:00",
    saturdayCloseTime: seedCatalog.businessSettings.saturdayCloseTime || "20:00",
    sundayOpenTime: seedCatalog.businessSettings.sundayOpenTime || "",
    sundayCloseTime: seedCatalog.businessSettings.sundayCloseTime || "",
    createdAt: null,
    updatedAt: null
  };
}

function normalizeInput(input) {
  return {
    brandName: input.brandName.trim(),
    contactEmail: input.contactEmail?.trim() || null,
    contactPhone: input.contactPhone?.trim() || null,
    instagramHandle: input.instagramHandle?.trim() || null,
    city: input.city?.trim() || null,
    addressLine1: input.addressLine1?.trim() || null,
    addressLine2: input.addressLine2?.trim() || null,
    stateRegion: input.stateRegion?.trim() || null,
    postalCode: input.postalCode?.trim() || null,
    countryCode: input.countryCode?.trim().toUpperCase() || "IN",
    currency: input.currency,
    paymentMode: "manual_quote",
    inquiryChannel: input.inquiryChannel,
    deliveryPickupCopy: input.deliveryPickupCopy?.trim() || null,
    noticePeriodCopy: input.noticePeriodCopy?.trim() || null,
    bakeryIntroTitle: input.bakeryIntroTitle?.trim() || null,
    bakeryIntroParagraph1: input.bakeryIntroParagraph1?.trim() || null,
    bakeryIntroParagraph2: input.bakeryIntroParagraph2?.trim() || null,
    responseTimeCopy: input.responseTimeCopy?.trim() || null,
    featuredSpotlightTitle: input.featuredSpotlightTitle?.trim() || null,
    featuredSpotlightDescription: input.featuredSpotlightDescription?.trim() || null,
    featuredSpotlightImageUrl: input.featuredSpotlightImageUrl?.trim() || null,
    featuredSpotlightSourceUrl: input.featuredSpotlightSourceUrl?.trim() || null,
    heroProductSlug1: input.heroProductSlug1?.trim() || null,
    heroProductSlug2: input.heroProductSlug2?.trim() || null,
    heroProductSlug3: input.heroProductSlug3?.trim() || null,
    heroProductSlug4: input.heroProductSlug4?.trim() || null,
    weekdayOpenTime: input.weekdayOpenTime?.trim() || null,
    weekdayCloseTime: input.weekdayCloseTime?.trim() || null,
    saturdayOpenTime: input.saturdayOpenTime?.trim() || null,
    saturdayCloseTime: input.saturdayCloseTime?.trim() || null,
    sundayOpenTime: input.sundayOpenTime?.trim() || null,
    sundayCloseTime: input.sundayCloseTime?.trim() || null
  };
}

export async function getAdminBusinessSettingsView(env) {
  const settings = await getAdminBusinessSettings(env);
  return settings ? mapBusinessSettings(settings) : createSeedSettingsView();
}

export async function updateAdminBusinessSettings(env, input) {
  const validation = validateAdminSettingsInput(input);

  if (!validation.valid) {
    return {
      ok: false,
      status: 400,
      error: "Validation failed",
      details: validation.errors
    };
  }

  const saved = await saveBusinessSettings(env, normalizeInput(input));

  if (!saved) {
    return {
      ok: false,
      status: 503,
      error: "Business settings could not be saved right now"
    };
  }

  return {
    ok: true,
    settings: mapBusinessSettings(saved)
  };
}
