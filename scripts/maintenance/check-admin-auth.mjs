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

function getOrigin(value, label) {
  try {
    return new URL(value).origin;
  } catch {
    throw new Error(`${label} must be a valid absolute URL.`);
  }
}

function extractApiBaseFromMarkup(html) {
  const match = html.match(/data-api-base="([^"]+)"/i);
  return match?.[1] ? match[1].trim() : "";
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
const adminApiBaseUrl = `${adminOrigin}/api`;
const warnings = [];

const adminHtml = await fetchText(adminBaseUrl, "Admin page");

if (!adminHtml.includes("Pink Delight Cakes Admin") || !adminHtml.includes("data-api-base")) {
  throw new Error("Admin page did not contain the expected markup");
}

const configuredApiBase = extractApiBaseFromMarkup(adminHtml);

if (!configuredApiBase) {
  throw new Error("Admin page did not expose data-api-base");
}

if (configuredApiBase !== "/api") {
  throw new Error(`Admin page data-api-base should be /api, received ${configuredApiBase}`);
}

const sameOriginSessionProbe = await fetchWithValidation(`${adminApiBaseUrl}/admin/auth/session`, "Same-origin admin session probe", {
  method: "GET",
  expectedStatus: 401
});

const sameOriginProbePayload = await sameOriginSessionProbe.json();

if (sameOriginProbePayload?.ok !== false || !String(sameOriginProbePayload?.error || "").toLowerCase().includes("authentication")) {
  throw new Error("Same-origin admin session probe returned an unexpected payload");
}

const directWorkerProbe = await fetchWithValidation(`${apiBaseUrl}/api/admin/auth/session`, "Direct worker admin session probe", {
  method: "GET",
  expectedStatus: 400,
  headers: {
    Origin: adminOrigin
  }
});

const directWorkerPayload = await directWorkerProbe.json();

if (directWorkerPayload?.ok !== false || !String(directWorkerPayload?.error || "").toLowerCase().includes("same-origin")) {
  throw new Error("Direct worker admin session probe should be rejected in browser-style cross-origin mode");
}

console.log(JSON.stringify({
  ok: true,
  checkedAt: new Date().toISOString(),
  adminBaseUrl,
  adminOrigin,
  adminApiBaseUrl,
  apiBaseUrl,
  apiOrigin,
  configuredApiBase,
  sameOriginSessionProbeStatus: sameOriginSessionProbe.status,
  directWorkerProbeStatus: directWorkerProbe.status,
  warnings
}, null, 2));
