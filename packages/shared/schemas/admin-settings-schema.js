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
  if (!isOptionalString(settings.deliveryPickupCopy)) errors.push("deliveryPickupCopy must be a string");
  if (!isOptionalString(settings.noticePeriodCopy)) errors.push("noticePeriodCopy must be a string");
  if (!isOptionalString(settings.bakeryIntroTitle)) errors.push("bakeryIntroTitle must be a string");
  if (!isOptionalString(settings.bakeryIntroParagraph1)) errors.push("bakeryIntroParagraph1 must be a string");
  if (!isOptionalString(settings.bakeryIntroParagraph2)) errors.push("bakeryIntroParagraph2 must be a string");
  if (!isOptionalString(settings.responseTimeCopy)) errors.push("responseTimeCopy must be a string");

  validateOptionalLength(settings.brandName, "brandName", 100, errors);
  validateOptionalLength(settings.contactEmail, "contactEmail", 120, errors);
  validateOptionalLength(settings.contactPhone, "contactPhone", 40, errors);
  validateOptionalLength(settings.instagramHandle, "instagramHandle", 80, errors);
  validateOptionalLength(settings.city, "city", 100, errors);
  validateOptionalLength(settings.deliveryPickupCopy, "deliveryPickupCopy", 120, errors);
  validateOptionalLength(settings.noticePeriodCopy, "noticePeriodCopy", 120, errors);
  validateOptionalLength(settings.bakeryIntroTitle, "bakeryIntroTitle", 160, errors);
  validateOptionalLength(settings.bakeryIntroParagraph1, "bakeryIntroParagraph1", 500, errors);
  validateOptionalLength(settings.bakeryIntroParagraph2, "bakeryIntroParagraph2", 500, errors);
  validateOptionalLength(settings.responseTimeCopy, "responseTimeCopy", 220, errors);

  return {
    valid: errors.length === 0,
    errors
  };
}
