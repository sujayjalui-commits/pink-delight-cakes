import { ORDER_STATUSES } from "../constants/order-statuses.js";

export function validateAdminOrderUpdate(input) {
  const errors = [];

  if (input.status !== undefined && !ORDER_STATUSES.includes(input.status)) {
    errors.push("status is invalid");
  }

  if (
    input.quotedAmount !== undefined &&
    input.quotedAmount !== null &&
    (!Number.isInteger(input.quotedAmount) || input.quotedAmount < 0)
  ) {
    errors.push("quotedAmount must be a non-negative integer");
  }

  if (
    input.internalNote !== undefined &&
    input.internalNote !== null &&
    typeof input.internalNote !== "string"
  ) {
    errors.push("internalNote must be a string");
  }

  if (errors.length === 0 && input.status === undefined && input.quotedAmount === undefined && input.internalNote === undefined) {
    errors.push("at least one field is required");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
