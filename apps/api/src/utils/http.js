const jsonHeaders = {
  "content-type": "application/json; charset=utf-8"
};

const securityHeaders = {
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY"
};

export function createJsonResponse(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      ...jsonHeaders,
      ...securityHeaders,
      ...extraHeaders
    }
  });
}

export function createNotFoundResponse(pathname) {
  return createJsonResponse(
    {
      ok: false,
      error: "Route not found",
      pathname
    },
    404
  );
}

export function parseRequestUrl(input) {
  return new URL(input);
}

export function normalizePathname(pathname) {
  try {
    return decodeURIComponent(pathname).replace(/[\u0000-\u001f\u007f\s]+$/g, "");
  } catch {
    return pathname.replace(/(?:%0a|%0d)+$/gi, "").replace(/[\u0000-\u001f\u007f\s]+$/g, "");
  }
}

function normalizeOrigin(origin) {
  return origin ? origin.replace(/\/$/, "") : "";
}

function normalizeConfiguredOriginValue(value) {
  const trimmedValue = String(value || "").trim();

  if (!trimmedValue) {
    return "";
  }

  try {
    return normalizeOrigin(new URL(trimmedValue).origin);
  } catch {
    return normalizeOrigin(trimmedValue);
  }
}

function getAllowedOrigins(env) {
  const configuredOrigins = String(env?.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => normalizeConfiguredOriginValue(origin))
    .filter(Boolean);

  return Array.from(new Set([
    normalizeConfiguredOriginValue(env?.SITE_URL),
    normalizeConfiguredOriginValue(env?.ADMIN_URL),
    ...configuredOrigins
  ].filter(Boolean)));
}

export function getRequestOrigin(request) {
  return normalizeOrigin(request.headers.get("origin"));
}

export function isAllowedOrigin(request, env) {
  const requestOrigin = getRequestOrigin(request);

  if (!requestOrigin) {
    return false;
  }

  const apiOrigin = normalizeOrigin(parseRequestUrl(request.url).origin);

  if (requestOrigin === apiOrigin) {
    return true;
  }

  return getAllowedOrigins(env).includes(requestOrigin);
}

export function createCorsHeaders(request, env) {
  const requestOrigin = getRequestOrigin(request);

  if (!requestOrigin || !isAllowedOrigin(request, env)) {
    return {
      Vary: "Origin"
    };
  }

  return {
    "Access-Control-Allow-Origin": requestOrigin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}

export function withCors(response, request, env) {
  const headers = new Headers(response.headers);
  const corsHeaders = createCorsHeaders(request, env);

  Object.entries(securityHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export function createPreflightResponse(request, env) {
  if (!getRequestOrigin(request)) {
    return new Response(null, { status: 204 });
  }

  if (!isAllowedOrigin(request, env)) {
    return createJsonResponse(
      {
        ok: false,
        error: "Origin is not allowed"
      },
      403,
      {
        Vary: "Origin"
      }
    );
  }

  return new Response(null, {
    status: 204,
    headers: {
      ...securityHeaders,
      ...createCorsHeaders(request, env)
    }
  });
}

export function createCookie(name, value, options = {}) {
  const parts = [`${name}=${value}`];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }

  if (options.httpOnly !== false) {
    parts.push("HttpOnly");
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }

  if (options.secure !== false) {
    parts.push("Secure");
  }

  parts.push(`Path=${options.path || "/"}`);

  return parts.join("; ");
}

export function getCookieValue(request, name) {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  const pairs = cookieHeader.split(";").map((value) => value.trim());

  for (const pair of pairs) {
    if (pair.startsWith(`${name}=`)) {
      return pair.slice(name.length + 1);
    }
  }

  return null;
}
