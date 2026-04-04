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
    currency: settings.currency,
    paymentMode: settings.payment_mode,
    inquiryChannel: settings.inquiry_channel,
    deliveryPickupCopy: settings.delivery_pickup_copy,
    noticePeriodCopy: settings.notice_period_copy,
    bakeryIntroTitle: settings.bakery_intro_title,
    bakeryIntroParagraph1: settings.bakery_intro_paragraph_1,
    bakeryIntroParagraph2: settings.bakery_intro_paragraph_2,
    responseTimeCopy: settings.response_time_copy,
    createdAt: settings.created_at,
    updatedAt: settings.updated_at
  };
}

function createSeedSettingsView() {
  return {
    id: null,
    ...seedCatalog.businessSettings,
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
    currency: input.currency,
    paymentMode: "manual_quote",
    inquiryChannel: input.inquiryChannel,
    deliveryPickupCopy: input.deliveryPickupCopy?.trim() || null,
    noticePeriodCopy: input.noticePeriodCopy?.trim() || null,
    bakeryIntroTitle: input.bakeryIntroTitle?.trim() || null,
    bakeryIntroParagraph1: input.bakeryIntroParagraph1?.trim() || null,
    bakeryIntroParagraph2: input.bakeryIntroParagraph2?.trim() || null,
    responseTimeCopy: input.responseTimeCopy?.trim() || null
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
