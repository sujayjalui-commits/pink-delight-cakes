import { apiConfig } from "../config/api-config.js";
import { getCookieValue } from "../utils/http.js";

function bytesToBase64Url(bytes) {
  let binary = "";

  for (const value of bytes) {
    binary += String.fromCharCode(value);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function secureCompare(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  let result = 0;

  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
}

async function importSigningKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function signPayload(payloadText, secret) {
  const key = await importSigningKey(secret);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadText));
  return bytesToBase64Url(new Uint8Array(signatureBuffer));
}

export async function createAdminSessionToken(admin, env) {
  if (!env.ADMIN_SESSION_SECRET) {
    throw new Error("ADMIN_SESSION_SECRET is not configured");
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: admin.id,
    email: admin.email,
    role: admin.role,
    iat: now,
    exp: now + apiConfig.adminSessionMaxAgeSeconds
  };

  const payloadText = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await signPayload(payloadText, env.ADMIN_SESSION_SECRET);

  return `${payloadText}.${signature}`;
}

export async function verifyAdminSessionToken(token, env) {
  if (!env.ADMIN_SESSION_SECRET || !token || !token.includes(".")) {
    return null;
  }

  const [payloadText, signature] = token.split(".");
  const expectedSignature = await signPayload(payloadText, env.ADMIN_SESSION_SECRET);

  if (!secureCompare(signature, expectedSignature)) {
    return null;
  }

  const payloadJson = new TextDecoder().decode(base64UrlToBytes(payloadText));
  const payload = JSON.parse(payloadJson);
  const now = Math.floor(Date.now() / 1000);

  if (!payload.exp || payload.exp < now) {
    return null;
  }

  return payload;
}

export async function readAdminSessionFromRequest(request, env) {
  const cookieToken = getCookieValue(request, apiConfig.adminSessionCookieName);
  const cookieSession = await verifyAdminSessionToken(cookieToken, env);

  if (cookieSession) {
    return cookieSession;
  }

  const authorizationHeader = request.headers.get("authorization") || "";
  const bearerToken = authorizationHeader.startsWith("Bearer ") ? authorizationHeader.slice("Bearer ".length).trim() : "";
  return verifyAdminSessionToken(bearerToken, env);
}
