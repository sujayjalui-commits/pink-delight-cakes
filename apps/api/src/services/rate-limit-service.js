import { tables } from "../db/tables.js";

function getClientIp(request) {
  const forwarded = request.headers.get("cf-connecting-ip")
    || request.headers.get("x-forwarded-for")
    || "";

  return forwarded.split(",")[0].trim() || "unknown";
}

async function pruneExpiredEvents(env, bucket, windowSeconds) {
  const modifier = `-${windowSeconds} seconds`;

  await env.DB.prepare(
    `DELETE FROM ${tables.rateLimitEvents}
     WHERE bucket = ? AND created_at < datetime('now', ?)`
  )
    .bind(bucket, modifier)
    .run();
}

async function countRecentEvents(env, bucket, identifier, windowSeconds) {
  const modifier = `-${windowSeconds} seconds`;

  const result = await env.DB.prepare(
    `SELECT COUNT(*) AS count
     FROM ${tables.rateLimitEvents}
     WHERE bucket = ? AND identifier = ? AND created_at >= datetime('now', ?)`
  )
    .bind(bucket, identifier, modifier)
    .first();

  return Number(result?.count || 0);
}

async function recordEvent(env, bucket, identifier) {
  await env.DB.prepare(
    `INSERT INTO ${tables.rateLimitEvents} (bucket, identifier)
     VALUES (?, ?)`
  )
    .bind(bucket, identifier)
    .run();
}

async function enforceRateLimit(env, request, options) {
  if (!env?.DB) {
    return { ok: true };
  }

  const identifier = getClientIp(request);

  try {
    await pruneExpiredEvents(env, options.bucket, options.windowSeconds);

    const recentCount = await countRecentEvents(env, options.bucket, identifier, options.windowSeconds);

    if (recentCount >= options.limit) {
      return {
        ok: false,
        status: 429,
        error: options.error,
        retryAfterSeconds: options.windowSeconds
      };
    }

    await recordEvent(env, options.bucket, identifier);
    return { ok: true };
  } catch (error) {
    console.error("Rate limit enforcement failed", error);

    // Failing open avoids taking down core auth/order flows if the migration
    // has not been applied yet, but logging keeps the issue visible.
    return { ok: true };
  }
}

export function createRateLimitHeaders(result) {
  return result?.retryAfterSeconds
    ? { "Retry-After": String(result.retryAfterSeconds) }
    : {};
}

export function enforcePublicOrderRateLimit(env, request) {
  return enforceRateLimit(env, request, {
    bucket: "public_order_requests",
    limit: 6,
    windowSeconds: 60 * 60,
    error: "Too many inquiry requests from this connection. Please try again later."
  });
}

export function enforcePublicLookupRateLimit(env, request) {
  return enforceRateLimit(env, request, {
    bucket: "public_order_request_lookups",
    limit: 12,
    windowSeconds: 15 * 60,
    error: "Too many inquiry tracking attempts from this connection. Please wait before trying again."
  });
}

export function enforceAdminLoginRateLimit(env, request) {
  return enforceRateLimit(env, request, {
    bucket: "admin_login_attempts",
    limit: 10,
    windowSeconds: 15 * 60,
    error: "Too many admin login attempts. Please wait before trying again."
  });
}

export function enforceAdminSetupRateLimit(env, request) {
  return enforceRateLimit(env, request, {
    bucket: "admin_setup_attempts",
    limit: 5,
    windowSeconds: 60 * 60,
    error: "Too many admin setup attempts. Please wait before trying again."
  });
}
