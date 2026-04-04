import { FULFILLMENT_TYPES, ORDER_STATUSES } from "../constants/order-statuses.js";
import {
  isNonEmptyString,
  isStringWithinLength,
  isValidEmailAddress,
  isValidPhoneNumber
} from "../helpers/validation.js";

const FIELD_LIMITS = {
  customerName: 80,
  customerPhone: 24,
  customerEmail: 120,
  flavor: 80,
  sizeLabel: 80,
  servings: 40,
  eventDate: 32,
  addOn: 80,
  notes: 800,
  website: 120
};

function addLengthError(errors, fieldName, value, maxLength) {
  if (value !== undefined && value !== null && !isStringWithinLength(value, maxLength)) {
    errors.push(`${fieldName} must be ${maxLength} characters or fewer`);
  }
}

export function validateOrderRequestDraft(orderRequest) {
  const errors = [];

  if (!isNonEmptyString(orderRequest.customerName)) errors.push("customerName is required");
  if (!isNonEmptyString(orderRequest.customerPhone)) errors.push("customerPhone is required");
  if (!isNonEmptyString(orderRequest.productId)) errors.push("productId is required");
  if (!FULFILLMENT_TYPES.includes(orderRequest.fulfillmentType)) errors.push("fulfillmentType is invalid");
  if (!ORDER_STATUSES.includes(orderRequest.status)) errors.push("status is invalid");

  addLengthError(errors, "customerName", orderRequest.customerName, FIELD_LIMITS.customerName);
  addLengthError(errors, "customerPhone", orderRequest.customerPhone, FIELD_LIMITS.customerPhone);

  if (isNonEmptyString(orderRequest.customerPhone) && !isValidPhoneNumber(orderRequest.customerPhone)) {
    errors.push("customerPhone must be a valid phone number");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validatePublicOrderRequestInput(orderRequest) {
  const baseValidation = validateOrderRequestDraft(orderRequest);
  const errors = [...baseValidation.errors];

  addLengthError(errors, "customerEmail", orderRequest.customerEmail, FIELD_LIMITS.customerEmail);
  addLengthError(errors, "flavor", orderRequest.flavor, FIELD_LIMITS.flavor);
  addLengthError(errors, "sizeLabel", orderRequest.sizeLabel, FIELD_LIMITS.sizeLabel);
  addLengthError(errors, "servings", orderRequest.servings, FIELD_LIMITS.servings);
  addLengthError(errors, "eventDate", orderRequest.eventDate, FIELD_LIMITS.eventDate);
  addLengthError(errors, "addOn", orderRequest.addOn, FIELD_LIMITS.addOn);
  addLengthError(errors, "notes", orderRequest.notes, FIELD_LIMITS.notes);
  addLengthError(errors, "website", orderRequest.website, FIELD_LIMITS.website);

  if (isNonEmptyString(orderRequest.customerEmail) && !isValidEmailAddress(orderRequest.customerEmail)) {
    errors.push("customerEmail must be a valid email address");
  }

  if (isNonEmptyString(orderRequest.website)) {
    errors.push("spam check failed");
  }

  if (isNonEmptyString(orderRequest.eventDate) && !/^\d{4}-\d{2}-\d{2}$/.test(orderRequest.eventDate.trim())) {
    errors.push("eventDate must use YYYY-MM-DD format");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
