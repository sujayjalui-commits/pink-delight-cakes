const siteBaseUrl = String(process.env.SITE_BASE_URL || "").replace(/\/$/, "");

if (!siteBaseUrl) {
  throw new Error("SITE_BASE_URL is required.");
}

const adminBaseUrl = String(process.env.ADMIN_BASE_URL || `${siteBaseUrl}/admin/`).replace(/\/$/, "") + "/";
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

function assertPageIncludes(text, label, expectedSnippets) {
  for (const snippet of expectedSnippets) {
    if (!text.includes(snippet)) {
      throw new Error(`${label} did not include expected markup: ${snippet}`);
    }
  }
}

function assertPageExcludes(text, label, unexpectedSnippets) {
  for (const snippet of unexpectedSnippets) {
    if (text.includes(snippet)) {
      throw new Error(`${label} still included unexpected markup: ${snippet}`);
    }
  }
}

async function checkHtmlPage(definition) {
  const page = await fetchText(definition.url, definition.label);

  assertPageIncludes(page.text, definition.label, definition.includes || []);
  assertPageExcludes(page.text, definition.label, definition.excludes || []);
  assertTightCsp(page.response, definition.label);

  return page;
}

const pageChecks = [
  {
    label: "Storefront page",
    url: siteBaseUrl,
    includes: [
      "src/styles/storefront.css",
      "src/pages/storefront.js",
      'data-api-base="',
      "<h1>Pink Delight</h1>"
    ]
  },
  {
    label: "Menu page",
    url: `${siteBaseUrl}/menu/`,
    includes: [
      "/src/styles/storefront.css",
      "/src/pages/storefront.js",
      'id="menuGrid"'
    ],
    excludes: ['id="signatureGrid"']
  },
  {
    label: "Inquiry page",
    url: `${siteBaseUrl}/inquiry-model/`,
    includes: [
      "/src/styles/storefront.css",
      "/src/pages/storefront.js",
      "Your inquiry summary",
      'id="requestPreview"'
    ]
  },
  {
    label: "Inquiry bag page",
    url: `${siteBaseUrl}/cart/`,
    includes: [
      "/src/styles/storefront.css",
      "/src/pages/storefront.js",
      "Inquiry bag",
      'id="cartInquiryForm"'
    ]
  },
  {
    label: "How it works page",
    url: `${siteBaseUrl}/how-it-works/`,
    includes: [
      "/src/styles/storefront.css",
      "/src/pages/storefront.js",
      "How It Works",
      'id="process"'
    ]
  },
  {
    label: "Reviews page",
    url: `${siteBaseUrl}/reviews/`,
    includes: [
      "/src/styles/storefront.css",
      "/src/pages/storefront.js",
      "Customer reviews",
      'id="reviewGrid"'
    ]
  },
  {
    label: "Tracking page",
    url: trackingBaseUrl,
    includes: [
      "../src/styles/tracking.css",
      "../src/pages/tracking.js",
      "Check inquiry status",
      'id="trackForm"'
    ]
  },
  {
    label: "Admin page",
    url: adminBaseUrl,
    includes: [
      "../src/pages/admin/dashboard.css",
      "../src/pages/admin/dashboard.js",
      'data-api-base="/api"'
    ]
  }
];

const checkedPages = [];

for (const pageCheck of pageChecks) {
  const page = await checkHtmlPage(pageCheck);
  checkedPages.push({
    label: pageCheck.label,
    status: page.response.status,
    url: pageCheck.url
  });
}

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
  checkedPages,
  adminSessionProbeStatus: adminSessionProbe.response.status
}, null, 2));
