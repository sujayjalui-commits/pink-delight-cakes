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
  productId: 120,
  productName: 120,
  flavor: 80,
  sizeLabel: 80,
  servings: 40,
  eventDate: 32,
  addOn: 80,
  itemNotes: 240,
  notes: 800,
  website: 120
};

const CART_LIMITS = {
  maxItems: 12,
  maxQuantity: 20
};

function addLengthError(errors, fieldName, value, maxLength) {
  if (value !== undefined && value !== null && !isStringWithinLength(value, maxLength)) {
    errors.push(`${fieldName} must be ${maxLength} characters or fewer`);
  }
}

function validateCartItems(errors, cartItems) {
  if (cartItems === undefined || cartItems === null) {
    return;
  }

  if (!Array.isArray(cartItems)) {
    errors.push("cartItems must be an array");
    return;
  }

  if (cartItems.length > CART_LIMITS.maxItems) {
    errors.push(`cartItems must include ${CART_LIMITS.maxItems} items or fewer`);
  }

  cartItems.forEach((item, index) => {
    const label = `cartItems[${index}]`;

    if (!item || typeof item !== "object") {
      errors.push(`${label} must be an object`);
      return;
    }

    if (!isNonEmptyString(item.productId)) {
      errors.push(`${label}.productId is required`);
    }

    addLengthError(errors, `${label}.productId`, item.productId, FIELD_LIMITS.productId);
    addLengthError(errors, `${label}.productName`, item.productName, FIELD_LIMITS.productName);
    addLengthError(errors, `${label}.flavor`, item.flavor, FIELD_LIMITS.flavor);
    addLengthError(errors, `${label}.sizeLabel`, item.sizeLabel, FIELD_LIMITS.sizeLabel);
    addLengthError(errors, `${label}.servings`, item.servings, FIELD_LIMITS.servings);
    addLengthError(errors, `${label}.addOn`, item.addOn, FIELD_LIMITS.addOn);
    addLengthError(errors, `${label}.itemNotes`, item.itemNotes, FIELD_LIMITS.itemNotes);

    const quantity = Number(item.quantity);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > CART_LIMITS.maxQuantity) {
      errors.push(`${label}.quantity must be between 1 and ${CART_LIMITS.maxQuantity}`);
    }

    ["startingPrice", "estimatedLineTotal"].forEach((fieldName) => {
      if (item[fieldName] === undefined || item[fieldName] === null || item[fieldName] === "") {
        return;
      }

      const amount = Number(item[fieldName]);

      if (!Number.isFinite(amount) || amount < 0) {
        errors.push(`${label}.${fieldName} must be a positive number`);
      }
    });
  });
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
  validateCartItems(errors, orderRequest.cartItems);

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
