import { PRODUCT_AVAILABILITY_STATUSES } from "../constants/order-statuses.js";
import { isNonEmptyString, isPositiveInteger } from "../helpers/validation.js";

function isOptionalMediaString(value) {
  return value == null || typeof value === "string";
}

function validateSize(size) {
  const errors = [];

  if (!isNonEmptyString(size.label)) errors.push("size label is required");
  if (!isNonEmptyString(size.servings)) errors.push("size servings is required");
  if (!isPositiveInteger(size.price)) errors.push("size price must be a positive integer");

  return errors;
}

export function validateAdminProductInput(product) {
  const errors = [];

  if (!isNonEmptyString(product.slug)) errors.push("slug is required");
  if (!isNonEmptyString(product.name)) errors.push("name is required");
  if (!isNonEmptyString(product.category)) errors.push("category is required");
  if (!isNonEmptyString(product.shortDescription)) errors.push("shortDescription is required");
  if (!isPositiveInteger(product.startingPrice)) errors.push("startingPrice must be a positive integer");
  if (!isPositiveInteger(product.leadTimeHours)) errors.push("leadTimeHours must be a positive integer");
  if (!PRODUCT_AVAILABILITY_STATUSES.includes(product.availabilityStatus)) {
    errors.push("availabilityStatus is invalid");
  }

  if (!isOptionalMediaString(product.imageUrl)) errors.push("imageUrl must be a string");
  if (!isOptionalMediaString(product.videoUrl)) errors.push("videoUrl must be a string");

  if (!Array.isArray(product.flavors) || product.flavors.length === 0) {
    errors.push("flavors must contain at least one item");
  }

  if (!Array.isArray(product.sizes) || product.sizes.length === 0) {
    errors.push("sizes must contain at least one item");
  }

  if (!Array.isArray(product.addOns)) {
    errors.push("addOns must be an array");
  }

  for (const flavor of product.flavors || []) {
    if (!isNonEmptyString(flavor)) {
      errors.push("each flavor must be a non-empty string");
      break;
    }
  }

  for (const size of product.sizes || []) {
    const sizeErrors = validateSize(size);
    errors.push(...sizeErrors);

    if (sizeErrors.length) {
      break;
    }
  }

  for (const addOn of product.addOns || []) {
    if (!isNonEmptyString(addOn)) {
      errors.push("each add-on must be a non-empty string");
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
