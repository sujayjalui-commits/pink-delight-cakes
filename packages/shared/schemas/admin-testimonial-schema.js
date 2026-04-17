import { isNonEmptyString, isPositiveInteger } from "../helpers/validation.js";

function isOptionalString(value) {
  return value === null || value === undefined || typeof value === "string";
}

function validateLength(value, fieldName, maxLength, errors) {
  if (typeof value === "string" && value.trim().length > maxLength) {
    errors.push(`${fieldName} must be ${maxLength} characters or fewer`);
  }
}

function validateTestimonialItem(item, index, errors) {
  const prefix = `testimonials[${index}]`;

  if (!item || typeof item !== "object" || Array.isArray(item)) {
    errors.push(`${prefix} must be an object`);
    return;
  }

  if (!isNonEmptyString(item.customerName)) {
    errors.push(`${prefix}.customerName is required`);
  }

  if (!isNonEmptyString(item.quoteText)) {
    errors.push(`${prefix}.quoteText is required`);
  }

  if (!isOptionalString(item.occasionLabel)) {
    errors.push(`${prefix}.occasionLabel must be a string`);
  }

  if (item.rating !== undefined && item.rating !== null && !isPositiveInteger(item.rating)) {
    errors.push(`${prefix}.rating must be a positive integer`);
  }

  if (item.rating !== undefined && item.rating !== null && (item.rating < 1 || item.rating > 5)) {
    errors.push(`${prefix}.rating must be between 1 and 5`);
  }

  if (item.isPublished !== undefined && typeof item.isPublished !== "boolean") {
    errors.push(`${prefix}.isPublished must be a boolean`);
  }

  validateLength(item.customerName, `${prefix}.customerName`, 80, errors);
  validateLength(item.occasionLabel, `${prefix}.occasionLabel`, 80, errors);
  validateLength(item.quoteText, `${prefix}.quoteText`, 500, errors);
}

export function validateAdminTestimonialsInput(testimonials) {
  const errors = [];

  if (!Array.isArray(testimonials)) {
    return {
      valid: false,
      errors: ["testimonials must be an array"]
    };
  }

  if (testimonials.length > 12) {
    errors.push("testimonials must contain 12 items or fewer");
  }

  testimonials.forEach((item, index) => {
    validateTestimonialItem(item, index, errors);
  });

  return {
    valid: errors.length === 0,
    errors
  };
}
