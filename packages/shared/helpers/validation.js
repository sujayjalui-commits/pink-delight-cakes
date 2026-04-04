export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}
