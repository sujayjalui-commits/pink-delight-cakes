const apiBaseUrl = String(process.env.API_BASE_URL || "").replace(/\/$/, "");
const siteBaseUrl = String(process.env.SITE_BASE_URL || "").replace(/\/$/, "");

function normalizeAdminBaseUrl(value) {
  const trimmedValue = String(value || "").trim();

  if (!trimmedValue) {
    return "";
  }

  return trimmedValue.replace(/\/+$/, "") + "/";
}

const adminBaseUrl = normalizeAdminBaseUrl(process.env.ADMIN_BASE_URL) || (siteBaseUrl ? `${siteBaseUrl}/admin/` : "");

if (!apiBaseUrl) {
  throw new Error("API_BASE_URL is required.");
}

if (!adminBaseUrl) {
  throw new Error("ADMIN_BASE_URL is required, or provide SITE_BASE_URL so the script can derive it.");
}

function createRequestHeaders(extraHeaders = {}) {
  return {
    "user-agent": "pink-delight-cakes-admin-auth-check/1.0",
    ...extraHeaders
  };
}

function assertHeader(headers, name, expectedValue, label) {
  const actualValue = headers.get(name);

  if (actualValue !== expectedValue) {
    throw new Error(`${label} expected header ${name}=${expectedValue}, received ${actualValue || "null"}`);
  }
}

function getOrigin(value, label) {
  try {
    return new URL(value).origin;
  } catch {
    throw new Error(`${label} must be a valid absolute URL.`);
  }
}

function extractApiBaseFromMarkup(html) {
  const match = html.match(/data-api-base="([^"]+)"/i);
  return match?.[1] ? match[1].replace(/\/$/, "") : "";
}

function getHostnameFamily(urlValue) {
  const hostname = new URL(urlValue).hostname.toLowerCase();

  if (hostname.endsWith(".pages.dev")) {
    return "pages.dev";
  }

  if (hostname.endsWith(".workers.dev")) {
    return "workers.dev";
  }

  const labels = hostname.split(".").filter(Boolean);
  return labels.slice(-2).join(".");
}

function isLikelyCrossSiteCookiePair(adminUrl, apiUrl) {
  return getHostnameFamily(adminUrl) !== getHostnameFamily(apiUrl);
}

async function fetchText(url, label, headers = {}) {
  const response = await fetch(url, {
    headers: createRequestHeaders(headers)
  });

  if (!response.ok) {
    throw new Error(`${label} failed with status ${response.status}`);
  }

  return response.text();
}

async function fetchWithValidation(url, label, options = {}) {
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: createRequestHeaders(options.headers || {})
  });

  if (options.expectedStatus !== undefined && response.status !== options.expectedStatus) {
    throw new Error(`${label} expected status ${options.expectedStatus}, received ${response.status}`);
  }

  return response;
}

const adminOrigin = getOrigin(adminBaseUrl, "ADMIN_BASE_URL");
const apiOrigin = getOrigin(apiBaseUrl, "API_BASE_URL");
const warnings = [];

const adminHtml = await fetchText(adminBaseUrl, "Admin page");

if (!adminHtml.includes("Pink Delight Cakes Admin") || !adminHtml.includes("data-api-base")) {
  throw new Error("Admin page did not contain the expected markup");
}

const configuredApiBase = extractApiBaseFromMarkup(adminHtml);

if (!configuredApiBase) {
  throw new Error("Admin page did not expose data-api-base");
}

if (configuredApiBase !== apiBaseUrl) {
  throw new Error(`Admin page data-api-base (${configuredApiBase}) does not match API_BASE_URL (${apiBaseUrl})`);
}

const sessionPreflight = await fetchWithValidation(`${apiBaseUrl}/api/admin/auth/session`, "Admin session preflight", {
  method: "OPTIONS",
  expectedStatus: 204,
  headers: {
    Origin: adminOrigin,
    "Access-Control-Request-Method": "GET",
    "Access-Control-Request-Headers": "Content-Type, Authorization"
  }
});

assertHeader(sessionPreflight.headers, "access-control-allow-origin", adminOrigin, "Admin session preflight");
assertHeader(sessionPreflight.headers, "access-control-allow-credentials", "true", "Admin session preflight");

const allowedHeaders = String(sessionPreflight.headers.get("access-control-allow-headers") || "").toLowerCase();
if (!allowedHeaders.includes("content-type") || !allowedHeaders.includes("authorization")) {
  throw new Error("Admin session preflight did not allow both Content-Type and Authorization headers");
}

const sessionProbe = await fetchWithValidation(`${apiBaseUrl}/api/admin/auth/session`, "Admin session probe", {
  method: "GET",
  expectedStatus: 401,
  headers: {
    Origin: adminOrigin
  }
});

assertHeader(sessionProbe.headers, "access-control-allow-origin", adminOrigin, "Admin session probe");
assertHeader(sessionProbe.headers, "access-control-allow-credentials", "true", "Admin session probe");

const sessionProbePayload = await sessionProbe.json();

if (sessionProbePayload?.ok !== false || !String(sessionProbePayload?.error || "").toLowerCase().includes("authentication")) {
  throw new Error("Admin session probe returned an unexpected payload");
}

const loginPreflight = await fetchWithValidation(`${apiBaseUrl}/api/admin/auth/login`, "Admin login preflight", {
  method: "OPTIONS",
  expectedStatus: 204,
  headers: {
    Origin: adminOrigin,
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "Content-Type"
  }
});

assertHeader(loginPreflight.headers, "access-control-allow-origin", adminOrigin, "Admin login preflight");
assertHeader(loginPreflight.headers, "access-control-allow-credentials", "true", "Admin login preflight");

if (isLikelyCrossSiteCookiePair(adminBaseUrl, apiBaseUrl)) {
  warnings.push(
    "Admin and API origins are on different cookie families. Cookie-only auth may still fail in some browsers until both live under the same site, such as admin.yourdomain.com and api.yourdomain.com."
  );
}

console.log(JSON.stringify({
  ok: true,
  checkedAt: new Date().toISOString(),
  adminBaseUrl,
  adminOrigin,
  apiBaseUrl,
  apiOrigin,
  configuredApiBase,
  sessionProbeStatus: sessionProbe.status,
  warnings
}, null, 2));
