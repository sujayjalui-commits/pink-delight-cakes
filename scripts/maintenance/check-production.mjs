const apiBaseUrl = String(process.env.API_BASE_URL || "").replace(/\/$/, "");
const siteBaseUrl = String(process.env.SITE_BASE_URL || "").replace(/\/$/, "");

if (!apiBaseUrl) {
  throw new Error("API_BASE_URL is required.");
}

if (!siteBaseUrl) {
  throw new Error("SITE_BASE_URL is required.");
}

async function fetchJson(url, label) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "pink-delight-cakes-production-check/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`${label} failed with status ${response.status}`);
  }

  let payload;

  try {
    payload = await response.json();
  } catch {
    throw new Error(`${label} did not return valid JSON`);
  }

  return payload;
}

async function fetchText(url, label) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "pink-delight-cakes-production-check/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`${label} failed with status ${response.status}`);
  }

  return response.text();
}

const health = await fetchJson(`${apiBaseUrl}/health`, "Health endpoint");

if (!health.ok) {
  throw new Error("Health endpoint returned ok=false");
}

if (!health.databaseBound) {
  throw new Error("Health endpoint reported databaseBound=false");
}

const products = await fetchJson(`${apiBaseUrl}/api/products`, "Public products endpoint");

if (!products.ok || !Array.isArray(products.products)) {
  throw new Error("Public products endpoint returned an unexpected payload");
}

const settings = await fetchJson(`${apiBaseUrl}/api/settings/public`, "Public settings endpoint");

if (!settings.ok || !settings.settings || !settings.settings.brandName) {
  throw new Error("Public settings endpoint returned an unexpected payload");
}

const storefrontHtml = await fetchText(siteBaseUrl, "Storefront page");

if (!storefrontHtml.includes("Pink Delight Cakes") || !storefrontHtml.includes("data-api-base")) {
  throw new Error("Storefront page did not contain the expected markup");
}

console.log(JSON.stringify({
  ok: true,
  checkedAt: new Date().toISOString(),
  apiBaseUrl,
  siteBaseUrl,
  productCount: products.products.length,
  brandName: settings.settings.brandName
}, null, 2));
