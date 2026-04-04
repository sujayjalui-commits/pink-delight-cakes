import { validateAdminOrderUpdate } from "../../../../packages/shared/schemas/admin-order-schema.js";
import { getAdminOrderById, getAdminOrders, updateAdminOrderFields } from "../db/d1-client.js";

function mapOrder(order) {
  return {
    id: order.id,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    customerEmail: order.customer_email,
    productId: order.product_id,
    productSnapshot: order.product_snapshot ? JSON.parse(order.product_snapshot) : null,
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
    createdAt: order.created_at,
    updatedAt: order.updated_at
  };
}

export async function getAdminOrdersView(env, filters = {}) {
  const orders = await getAdminOrders(env, filters);
  return orders.map(mapOrder);
}

export async function getAdminOrderDetail(env, orderId) {
  const order = await getAdminOrderById(env, orderId);
  return order ? mapOrder(order) : null;
}

export async function updateAdminOrder(env, orderId, input) {
  const validation = validateAdminOrderUpdate(input);

  if (!validation.valid) {
    return {
      ok: false,
      status: 400,
      error: "Validation failed",
      details: validation.errors
    };
  }

  const updatedOrder = await updateAdminOrderFields(env, orderId, input);

  if (!updatedOrder) {
    return {
      ok: false,
      status: 404,
      error: "Order not found"
    };
  }

  return {
    ok: true,
    order: mapOrder(updatedOrder)
  };
}
