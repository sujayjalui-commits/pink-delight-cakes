export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

export function isStringWithinLength(value, maxLength) {
  return typeof value === "string" && value.trim().length <= maxLength;
}

export function isValidPhoneNumber(value) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return false;
  }

  const digitsOnly = normalized.replace(/\D/g, "");

  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return false;
  }

  return /^[0-9+\-()\s]+$/.test(normalized);
}

export function isValidEmailAddress(value) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}
