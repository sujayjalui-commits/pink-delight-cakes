function truncateText(value, maxLength = 180) {
  const text = String(value || "").trim();

  if (!text) {
    return "";
  }

  return text.length > maxLength
    ? `${text.slice(0, Math.max(0, maxLength - 1))}…`
    : text;
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

function parseCartSnapshot(value) {
  if (!value) {
    return null;
  }

  try {
    const snapshot = JSON.parse(value);
    return snapshot && Array.isArray(snapshot.items) ? snapshot : null;
  } catch {
    return null;
  }
}

function formatFulfillmentLabel(value) {
  return value === "local_delivery" ? "Local delivery" : "Pickup";
}

function getProductSummary(orderRequest) {
  const cartSnapshot = parseCartSnapshot(orderRequest?.cart_snapshot);

  if (cartSnapshot?.items?.length) {
    const itemCount = Number(cartSnapshot.itemCount) || cartSnapshot.items.length;
    return `Cart inquiry (${itemCount} item${itemCount === 1 ? "" : "s"})`;
  }

  const productSnapshot = parseProductSnapshot(orderRequest?.product_snapshot);
  return productSnapshot?.name || "Custom cake inquiry";
}

function buildTelegramMessage(env, orderRequest) {
  const productSummary = getProductSummary(orderRequest);
  const trackUrl = `${String(env?.SITE_URL || "https://pink-delight-cakes.pages.dev").replace(/\/$/, "")}/track/?reference=${encodeURIComponent(String(orderRequest.id))}`;
  const lines = [
    "New Pink Delight Cakes inquiry",
    "",
    `Reference: #${orderRequest.id}`,
    `Customer: ${truncateText(orderRequest.customer_name, 80) || "Not shared"}`,
    `Phone: ${truncateText(orderRequest.customer_phone, 40) || "Not shared"}`,
    `Cake: ${truncateText(productSummary, 120)}`,
    `Fulfillment: ${formatFulfillmentLabel(orderRequest.fulfillment_type)}`,
    orderRequest.event_date ? `Event date: ${orderRequest.event_date}` : "",
    orderRequest.flavor ? `Flavor: ${truncateText(orderRequest.flavor, 80)}` : "",
    orderRequest.size_label ? `Size: ${truncateText(orderRequest.size_label, 80)}` : "",
    orderRequest.add_on ? `Add-on: ${truncateText(orderRequest.add_on, 80)}` : "",
    orderRequest.notes ? `Notes: ${truncateText(orderRequest.notes, 220)}` : "",
    `Track link: ${trackUrl}`
  ];

  return lines.filter(Boolean).join("\n");
}

export function isTelegramNotificationConfigured(env) {
  return Boolean(String(env?.TELEGRAM_BOT_TOKEN || "").trim() && String(env?.TELEGRAM_CHAT_ID || "").trim());
}

export async function sendOwnerInquiryTelegram(env, orderRequest) {
  if (!isTelegramNotificationConfigured(env) || !orderRequest?.id) {
    return { ok: false, skipped: true };
  }

  const token = String(env.TELEGRAM_BOT_TOKEN).trim();
  const chatId = String(env.TELEGRAM_CHAT_ID).trim();
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: buildTelegramMessage(env, orderRequest),
      disable_web_page_preview: true
    })
  });

  if (!response.ok) {
    throw new Error(`Telegram notification failed with status ${response.status}`);
  }

  return { ok: true };
}
