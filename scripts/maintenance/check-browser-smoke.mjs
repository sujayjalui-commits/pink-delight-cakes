const siteBaseUrl = String(process.env.SITE_BASE_URL || "").replace(/\/$/, "");

if (!siteBaseUrl) {
  throw new Error("SITE_BASE_URL is required.");
}

const adminBaseUrl = `${siteBaseUrl}/admin/`;
const trackingBaseUrl = `${siteBaseUrl}/track/`;
const siteOrigin = new URL(siteBaseUrl).origin;

function createHeaders(extraHeaders = {}) {
  return {
    "user-agent": "pink-delight-cakes-browser-smoke/1.0",
    ...extraHeaders
  };
}

async function fetchText(url, label, extraHeaders = {}) {
  const response = await fetch(url, {
    headers: createHeaders(extraHeaders)
  });

  if (!response.ok) {
    throw new Error(`${label} failed with status ${response.status}`);
  }

  return {
    response,
    text: await response.text()
  };
}

async function fetchJson(url, label, options = {}) {
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: createHeaders(options.headers || {})
  });

  if (options.expectedStatus !== undefined && response.status !== options.expectedStatus) {
    throw new Error(`${label} expected status ${options.expectedStatus}, received ${response.status}`);
  }

  let payload;

  try {
    payload = await response.json();
  } catch {
    throw new Error(`${label} did not return valid JSON`);
  }

  return {
    response,
    payload
  };
}

function assertTightCsp(response, label) {
  const csp = response.headers.get("content-security-policy") || "";

  if (!csp) {
    throw new Error(`${label} did not return a Content-Security-Policy header`);
  }

  if (csp.includes("'unsafe-inline'")) {
    throw new Error(`${label} CSP still allows unsafe-inline`);
  }
}

const storefront = await fetchText(siteBaseUrl, "Storefront page");

if (!storefront.text.includes("src/styles/storefront.css") || !storefront.text.includes("src/pages/storefront.js")) {
  throw new Error("Storefront page did not reference the extracted CSS/JS assets");
}

assertTightCsp(storefront.response, "Storefront page");

const tracking = await fetchText(trackingBaseUrl, "Tracking page");

if (!tracking.text.includes("../src/styles/tracking.css") || !tracking.text.includes("../src/pages/tracking.js")) {
  throw new Error("Tracking page did not reference the extracted CSS/JS assets");
}

assertTightCsp(tracking.response, "Tracking page");

const admin = await fetchText(adminBaseUrl, "Admin page");

if (!admin.text.includes('data-api-base="/api"')) {
  throw new Error("Admin page did not expose the same-origin /api base");
}

assertTightCsp(admin.response, "Admin page");

const adminSessionProbe = await fetchJson(`${siteOrigin}/api/admin/auth/session`, "Same-origin admin session probe", {
  expectedStatus: 401,
  headers: {
    Origin: siteOrigin
  }
});

if (adminSessionProbe.payload?.ok !== false || !String(adminSessionProbe.payload?.error || "").toLowerCase().includes("authentication")) {
  throw new Error("Same-origin admin session probe returned an unexpected payload");
}

console.log(JSON.stringify({
  ok: true,
  checkedAt: new Date().toISOString(),
  siteBaseUrl,
  adminBaseUrl,
  trackingBaseUrl,
  storefrontStatus: storefront.response.status,
  trackingStatus: tracking.response.status,
  adminStatus: admin.response.status,
  adminSessionProbeStatus: adminSessionProbe.response.status
}, null, 2));
