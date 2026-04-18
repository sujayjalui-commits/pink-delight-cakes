import { validateAdminLoginInput, validateAdminSetupInput } from "../../../../packages/shared/schemas/admin-auth-schema.js";
import { apiConfig } from "../config/api-config.js";
import { createCookie } from "../utils/http.js";
import { hashAdminPassword, verifyAdminPassword } from "../auth/passwords.js";
import { createAdminSessionToken } from "../auth/sessions.js";
import {
  getAdminUserByEmail,
  rotateAdminUserSessionVersion,
  setAdminUserPasswordHash
} from "../db/d1-client.js";

function mapAdmin(admin) {
  return {
    id: admin.id,
    email: admin.email,
    role: admin.role
  };
}

export function getAdminSessionView(admin) {
  return mapAdmin(admin);
}

function shouldUseSecureCookies(requestUrl) {
  if (!requestUrl) {
    return true;
  }

  const url = new URL(requestUrl);
  return url.protocol === "https:";
}

export function createAdminAuthCookie(sessionToken, requestUrl) {
  return createCookie(apiConfig.adminSessionCookieName, sessionToken, {
    httpOnly: true,
    secure: shouldUseSecureCookies(requestUrl),
    sameSite: "Lax",
    path: "/",
    maxAge: apiConfig.adminSessionMaxAgeSeconds
  });
}

export function createClearedAdminAuthCookie(requestUrl) {
  return createCookie(apiConfig.adminSessionCookieName, "", {
    httpOnly: true,
    secure: shouldUseSecureCookies(requestUrl),
    sameSite: "Lax",
    path: "/",
    maxAge: 0
  });
}

export async function setupAdminUserPassword(env, input) {
  const validation = validateAdminSetupInput(input);

  if (!validation.valid) {
    return {
      ok: false,
      status: 400,
      error: "Validation failed",
      details: validation.errors
    };
  }

  if (!env.ADMIN_SETUP_KEY) {
    return {
      ok: false,
      status: 500,
      error: "ADMIN_SETUP_KEY is not configured"
    };
  }

  if (input.setupKey !== env.ADMIN_SETUP_KEY) {
    return {
      ok: false,
      status: 403,
      error: "Invalid setup key"
    };
  }

  const admin = await getAdminUserByEmail(env, input.email);

  if (!admin) {
    return {
      ok: false,
      status: 404,
      error: "Admin user not found"
    };
  }

  if (admin.password_hash) {
    return {
      ok: false,
      status: 409,
      error: "Admin password is already configured"
    };
  }

  const passwordHash = await hashAdminPassword(input.password);
  await setAdminUserPasswordHash(env, admin.id, passwordHash);

  return {
    ok: true,
    message: "Admin password configured successfully",
    admin: mapAdmin(admin)
  };
}

export async function loginAdminUser(env, input) {
  const validation = validateAdminLoginInput(input);

  if (!validation.valid) {
    return {
      ok: false,
      status: 400,
      error: "Validation failed",
      details: validation.errors
    };
  }

  const admin = await getAdminUserByEmail(env, input.email);

  if (!admin || !admin.password_hash || !admin.is_active) {
    return {
      ok: false,
      status: 401,
      error: "Invalid email or password"
    };
  }

  const passwordMatches = await verifyAdminPassword(input.password, admin.password_hash);

  if (!passwordMatches) {
    return {
      ok: false,
      status: 401,
      error: "Invalid email or password"
    };
  }

  const rotatedAdmin = await rotateAdminUserSessionVersion(env, admin.id);
  const sessionAdmin = rotatedAdmin || admin;
  const sessionToken = await createAdminSessionToken(sessionAdmin, env);

  return {
    ok: true,
    admin: mapAdmin(sessionAdmin),
    sessionToken
  };
}
