import { getPublicCatalog, getPublicCatalogItem, getPublicSettingsView } from "../services/catalog-service.js";
import {
  createInquiryMonitoringContext,
  createRequestMonitoringContext,
  reportMonitoringEvent
} from "../services/monitoring-service.js";
import { createPublicOrderRequest, lookupPublicOrderRequest } from "../services/order-service.js";
import { createRateLimitHeaders, enforcePublicOrderRateLimit } from "../services/rate-limit-service.js";
import { createJsonResponse } from "../utils/http.js";
import { readJsonBody } from "../validators/request-body.js";

export async function handleGetProducts(env) {
  const products = await getPublicCatalog(env);
  return createJsonResponse({ ok: true, products });
}

export async function handleGetProductBySlug(env, slug) {
  const product = await getPublicCatalogItem(env, slug);

  if (!product) {
    return createJsonResponse({ ok: false, error: "Product not found" }, 404);
  }

  return createJsonResponse({ ok: true, product });
}

export async function handleGetSettings(env) {
  const settings = await getPublicSettingsView(env);
  return createJsonResponse({ ok: true, settings });
}

export async function handleLookupOrderRequest(request, env) {
  const url = new URL(request.url);
  const referenceId = url.searchParams.get("referenceId");
  const phone = url.searchParams.get("phone");
  const result = await lookupPublicOrderRequest(env, referenceId, phone);
  return createJsonResponse(result, result.ok ? 200 : result.status || 400);
}

export async function handleCreateOrderRequest(request, env, executionCtx) {
  const rateLimit = await enforcePublicOrderRateLimit(env, request);

  if (!rateLimit.ok) {
    reportMonitoringEvent(env, {
      level: "warn",
      event: "order_request.rate_limited",
      message: "Public inquiry request was rate limited.",
      request: createRequestMonitoringContext(request),
      details: {
        retryAfterSeconds: rateLimit.retryAfterSeconds || null
      }
    }, executionCtx);

    return createJsonResponse(rateLimit, rateLimit.status || 429, createRateLimitHeaders(rateLimit));
  }

  const body = await readJsonBody(request);

  if (!body) {
    reportMonitoringEvent(env, {
      level: "warn",
      event: "order_request.invalid_json",
      message: "Public inquiry request was rejected because the JSON body was invalid.",
      request: createRequestMonitoringContext(request)
    }, executionCtx);

    return createJsonResponse({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const result = await createPublicOrderRequest(env, body);

  if (!result.ok) {
    const status = result.status || 400;

    reportMonitoringEvent(env, {
      level: status >= 500 ? "error" : "warn",
      event: "order_request.failed",
      message: result.error || "Public inquiry request failed.",
      request: createRequestMonitoringContext(request),
      inquiry: createInquiryMonitoringContext(body),
      details: Array.isArray(result.details) ? result.details : undefined,
      forceAlert: status >= 500
    }, executionCtx);

    return createJsonResponse(result, result.status || 400);
  }

  return createJsonResponse(result, 201);
}
