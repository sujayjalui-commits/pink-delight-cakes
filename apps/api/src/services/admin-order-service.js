import { validateAdminOrderUpdate } from "../../../../packages/shared/schemas/admin-order-schema.js";
import {
  canTransitionDeliveryStatus,
  canTransitionOrderStatus,
  getAllowedNextDeliveryStatuses,
  getAllowedNextOrderStatuses,
  normalizeDeliveryStatusForFulfillment
} from "../../../../packages/shared/constants/order-statuses.js";
import { getAdminOrderById, getAdminOrders, getOrderStatusHistoryByOrderId, updateAdminOrderFields } from "../db/d1-client.js";

function parseJsonField(value, fallback = null) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mapOrder(order) {
  const cartSnapshot = parseJsonField(order.cart_snapshot, null);
  const cartItems = Array.isArray(cartSnapshot?.items) ? cartSnapshot.items : [];
  const deliveryStatus = normalizeDeliveryStatusForFulfillment(order.fulfillment_type, order.delivery_status);

  return {
    id: order.id,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    customerEmail: order.customer_email,
    productId: order.product_id,
    productSnapshot: parseJsonField(order.product_snapshot, null),
    cartSnapshot: cartSnapshot ? {
      ...cartSnapshot,
      items: cartItems
    } : null,
    cartItemCount: cartSnapshot?.itemCount || cartItems.reduce((total, item) => total + (Number(item.quantity) || 0), 0),
    flavor: order.flavor,
    sizeLabel: order.size_label,
    servings: order.servings,
    eventDate: order.event_date,
    fulfillmentType: order.fulfillment_type,
    addOn: order.add_on,
    notes: order.notes,
    internalNote: order.internal_note,
    status: order.status,
    sourceChannel: order.source_channel,
    quotedAmount: order.quoted_amount,
    deliveryStatus,
    deliveryEtaStart: order.delivery_eta_start || null,
    deliveryEtaEnd: order.delivery_eta_end || null,
    deliveryNote: order.delivery_note || "",
    deliveryUpdatedAt: order.delivery_updated_at || null,
    createdAt: order.created_at,
    updatedAt: order.updated_at
  };
}

function mapStatusHistoryEntry(entry) {
  return {
    id: entry.id,
    orderRequestId: entry.order_request_id,
    fromStatus: entry.from_status,
    toStatus: entry.to_status,
    changedByAdminUserId: entry.changed_by_admin_user_id,
    changeSource: entry.change_source,
    createdAt: entry.created_at
  };
}

export async function getAdminOrdersView(env, filters = {}) {
  const orders = await getAdminOrders(env, filters);
  return orders.map(mapOrder);
}

export async function getAdminOrderDetail(env, orderId) {
  const order = await getAdminOrderById(env, orderId);

  if (!order) {
    return null;
  }

  const statusHistory = await getOrderStatusHistoryByOrderId(env, orderId);

  return {
    ...mapOrder(order),
    statusHistory: statusHistory.map(mapStatusHistoryEntry)
  };
}

export async function updateAdminOrder(env, orderId, input, adminUserId = null) {
  const validation = validateAdminOrderUpdate(input);

  if (!validation.valid) {
    return {
      ok: false,
      status: 400,
      error: "Validation failed",
      details: validation.errors
    };
  }

  const currentOrder = await getAdminOrderById(env, orderId);

  if (!currentOrder) {
    return {
      ok: false,
      status: 404,
      error: "Order not found"
    };
  }

  if (
    input.status !== undefined
    && input.status !== currentOrder.status
    && !canTransitionOrderStatus(currentOrder.status, input.status)
  ) {
    return {
      ok: false,
      status: 409,
      error: "Invalid status transition",
      details: [
        `Cannot move an order from ${currentOrder.status} to ${input.status}.`,
        `Allowed next statuses: ${getAllowedNextOrderStatuses(currentOrder.status).join(", ") || "none"}`
      ]
    };
  }

  const hasDeliveryField = (
    input.deliveryStatus !== undefined
    || input.deliveryEtaStart !== undefined
    || input.deliveryEtaEnd !== undefined
    || input.deliveryNote !== undefined
  );
  const currentDeliveryStatus = normalizeDeliveryStatusForFulfillment(
    currentOrder.fulfillment_type,
    currentOrder.delivery_status
  );

  if (hasDeliveryField && currentOrder.fulfillment_type !== "local_delivery") {
    return {
      ok: false,
      status: 400,
      error: "Delivery updates only apply to delivery inquiries"
    };
  }

  if (
    input.deliveryStatus !== undefined
    && input.deliveryStatus !== currentDeliveryStatus
    && !canTransitionDeliveryStatus(currentDeliveryStatus, input.deliveryStatus)
  ) {
    return {
      ok: false,
      status: 409,
      error: "Invalid delivery status transition",
      details: [
        `Cannot move delivery from ${currentDeliveryStatus} to ${input.deliveryStatus}.`,
        `Allowed next delivery statuses: ${getAllowedNextDeliveryStatuses(currentDeliveryStatus).join(", ") || "none"}`
      ]
    };
  }

  const updatedOrder = await updateAdminOrderFields(env, orderId, input, {
    changedByAdminUserId: adminUserId,
    changeSource: "admin_dashboard"
  });

  if (!updatedOrder) {
    return {
      ok: false,
      status: 500,
      error: "Order could not be updated"
    };
  }

  return {
    ok: true,
    order: mapOrder(updatedOrder)
  };
}
