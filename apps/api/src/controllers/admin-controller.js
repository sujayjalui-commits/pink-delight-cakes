import { apiConfig } from "../config/api-config.js";
import {
  requireAdmin,
  requireProtectedAdminMutationRequest,
  requireSameOriginAdminBrowserRequest
} from "../middleware/admin-auth.js";
import {
  createAdminAuthCookie,
  createClearedAdminAuthCookie,
  getAdminSessionView,
  loginAdminUser,
  setupAdminUserPassword
} from "../services/admin-auth-service.js";
import {
  createAdminProduct,
  getAdminProductDetail,
  getAdminProductsView,
  updateAdminProduct
} from "../services/admin-product-service.js";
import {
  getAdminOrderDetail,
  getAdminOrdersView,
  updateAdminOrder
} from "../services/admin-order-service.js";
import {
  getAdminBusinessSettingsView,
  updateAdminBusinessSettings
} from "../services/admin-settings-service.js";
import {
  getAdminTestimonialsView,
  replaceAdminTestimonials
} from "../services/testimonial-service.js";
import {
  createRateLimitHeaders,
  enforceAdminLoginRateLimit,
  enforceAdminSetupRateLimit
} from "../services/rate-limit-service.js";
import { createJsonResponse } from "../utils/http.js";
import { readJsonBody } from "../validators/request-body.js";
import { rotateAdminUserSessionVersion } from "../db/d1-client.js";

async function readRequiredJsonBody(request) {
  const body = await readJsonBody(request);

  if (!body) {
    return {
      ok: false,
      response: createJsonResponse({ ok: false, error: "Invalid JSON body" }, 400)
    };
  }

  return {
    ok: true,
    body
  };
}

export async function handleAdminSetup(request, env) {
  const sameOriginViolation = requireProtectedAdminMutationRequest(request);

  if (sameOriginViolation) {
    return sameOriginViolation;
  }

  const rateLimit = await enforceAdminSetupRateLimit(env, request);

  if (!rateLimit.ok) {
    return createJsonResponse(rateLimit, rateLimit.status || 429, createRateLimitHeaders(rateLimit));
  }

  const parsed = await readRequiredJsonBody(request);

  if (!parsed.ok) {
    return parsed.response;
  }

  const result = await setupAdminUserPassword(env, parsed.body);
  return createJsonResponse(result, result.ok ? 201 : result.status || 400);
}

export async function handleAdminLogin(request, env) {
  const sameOriginViolation = requireProtectedAdminMutationRequest(request);

  if (sameOriginViolation) {
    return sameOriginViolation;
  }

  const rateLimit = await enforceAdminLoginRateLimit(env, request);

  if (!rateLimit.ok) {
    return createJsonResponse(rateLimit, rateLimit.status || 429, createRateLimitHeaders(rateLimit));
  }

  const parsed = await readRequiredJsonBody(request);

  if (!parsed.ok) {
    return parsed.response;
  }

  const result = await loginAdminUser(env, parsed.body);

  if (!result.ok) {
    return createJsonResponse(result, result.status || 401);
  }

  return createJsonResponse(
    {
      ok: true,
      admin: result.admin,
      sessionTtlSeconds: apiConfig.adminSessionMaxAgeSeconds
    },
    200,
    {
      "Set-Cookie": createAdminAuthCookie(result.sessionToken, request.url)
    }
  );
}

export async function handleAdminLogout(request, env) {
  const sameOriginViolation = requireProtectedAdminMutationRequest(request);

  if (sameOriginViolation) {
    return sameOriginViolation;
  }

  const auth = await requireAdmin(request, env);

  if (auth.ok) {
    await rotateAdminUserSessionVersion(env, auth.admin.id);
  }

  return createJsonResponse(
    {
      ok: true,
      message: "Logged out"
    },
    200,
    {
      "Set-Cookie": createClearedAdminAuthCookie(request?.url)
    }
  );
}

export async function handleAdminSession(request, env) {
  const sameOriginViolation = requireSameOriginAdminBrowserRequest(request);

  if (sameOriginViolation) {
    return sameOriginViolation;
  }

  const auth = await requireAdmin(request, env);

  if (!auth.ok) {
    return auth.response;
  }

  return createJsonResponse({
    ok: true,
    session: getAdminSessionView(auth.admin),
    sessionTtlSeconds: apiConfig.adminSessionMaxAgeSeconds
  });
}

export async function handleGetAdminProducts(request, env) {
  const auth = await requireAdmin(request, env);

  if (!auth.ok) {
    return auth.response;
  }

  const products = await getAdminProductsView(env);
  return createJsonResponse({ ok: true, products });
}

export async function handleGetAdminProductById(request, env, productId) {
  const auth = await requireAdmin(request, env);

  if (!auth.ok) {
    return auth.response;
  }

  const product = await getAdminProductDetail(env, productId);

  if (!product) {
    return createJsonResponse({ ok: false, error: "Product not found" }, 404);
  }

  return createJsonResponse({ ok: true, product });
}

export async function handleCreateAdminProduct(request, env) {
  const mutationViolation = requireProtectedAdminMutationRequest(request);

  if (mutationViolation) {
    return mutationViolation;
  }

  const auth = await requireAdmin(request, env);

  if (!auth.ok) {
    return auth.response;
  }

  const parsed = await readRequiredJsonBody(request);

  if (!parsed.ok) {
    return parsed.response;
  }

  const result = await createAdminProduct(env, parsed.body);
  return createJsonResponse(result, result.ok ? 201 : result.status || 400);
}

export async function handleUpdateAdminProduct(request, env, productId) {
  const mutationViolation = requireProtectedAdminMutationRequest(request);

  if (mutationViolation) {
    return mutationViolation;
  }

  const auth = await requireAdmin(request, env);

  if (!auth.ok) {
    return auth.response;
  }

  const parsed = await readRequiredJsonBody(request);

  if (!parsed.ok) {
    return parsed.response;
  }

  const result = await updateAdminProduct(env, productId, parsed.body);
  return createJsonResponse(result, result.ok ? 200 : result.status || 400);
}

export async function handleGetAdminOrders(request, env) {
  const auth = await requireAdmin(request, env);

  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const orders = await getAdminOrdersView(env, { status });

  return createJsonResponse({ ok: true, orders });
}

export async function handleGetAdminOrderById(request, env, orderId) {
  const auth = await requireAdmin(request, env);

  if (!auth.ok) {
    return auth.response;
  }

  const order = await getAdminOrderDetail(env, orderId);

  if (!order) {
    return createJsonResponse({ ok: false, error: "Order not found" }, 404);
  }

  return createJsonResponse({ ok: true, order });
}

export async function handleUpdateAdminOrder(request, env, orderId) {
  const mutationViolation = requireProtectedAdminMutationRequest(request);

  if (mutationViolation) {
    return mutationViolation;
  }

  const auth = await requireAdmin(request, env);

  if (!auth.ok) {
    return auth.response;
  }

  const parsed = await readRequiredJsonBody(request);

  if (!parsed.ok) {
    return parsed.response;
  }

  const result = await updateAdminOrder(env, orderId, parsed.body);
  return createJsonResponse(result, result.ok ? 200 : result.status || 400);
}

export async function handleGetAdminSettings(request, env) {
  const auth = await requireAdmin(request, env);

  if (!auth.ok) {
    return auth.response;
  }

  const settings = await getAdminBusinessSettingsView(env);
  return createJsonResponse({ ok: true, settings });
}

export async function handleUpdateAdminSettings(request, env) {
  const mutationViolation = requireProtectedAdminMutationRequest(request);

  if (mutationViolation) {
    return mutationViolation;
  }

  const auth = await requireAdmin(request, env);

  if (!auth.ok) {
    return auth.response;
  }

  const parsed = await readRequiredJsonBody(request);

  if (!parsed.ok) {
    return parsed.response;
  }

  const result = await updateAdminBusinessSettings(env, parsed.body);
  return createJsonResponse(result, result.ok ? 200 : result.status || 400);
}

export async function handleGetAdminTestimonials(request, env) {
  const auth = await requireAdmin(request, env);

  if (!auth.ok) {
    return auth.response;
  }

  const testimonials = await getAdminTestimonialsView(env);
  return createJsonResponse({ ok: true, testimonials });
}

export async function handleUpdateAdminTestimonials(request, env) {
  const mutationViolation = requireProtectedAdminMutationRequest(request);

  if (mutationViolation) {
    return mutationViolation;
  }

  const auth = await requireAdmin(request, env);

  if (!auth.ok) {
    return auth.response;
  }

  const parsed = await readRequiredJsonBody(request);

  if (!parsed.ok) {
    return parsed.response;
  }

  const result = await replaceAdminTestimonials(env, parsed.body.testimonials || []);
  return createJsonResponse(result, result.ok ? 200 : result.status || 400);
}
