import { seedCatalog } from "../../../../packages/shared/constants/seed-catalog.js";
import { isValidPhoneNumber } from "../../../../packages/shared/helpers/validation.js";
import { validatePublicOrderRequestInput } from "../../../../packages/shared/schemas/order-request-schema.js";
import { createOrderRequest, getAdminOrderById, getProductBySlug, hasDatabase } from "../db/d1-client.js";

const PUBLIC_STATUS_MESSAGES = {
  new: {
    tone: "active",
    stage: "request_received",
    label: "Request received",
    message: "Your inquiry is safely with the bakery. We will review the details and follow up shortly.",
    nextStepTitle: "Next step",
    nextStepMessage: "The bakery will review your design notes, date, and servings before sharing the next update.",
    customerActionTitle: "What you can do now",
    customerActionMessage: "Keep your reference number handy. If you need to add design notes or update the date, mention it when you message the bakery.",
    bakeryActionTitle: "What the bakery is doing",
    bakeryActionMessage: "Reviewing your cake details, checking the celebration date, and deciding whether any clarifications are needed.",
    followUpTitle: "When to follow up",
    followUpMessage: "If you have not heard back by tomorrow, send a WhatsApp message with your reference number for a quick update.",
    whatsAppCtaLabel: "Share extra details on WhatsApp"
  },
  reviewing: {
    tone: "active",
    stage: "reviewing",
    label: "Reviewing details",
    message: "We are checking design notes, date availability, and serving details before sharing the next step.",
    nextStepTitle: "Next step",
    nextStepMessage: "Expect a reply with design clarifications or your quote once the review is complete.",
    customerActionTitle: "What you can do now",
    customerActionMessage: "Stay available in case the bakery needs a quick clarification about flavor, design, or servings.",
    bakeryActionTitle: "What the bakery is doing",
    bakeryActionMessage: "Checking the design brief, confirming the event date, and preparing the most accurate next reply.",
    followUpTitle: "When to follow up",
    followUpMessage: "If your event is close or your details have changed, message the bakery now instead of waiting for the next automatic update.",
    whatsAppCtaLabel: "Ask about review progress"
  },
  quoted: {
    tone: "highlight",
    stage: "quote_shared",
    label: "Quote shared",
    message: "Your pricing has been prepared. Please confirm if you would like to go ahead with the order.",
    nextStepTitle: "What to do now",
    nextStepMessage: "Check the latest bakery message and confirm if you would like to lock in the order.",
    customerActionTitle: "What you can do now",
    customerActionMessage: "Review the quote and reply when you are ready to confirm. Mention any last design or serving changes before the order is locked in.",
    bakeryActionTitle: "What the bakery is doing",
    bakeryActionMessage: "Waiting for your go-ahead so the celebration date and production slot can move forward.",
    followUpTitle: "When to follow up",
    followUpMessage: "Reply as soon as you can if you want this order to move ahead. Earlier confirmation keeps the date planning smoother.",
    whatsAppCtaLabel: "Confirm or discuss this quote"
  },
  payment_pending: {
    tone: "highlight",
    stage: "confirmed",
    label: "Waiting for confirmation",
    message: "The order is almost locked in. A final confirmation step is still pending before the date is reserved.",
    nextStepTitle: "What to do now",
    nextStepMessage: "Complete the remaining confirmation step shared by the bakery so the celebration date can be reserved.",
    customerActionTitle: "What you can do now",
    customerActionMessage: "Complete the final confirmation step shared by the bakery so your order can move from tentative to locked in.",
    bakeryActionTitle: "What the bakery is doing",
    bakeryActionMessage: "Holding the order at the confirmation stage and waiting for the final step before the date is formally reserved.",
    followUpTitle: "When to follow up",
    followUpMessage: "If anything about the confirmation step is unclear, message the bakery now instead of waiting until the celebration date is closer.",
    whatsAppCtaLabel: "Complete confirmation on WhatsApp"
  },
  paid: {
    tone: "success",
    stage: "confirmed",
    label: "Confirmed",
    message: "Your order has been confirmed and the celebration date is now being prepared for.",
    nextStepTitle: "Next step",
    nextStepMessage: "The bakery will now move your cake into the preparation schedule for the event date.",
    customerActionTitle: "What you can do now",
    customerActionMessage: "You are in a confirmed state now. Only message the bakery if timing, delivery, or design details need to change.",
    bakeryActionTitle: "What the bakery is doing",
    bakeryActionMessage: "Moving your order into the bakery schedule and preparing for the event date you selected.",
    followUpTitle: "When to follow up",
    followUpMessage: "You usually do not need to follow up right away. Reach out only if there is a genuine change or if the event is very close.",
    whatsAppCtaLabel: "Share final order details"
  },
  scheduled: {
    tone: "success",
    stage: "scheduled",
    label: "Scheduled",
    message: "Your cake is on the production plan for the selected event date.",
    nextStepTitle: "Next step",
    nextStepMessage: "Pickup or delivery timing will be followed as planned for your celebration date.",
    customerActionTitle: "What you can do now",
    customerActionMessage: "Double-check your pickup or delivery details. If anything needs correction, mention it before the event date gets too close.",
    bakeryActionTitle: "What the bakery is doing",
    bakeryActionMessage: "Your cake is already on the production plan and the bakery is working toward the celebration date as scheduled.",
    followUpTitle: "When to follow up",
    followUpMessage: "Only follow up if timing, address, design, or serving details need a correction. Otherwise this status is a healthy sign.",
    whatsAppCtaLabel: "Confirm pickup or delivery"
  },
  completed: {
    tone: "success",
    stage: "completed",
    label: "Completed",
    message: "Your order has been completed. Thank you for choosing Pink Delight Cakes.",
    nextStepTitle: "Done",
    nextStepMessage: "This inquiry has been completed. If you need another cake, you can start a fresh request anytime.",
    customerActionTitle: "What you can do now",
    customerActionMessage: "This inquiry is finished. If you need another celebration cake, you can start a new request whenever you are ready.",
    bakeryActionTitle: "What the bakery is doing",
    bakeryActionMessage: "This order has already been completed, so there is no further action pending on the bakery side for this reference.",
    followUpTitle: "Need something else?",
    followUpMessage: "Use WhatsApp if you want to reorder, ask for another design, or share feedback from this completed celebration.",
    whatsAppCtaLabel: "Message about a new cake"
  },
  cancelled: {
    tone: "muted",
    stage: "cancelled",
    label: "Cancelled",
    message: "This inquiry is no longer active. Please contact the bakery directly if you need help.",
    nextStepTitle: "Need help?",
    nextStepMessage: "If this status looks unexpected, message the bakery directly and mention your reference number.",
    customerActionTitle: "What you can do now",
    customerActionMessage: "If you still need a cake, ask whether this inquiry can be restarted or whether a new request would be better.",
    bakeryActionTitle: "What the bakery is doing",
    bakeryActionMessage: "There is no active work happening on this reference right now because the inquiry is marked as cancelled.",
    followUpTitle: "When to follow up",
    followUpMessage: "Message the bakery directly if this looks unexpected or if you want help placing a fresh request.",
    whatsAppCtaLabel: "Ask about this inquiry"
  }
};

const PUBLIC_TIMELINE_STEPS = [
  {
    key: "request_received",
    title: "Request received",
    description: "Your inquiry has been saved."
  },
  {
    key: "reviewing",
    title: "Reviewing details",
    description: "The bakery is checking your request."
  },
  {
    key: "quote_shared",
    title: "Quote shared",
    description: "Pricing and design details are ready."
  },
  {
    key: "confirmed",
    title: "Confirmed",
    description: "The order has been accepted."
  },
  {
    key: "scheduled",
    title: "Scheduled",
    description: "Your cake is on the production plan."
  },
  {
    key: "completed",
    title: "Completed",
    description: "The order has been finished."
  }
];

function normalizePhoneDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function parseProductSnapshot(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function buildTimeline(stage, tone) {
  if (stage === "cancelled") {
    return PUBLIC_TIMELINE_STEPS.map((step) => ({
      ...step,
      state: "cancelled"
    }));
  }

  const currentIndex = PUBLIC_TIMELINE_STEPS.findIndex((step) => step.key === stage);

  return PUBLIC_TIMELINE_STEPS.map((step, index) => ({
    ...step,
    state: index < currentIndex
      ? "completed"
      : index === currentIndex
        ? (tone === "success" && step.key === "completed" ? "completed" : "current")
        : "upcoming"
  }));
}

function mapPublicLookupOrder(order) {
  const snapshot = parseProductSnapshot(order.product_snapshot);
  const statusMeta = PUBLIC_STATUS_MESSAGES[order.status] || {
    tone: "active",
    stage: "reviewing",
    label: "In progress",
    message: "The bakery is still working through this request.",
    nextStepTitle: "Next step",
    nextStepMessage: "Please check back later or message the bakery directly if you need help."
  };

  return {
    id: order.id,
    productName: snapshot?.name || "Custom cake request",
    eventDate: order.event_date || null,
    fulfillmentType: order.fulfillment_type,
    status: order.status,
    statusTone: statusMeta.tone,
    statusLabel: statusMeta.label,
    statusMessage: statusMeta.message,
    nextStepTitle: statusMeta.nextStepTitle,
    nextStepMessage: statusMeta.nextStepMessage,
    customerActionTitle: statusMeta.customerActionTitle,
    customerActionMessage: statusMeta.customerActionMessage,
    bakeryActionTitle: statusMeta.bakeryActionTitle,
    bakeryActionMessage: statusMeta.bakeryActionMessage,
    followUpTitle: statusMeta.followUpTitle,
    followUpMessage: statusMeta.followUpMessage,
    whatsAppCtaLabel: statusMeta.whatsAppCtaLabel,
    quotedAmount: order.quoted_amount ?? null,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    timeline: buildTimeline(statusMeta.stage, statusMeta.tone)
  };
}

function findSeedProduct(productIdOrSlug) {
  return seedCatalog.products.find(
    (product) => product.slug === productIdOrSlug || String(product.id) === String(productIdOrSlug)
  );
}

function createSeedProductSnapshot(product) {
  return JSON.stringify({
    slug: product.slug,
    name: product.name,
    category: product.category,
    startingPrice: product.startingPrice
  });
}

function createDatabaseProductSnapshot(product) {
  return JSON.stringify({
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category,
    startingPrice: product.starting_price
  });
}

export async function createPublicOrderRequest(env, input) {
  if (!hasDatabase(env)) {
    return {
      ok: false,
      status: 503,
      error: "Order requests are temporarily unavailable"
    };
  }

  const draft = {
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail || "",
    productId: input.productId,
    fulfillmentType: input.fulfillmentType,
    status: "new"
  };

  const validation = validatePublicOrderRequestInput({
    ...input,
    ...draft
  });

  if (!validation.valid) {
    return {
      ok: false,
      error: "Validation failed",
      details: validation.errors
    };
  }

  const databaseProduct = await getProductBySlug(env, input.productId);
  const seedProduct = databaseProduct ? null : findSeedProduct(input.productId);
  const selectedProduct = databaseProduct || seedProduct;

  if (!selectedProduct) {
    return {
      ok: false,
      error: "Selected product is invalid"
    };
  }

  const payload = {
    ...draft,
    productId: databaseProduct ? databaseProduct.id : null,
    productSnapshot: databaseProduct ? createDatabaseProductSnapshot(databaseProduct) : createSeedProductSnapshot(seedProduct),
    flavor: input.flavor || "",
    sizeLabel: input.sizeLabel || "",
    servings: input.servings || "",
    eventDate: input.eventDate || "",
    addOn: input.addOn || "",
    notes: input.notes || "",
    sourceChannel: "website"
  };

  const persisted = await createOrderRequest(env, payload);

  if (!persisted) {
    return {
      ok: false,
      status: 503,
      error: "Order requests could not be saved right now"
    };
  }

  return {
    ok: true,
    orderRequest: persisted,
    persistence: "database"
  };
}

export async function lookupPublicOrderRequest(env, referenceId, phone) {
  if (!hasDatabase(env)) {
    return {
      ok: false,
      status: 503,
      error: "Inquiry lookup is temporarily unavailable"
    };
  }

  const normalizedReferenceId = String(referenceId || "").trim();
  const normalizedPhone = String(phone || "").trim();

  if (!/^\d+$/.test(normalizedReferenceId)) {
    return {
      ok: false,
      status: 400,
      error: "Reference ID must be a valid number"
    };
  }

  if (!isValidPhoneNumber(normalizedPhone)) {
    return {
      ok: false,
      status: 400,
      error: "Phone number must be valid"
    };
  }

  const order = await getAdminOrderById(env, Number(normalizedReferenceId));

  if (!order || normalizePhoneDigits(order.customer_phone) !== normalizePhoneDigits(normalizedPhone)) {
    return {
      ok: false,
      status: 404,
      error: "We could not match that inquiry reference with the phone number provided"
    };
  }

  return {
    ok: true,
    orderRequest: mapPublicLookupOrder(order)
  };
}
