import { normalizePathname, parseRequestUrl } from "../utils/http.js";
import { captureMonitoringMessage } from "./sentry-service.js";

function truncateText(value, maxLength = 240) {
  const text = String(value ?? "").trim();

  if (!text) {
    return "";
  }

  return text.length > maxLength
    ? `${text.slice(0, Math.max(0, maxLength - 1))}…`
    : text;
}

function maskPhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  return `***${digits.slice(-4)}`;
}

function maskEmail(value) {
  const email = String(value ?? "").trim();

  if (!email.includes("@")) {
    return email ? "***" : null;
  }

  const [localPart, domain] = email.split("@");
  return `${localPart.slice(0, 1) || "*"}***@${domain}`;
}

function maskIp(value) {
  const input = String(value ?? "").trim();

  if (!input) {
    return null;
  }

  if (input.includes(":")) {
    const parts = input.split(":").filter(Boolean);
    return parts.length ? `***:${parts[parts.length - 1]}` : "***";
  }

  const parts = input.split(".");
  return parts.length === 4 ? `***.***.***.${parts[3]}` : "***";
}

function getClientIp(request) {
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return "";
}

function createWebhookBody(url, payload) {
  const message = [
    `[${payload.level.toUpperCase()}] ${payload.event}`,
    payload.message || "",
    payload.request?.pathname ? `Path: ${payload.request.pathname}` : "",
    payload.request?.method ? `Method: ${payload.request.method}` : "",
    payload.request?.clientIpMasked ? `Client: ${payload.request.clientIpMasked}` : "",
    payload.request?.cfRay ? `Ray: ${payload.request.cfRay}` : "",
    payload.inquiry?.productId ? `Product: ${payload.inquiry.productId}` : "",
    payload.inquiry?.eventDate ? `Event date: ${payload.inquiry.eventDate}` : "",
    payload.error?.message ? `Error: ${payload.error.message}` : ""
  ].filter(Boolean).join("\n");

  if (/discord(?:app)?\.com\/api\/webhooks/i.test(url)) {
    return {
      headers: {
        "content-type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({ content: message })
    };
  }

  if (/hooks\.slack\.com/i.test(url)) {
    return {
      headers: {
        "content-type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({ text: message })
    };
  }

  return {
    headers: {
      "content-type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(payload)
  };
}

export function createRequestMonitoringContext(request) {
  const url = parseRequestUrl(request.url);

  return {
    method: request.method.toUpperCase(),
    pathname: normalizePathname(url.pathname),
    clientIpMasked: maskIp(getClientIp(request)),
    userAgent: truncateText(request.headers.get("user-agent"), 140),
    cfRay: request.headers.get("cf-ray") || null,
    colo: request.cf?.colo || null
  };
}

export function createInquiryMonitoringContext(input = {}) {
  return {
    customerNamePresent: Boolean(String(input.customerName || "").trim()),
    customerPhoneMasked: maskPhone(input.customerPhone),
    customerEmailMasked: maskEmail(input.customerEmail),
    productId: truncateText(input.productId, 80) || null,
    fulfillmentType: truncateText(input.fulfillmentType, 40) || null,
    eventDate: truncateText(input.eventDate, 40) || null,
    sizeLabel: truncateText(input.sizeLabel, 80) || null,
    addOn: truncateText(input.addOn, 80) || null,
    notesLength: String(input.notes || "").trim().length
  };
}

export function reportMonitoringEvent(env, payload, executionCtx) {
  const eventPayload = {
    timestamp: new Date().toISOString(),
    service: "pink-delight-cakes-api",
    environment: env?.MONITORING_ENVIRONMENT || "production",
    ...payload
  };

  const logLine = JSON.stringify(eventPayload);

  if (eventPayload.level === "error") {
    console.error(logLine);
  } else {
    console.warn(logLine);
  }

  if (eventPayload.level === "error" && eventPayload.event !== "worker.unhandled_exception") {
    captureMonitoringMessage(env, eventPayload, executionCtx);
  }

  const webhookUrl = String(env?.MONITORING_WEBHOOK_URL || "").trim();

  if (!webhookUrl || (eventPayload.level !== "error" && !eventPayload.forceAlert)) {
    return;
  }

  const webhookRequest = createWebhookBody(webhookUrl, eventPayload);
  const promise = fetch(webhookUrl, {
    method: "POST",
    headers: webhookRequest.headers,
    body: webhookRequest.body
  }).catch((error) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      service: "pink-delight-cakes-api",
      environment: env?.MONITORING_ENVIRONMENT || "production",
      level: "error",
      event: "monitoring.webhook_failed",
      error: {
        message: error instanceof Error ? error.message : String(error)
      }
    }));
  });

  if (executionCtx?.waitUntil) {
    executionCtx.waitUntil(promise);
    return;
  }

  promise.catch(() => {});
}
