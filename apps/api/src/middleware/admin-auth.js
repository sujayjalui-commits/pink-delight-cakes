import { getAdminUserById, hasDatabase } from "../db/d1-client.js";
import { readAdminSessionFromRequest } from "../auth/sessions.js";
import { createJsonResponse } from "../utils/http.js";

export async function requireAdmin(request, env) {
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
