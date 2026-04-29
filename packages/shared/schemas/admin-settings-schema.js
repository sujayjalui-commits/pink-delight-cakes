import { isNonEmptyString } from "../helpers/validation.js";

const ALLOWED_CURRENCIES = ["INR"];
const ALLOWED_INQUIRY_CHANNELS = ["website", "whatsapp", "instagram"];

function isOptionalString(value) {
  return value === null || value === undefined || typeof value === "string";
}

function validateOptionalLength(value, fieldName, maxLength, errors) {
  if (typeof value === "string" && value.trim().length > maxLength) {
    errors.push(`${fieldName} must be ${maxLength} characters or fewer`);
  }
}

export function validateAdminSettingsInput(settings) {
  const errors = [];

  if (!isNonEmptyString(settings.brandName)) errors.push("brandName is required");
  if (!ALLOWED_CURRENCIES.includes(settings.currency)) errors.push("currency is invalid");
  if (!ALLOWED_INQUIRY_CHANNELS.includes(settings.inquiryChannel)) errors.push("inquiryChannel is invalid");

  if (!isOptionalString(settings.contactEmail)) errors.push("contactEmail must be a string");
  if (!isOptionalString(settings.contactPhone)) errors.push("contactPhone must be a string");
  if (!isOptionalString(settings.instagramHandle)) errors.push("instagramHandle must be a string");
  if (!isOptionalString(settings.city)) errors.push("city must be a string");
  if (!isOptionalString(settings.addressLine1)) errors.push("addressLine1 must be a string");
  if (!isOptionalString(settings.addressLine2)) errors.push("addressLine2 must be a string");
  if (!isOptionalString(settings.stateRegion)) errors.push("stateRegion must be a string");
  if (!isOptionalString(settings.postalCode)) errors.push("postalCode must be a string");
  if (!isOptionalString(settings.countryCode)) errors.push("countryCode must be a string");
  if (!isOptionalString(settings.deliveryPickupCopy)) errors.push("deliveryPickupCopy must be a string");
  if (!isOptionalString(settings.noticePeriodCopy)) errors.push("noticePeriodCopy must be a string");
  if (!isOptionalString(settings.bakeryIntroTitle)) errors.push("bakeryIntroTitle must be a string");
  if (!isOptionalString(settings.bakeryIntroParagraph1)) errors.push("bakeryIntroParagraph1 must be a string");
  if (!isOptionalString(settings.bakeryIntroParagraph2)) errors.push("bakeryIntroParagraph2 must be a string");
  if (!isOptionalString(settings.responseTimeCopy)) errors.push("responseTimeCopy must be a string");
  if (!isOptionalString(settings.featuredSpotlightTitle)) errors.push("featuredSpotlightTitle must be a string");
  if (!isOptionalString(settings.featuredSpotlightDescription)) errors.push("featuredSpotlightDescription must be a string");
  if (!isOptionalString(settings.featuredSpotlightImageUrl)) errors.push("featuredSpotlightImageUrl must be a string");
  if (!isOptionalString(settings.featuredSpotlightSourceUrl)) errors.push("featuredSpotlightSourceUrl must be a string");
  if (!isOptionalString(settings.heroProductSlug1)) errors.push("heroProductSlug1 must be a string");
  if (!isOptionalString(settings.heroProductSlug2)) errors.push("heroProductSlug2 must be a string");
  if (!isOptionalString(settings.heroProductSlug3)) errors.push("heroProductSlug3 must be a string");
  if (!isOptionalString(settings.heroProductSlug4)) errors.push("heroProductSlug4 must be a string");
  if (!isOptionalString(settings.weekdayOpenTime)) errors.push("weekdayOpenTime must be a string");
  if (!isOptionalString(settings.weekdayCloseTime)) errors.push("weekdayCloseTime must be a string");
  if (!isOptionalString(settings.saturdayOpenTime)) errors.push("saturdayOpenTime must be a string");
  if (!isOptionalString(settings.saturdayCloseTime)) errors.push("saturdayCloseTime must be a string");
  if (!isOptionalString(settings.sundayOpenTime)) errors.push("sundayOpenTime must be a string");
  if (!isOptionalString(settings.sundayCloseTime)) errors.push("sundayCloseTime must be a string");

  validateOptionalLength(settings.brandName, "brandName", 100, errors);
  validateOptionalLength(settings.contactEmail, "contactEmail", 120, errors);
  validateOptionalLength(settings.contactPhone, "contactPhone", 40, errors);
  validateOptionalLength(settings.instagramHandle, "instagramHandle", 80, errors);
  validateOptionalLength(settings.city, "city", 100, errors);
  validateOptionalLength(settings.addressLine1, "addressLine1", 160, errors);
  validateOptionalLength(settings.addressLine2, "addressLine2", 160, errors);
  validateOptionalLength(settings.stateRegion, "stateRegion", 100, errors);
  validateOptionalLength(settings.postalCode, "postalCode", 20, errors);
  validateOptionalLength(settings.countryCode, "countryCode", 8, errors);
  validateOptionalLength(settings.deliveryPickupCopy, "deliveryPickupCopy", 120, errors);
  validateOptionalLength(settings.noticePeriodCopy, "noticePeriodCopy", 120, errors);
  validateOptionalLength(settings.bakeryIntroTitle, "bakeryIntroTitle", 160, errors);
  validateOptionalLength(settings.bakeryIntroParagraph1, "bakeryIntroParagraph1", 500, errors);
  validateOptionalLength(settings.bakeryIntroParagraph2, "bakeryIntroParagraph2", 500, errors);
  validateOptionalLength(settings.responseTimeCopy, "responseTimeCopy", 220, errors);
  validateOptionalLength(settings.featuredSpotlightTitle, "featuredSpotlightTitle", 160, errors);
  validateOptionalLength(settings.featuredSpotlightDescription, "featuredSpotlightDescription", 500, errors);
  validateOptionalLength(settings.featuredSpotlightImageUrl, "featuredSpotlightImageUrl", 600000, errors);
  validateOptionalLength(settings.featuredSpotlightSourceUrl, "featuredSpotlightSourceUrl", 300, errors);
  validateOptionalLength(settings.heroProductSlug1, "heroProductSlug1", 120, errors);
  validateOptionalLength(settings.heroProductSlug2, "heroProductSlug2", 120, errors);
  validateOptionalLength(settings.heroProductSlug3, "heroProductSlug3", 120, errors);
  validateOptionalLength(settings.heroProductSlug4, "heroProductSlug4", 120, errors);
  validateOptionalLength(settings.weekdayOpenTime, "weekdayOpenTime", 8, errors);
  validateOptionalLength(settings.weekdayCloseTime, "weekdayCloseTime", 8, errors);
  validateOptionalLength(settings.saturdayOpenTime, "saturdayOpenTime", 8, errors);
  validateOptionalLength(settings.saturdayCloseTime, "saturdayCloseTime", 8, errors);
  validateOptionalLength(settings.sundayOpenTime, "sundayOpenTime", 8, errors);
  validateOptionalLength(settings.sundayCloseTime, "sundayCloseTime", 8, errors);

  if (typeof settings.countryCode === "string" && settings.countryCode.trim() && !/^[A-Za-z]{2}$/.test(settings.countryCode.trim())) {
    errors.push("countryCode must be a 2-letter country code");
  }

  if (
    typeof settings.featuredSpotlightSourceUrl === "string" &&
    settings.featuredSpotlightSourceUrl.trim() &&
    !/^https?:\/\/\S+$/i.test(settings.featuredSpotlightSourceUrl.trim())
  ) {
    errors.push("featuredSpotlightSourceUrl must be a valid http or https URL");
  }

  [
    "weekdayOpenTime",
    "weekdayCloseTime",
    "saturdayOpenTime",
    "saturdayCloseTime",
    "sundayOpenTime",
    "sundayCloseTime"
  ].forEach((fieldName) => {
    const value = settings[fieldName];
    if (typeof value === "string" && value.trim() && !/^\d{2}:\d{2}$/.test(value.trim())) {
      errors.push(`${fieldName} must use HH:MM format`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}
