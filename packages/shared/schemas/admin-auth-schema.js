import { isNonEmptyString } from "../helpers/validation.js";

function validatePassword(password) {
  return isNonEmptyString(password) && password.trim().length >= 8;
}

export function validateAdminSetupInput(input) {
  const errors = [];

  if (!isNonEmptyString(input.email)) errors.push("email is required");
  if (!validatePassword(input.password)) errors.push("password must be at least 8 characters");
  if (!isNonEmptyString(input.setupKey)) errors.push("setupKey is required");

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateAdminLoginInput(input) {
  const errors = [];

  if (!isNonEmptyString(input.email)) errors.push("email is required");
  if (!validatePassword(input.password)) errors.push("password must be at least 8 characters");

  return {
    valid: errors.length === 0,
    errors
  };
}
