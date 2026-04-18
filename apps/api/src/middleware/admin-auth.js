import { getAdminUserById, hasDatabase } from "../db/d1-client.js";
import { readAdminSessionFromRequest } from "../auth/sessions.js";
import { createJsonResponse, getRequestOrigin, parseRequestUrl } from "../utils/http.js";

function isMutatingMethod(request) {
  return ["POST", "PATCH", "PUT", "DELETE"].includes(request.method.toUpperCase());
}

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

export function requireProtectedAdminMutationRequest(request) {
  if (!isMutatingMethod(request)) {
    return null;
  }

  const sameOriginViolation = requireSameOriginAdminBrowserRequest(request);

  if (sameOriginViolation) {
    return sameOriginViolation;
  }

  const intentHeader = request.headers.get("x-admin-intent");

  if (intentHeader !== "mutate") {
    return createJsonResponse(
      {
        ok: false,
        error: "Admin write requests must come from the protected dashboard flow."
      },
      400
    );
  }

  const fetchSite = request.headers.get("sec-fetch-site");

  if (fetchSite && fetchSite !== "same-origin") {
    return createJsonResponse(
      {
        ok: false,
        error: "Cross-site admin write requests are not allowed."
      },
      400
    );
  }

  return null;
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

  const sessionVersion = Number(session.ver || 1);
  const adminSessionVersion = Number(admin.session_version || 1);

  if (sessionVersion !== adminSessionVersion) {
    return {
      ok: false,
      response: createJsonResponse({ ok: false, error: "Admin session is no longer active" }, 401)
    };
  }

  return {
    ok: true,
    admin
  };
}
