import { FULFILLMENT_TYPES, ORDER_STATUSES } from "../constants/order-statuses.js";
import { isNonEmptyString } from "../helpers/validation.js";

export function validateOrderRequestDraft(orderRequest) {
  const errors = [];

  if (!isNonEmptyString(orderRequest.customerName)) errors.push("customerName is required");
  if (!isNonEmptyString(orderRequest.customerPhone)) errors.push("customerPhone is required");
  if (!isNonEmptyString(orderRequest.productId)) errors.push("productId is required");
  if (!FULFILLMENT_TYPES.includes(orderRequest.fulfillmentType)) errors.push("fulfillmentType is invalid");
  if (!ORDER_STATUSES.includes(orderRequest.status)) errors.push("status is invalid");

  return {
    valid: errors.length === 0,
    errors
  };
}
