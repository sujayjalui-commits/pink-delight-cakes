export const ORDER_STATUSES = [
  "new",
  "reviewing",
  "quoted",
  "payment_pending",
  "paid",
  "scheduled",
  "completed",
  "cancelled"
];

export const ORDER_STATUS_TRANSITIONS = {
  new: ["reviewing", "quoted", "payment_pending", "paid", "scheduled", "cancelled"],
  reviewing: ["quoted", "payment_pending", "paid", "scheduled", "cancelled"],
  quoted: ["reviewing", "payment_pending", "paid", "scheduled", "cancelled"],
  payment_pending: ["quoted", "paid", "scheduled", "cancelled"],
  paid: ["scheduled", "completed", "cancelled"],
  scheduled: ["completed", "cancelled"],
  completed: [],
  cancelled: []
};

export function getAllowedNextOrderStatuses(status) {
  return ORDER_STATUS_TRANSITIONS[String(status || "").trim()] || [];
}

export function canTransitionOrderStatus(fromStatus, toStatus) {
  const currentStatus = String(fromStatus || "").trim();
  const nextStatus = String(toStatus || "").trim();

  if (!currentStatus || !nextStatus) {
    return false;
  }

  if (currentStatus === nextStatus) {
    return true;
  }

  return getAllowedNextOrderStatuses(currentStatus).includes(nextStatus);
}

export const PRODUCT_AVAILABILITY_STATUSES = [
  "available",
  "limited",
  "unavailable"
];

export const FULFILLMENT_TYPES = [
  "pickup",
  "local_delivery"
];

export const DELIVERY_STATUSES = [
  "not_applicable",
  "delivery_pending",
  "delivery_scheduled",
  "out_for_delivery",
  "delivered"
];

export const DELIVERY_STATUS_TRANSITIONS = {
  not_applicable: [],
  delivery_pending: ["delivery_scheduled"],
  delivery_scheduled: ["out_for_delivery", "delivered"],
  out_for_delivery: ["delivered"],
  delivered: []
};

export function getAllowedNextDeliveryStatuses(status) {
  return DELIVERY_STATUS_TRANSITIONS[String(status || "").trim()] || [];
}

export function canTransitionDeliveryStatus(fromStatus, toStatus) {
  const currentStatus = String(fromStatus || "").trim();
  const nextStatus = String(toStatus || "").trim();

  if (!currentStatus || !nextStatus) {
    return false;
  }

  if (currentStatus === nextStatus) {
    return true;
  }

  return getAllowedNextDeliveryStatuses(currentStatus).includes(nextStatus);
}

export function normalizeDeliveryStatusForFulfillment(fulfillmentType, deliveryStatus) {
  const normalizedFulfillmentType = String(fulfillmentType || "").trim();
  const normalizedDeliveryStatus = String(deliveryStatus || "").trim();

  if (normalizedFulfillmentType !== "local_delivery") {
    return "not_applicable";
  }

  if (!normalizedDeliveryStatus || normalizedDeliveryStatus === "not_applicable") {
    return "delivery_pending";
  }

  return DELIVERY_STATUSES.includes(normalizedDeliveryStatus)
    ? normalizedDeliveryStatus
    : "delivery_pending";
}
