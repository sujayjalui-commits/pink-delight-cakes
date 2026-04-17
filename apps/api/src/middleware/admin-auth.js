import { getAdminUserById, hasDatabase } from "../db/d1-client.js";
import { readAdminSessionFromRequest } from "../auth/sessions.js";
import { createJsonResponse, getRequestOrigin, parseRequestUrl } from "../utils/http.js";

export function requireSameOriginAdminBrowserRequest(request) {
  const requestOrigin = getRequestOrigin(request);

  if (!requestOrigin) {
    return null;
  }

  if (requestOrigin === parseRequestUrl(request.url).origin) {
    return null;
  }

  return createJsonResponse(
    {
      ok: false,
      error: "Admin browser requests must use the same-origin /api proxy."
    },
    400
  );
}

export async function requireAdmin(request, env) {
  const sameOriginViolation = requireSameOriginAdminBrowserRequest(request);

  if (sameOriginViolation) {
    return {
      ok: false,
      response: sameOriginViolation
    };
  }

  if (!hasDatabase(env)) {
    return {
      ok: false,
      response: createJsonResponse({ ok: false, error: "Database is not configured" }, 503)
    };
  }

  const session = await readAdminSessionFromRequest(request, env);

  if (!session?.sub) {
    return {
      ok: false,
      response: createJsonResponse({ ok: false, error: "Authentication required" }, 401)
    };
  }

  const admin = await getAdminUserById(env, session.sub);

  if (!admin || !admin.is_active) {
    return {
      ok: false,
      response: createJsonResponse({ ok: false, error: "Admin account is unavailable" }, 401)
    };
  }

  return {
    ok: true,
    admin
  };
}
