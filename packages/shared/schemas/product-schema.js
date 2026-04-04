import { isNonEmptyString, isPositiveInteger } from "../helpers/validation.js";
import { PRODUCT_AVAILABILITY_STATUSES } from "../constants/order-statuses.js";

export function validateProductSeed(product) {
  const errors = [];

  if (!isNonEmptyString(product.slug)) errors.push("slug is required");
  if (!isNonEmptyString(product.name)) errors.push("name is required");
  if (!isNonEmptyString(product.category)) errors.push("category is required");
  if (!isPositiveInteger(product.startingPrice)) errors.push("startingPrice must be a positive integer");
  if (!isPositiveInteger(product.leadTimeHours)) errors.push("leadTimeHours must be a positive integer");
  if (!PRODUCT_AVAILABILITY_STATUSES.includes(product.availabilityStatus)) {
    errors.push("availabilityStatus is invalid");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
