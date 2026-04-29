import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const sourceDir = path.join(repoRoot, "apps", "web");
const outputDir = path.join(repoRoot, ".deploy", "pages-site");

const requiredFiles = [
  "_headers",
  "index.html",
  path.join("menu", "index.html"),
  path.join("cart", "index.html"),
  path.join("inquiry-model", "index.html"),
  path.join("how-it-works", "index.html"),
  path.join("reviews", "index.html"),
  path.join("track", "index.html"),
  path.join("admin", "index.html"),
  "admin.html",
  path.join("src", "pages", "storefront.js"),
  path.join("src", "pages", "tracking.js"),
  path.join("src", "styles", "storefront.css"),
  path.join("src", "styles", "tracking.css"),
  "robots.txt",
  "sitemap.xml",
  "wrangler.toml"
];

const stampedFiles = [
  "_headers",
  "index.html",
  path.join("menu", "index.html"),
  path.join("cart", "index.html"),
  path.join("inquiry-model", "index.html"),
  path.join("how-it-works", "index.html"),
  path.join("reviews", "index.html"),
  path.join("track", "index.html"),
  path.join("admin", "index.html"),
  "admin.html",
  path.join("src", "pages", "storefront.js"),
  path.join("src", "pages", "tracking.js"),
  "robots.txt",
  "sitemap.xml"
];

const placeholderTokens = [
  "__PUBLIC_SITE_URL__",
  "__ADMIN_SITE_URL__",
  "__API_BASE_URL__"
];

function ensureExists(relativePath) {
  const targetPath = path.join(outputDir, relativePath);

  if (!fs.existsSync(targetPath)) {
    throw new Error(`Missing expected Pages output: ${relativePath}`);
  }

  return targetPath;
}

function readOutputFile(relativePath) {
  return fs.readFileSync(ensureExists(relativePath), "utf8");
}

function assertContains(contents, needle, label) {
  if (!contents.includes(needle)) {
    throw new Error(`${label} is missing expected content: ${needle}`);
  }
}

function assertNotContains(contents, needle, label) {
  if (contents.includes(needle)) {
    throw new Error(`${label} still contains unexpected content: ${needle}`);
  }
}

function collectUnexpectedOutputPaths(sourceRoot, outputRoot, relativePath = "") {
  const currentOutputPath = path.join(outputRoot, relativePath);
  const currentSourcePath = path.join(sourceRoot, relativePath);
  const unexpectedPaths = [];

  for (const entry of fs.readdirSync(currentOutputPath, { withFileTypes: true })) {
    const entryRelativePath = path.join(relativePath, entry.name);
    const outputEntryPath = path.join(outputRoot, entryRelativePath);
    const sourceEntryPath = path.join(sourceRoot, entryRelativePath);

    if (entryRelativePath === ".wrangler" || entryRelativePath.startsWith(`.wrangler${path.sep}`)) {
      continue;
    }

    if (!fs.existsSync(sourceEntryPath)) {
      unexpectedPaths.push(entryRelativePath);
      continue;
    }

    if (entry.isDirectory()) {
      unexpectedPaths.push(...collectUnexpectedOutputPaths(sourceRoot, outputRoot, entryRelativePath));
    }
  }

  return unexpectedPaths;
}

if (!fs.existsSync(outputDir)) {
  throw new Error("Prepared Pages output does not exist. Run `npm run deploy:prepare:pages` first.");
}

for (const relativePath of requiredFiles) {
  ensureExists(relativePath);
}

const unexpectedOutputPaths = collectUnexpectedOutputPaths(sourceDir, outputDir);

if (unexpectedOutputPaths.length) {
  throw new Error(`Unexpected stale Pages output still exists: ${unexpectedOutputPaths.join(", ")}`);
}

for (const relativePath of stampedFiles) {
  const contents = readOutputFile(relativePath);

  for (const token of placeholderTokens) {
    assertNotContains(contents, token, relativePath);
  }
}

const storefrontHtml = readOutputFile("index.html");
assertContains(storefrontHtml, 'data-api-base="https://', "index.html");
assertContains(storefrontHtml, "<h1>Pink Delight</h1>", "index.html");

const menuHtml = readOutputFile(path.join("menu", "index.html"));
assertContains(menuHtml, 'id="menuGrid"', "menu/index.html");
assertNotContains(menuHtml, 'id="signatureGrid"', "menu/index.html");

const cartHtml = readOutputFile(path.join("cart", "index.html"));
assertContains(cartHtml, 'id="cartInquiryForm"', "cart/index.html");
assertContains(cartHtml, 'id="cartTrackReferenceLink"', "cart/index.html");
assertContains(cartHtml, 'href="https://', "cart/index.html");

const inquiryHtml = readOutputFile(path.join("inquiry-model", "index.html"));
assertContains(inquiryHtml, "Your inquiry summary", "inquiry-model/index.html");
assertContains(inquiryHtml, 'data-api-base="https://', "inquiry-model/index.html");

const reviewsHtml = readOutputFile(path.join("reviews", "index.html"));
assertContains(reviewsHtml, 'id="reviewGrid"', "reviews/index.html");

const howItWorksHtml = readOutputFile(path.join("how-it-works", "index.html"));
assertContains(howItWorksHtml, 'id="process"', "how-it-works/index.html");

const trackingHtml = readOutputFile(path.join("track", "index.html"));
assertContains(trackingHtml, "../src/styles/tracking.css", "track/index.html");
assertContains(trackingHtml, "../src/pages/tracking.js", "track/index.html");
assertContains(trackingHtml, 'data-api-base="https://', "track/index.html");

const adminHtml = readOutputFile(path.join("admin", "index.html"));
assertContains(adminHtml, 'data-api-base="/api"', "admin/index.html");
assertContains(adminHtml, "../src/pages/admin/dashboard.js", "admin/index.html");

const headersFile = readOutputFile("_headers");
assertContains(headersFile, "connect-src 'self' https://", "_headers");

const sitemapXml = readOutputFile("sitemap.xml");
assertContains(sitemapXml, "<loc>", "sitemap.xml");
assertContains(sitemapXml, "/menu/</loc>", "sitemap.xml");
assertContains(sitemapXml, "/cart/</loc>", "sitemap.xml");
assertContains(sitemapXml, "/inquiry-model/</loc>", "sitemap.xml");
assertContains(sitemapXml, "/how-it-works/</loc>", "sitemap.xml");
assertContains(sitemapXml, "/reviews/</loc>", "sitemap.xml");
assertNotContains(sitemapXml, "/about/</loc>", "sitemap.xml");

const robotsTxt = readOutputFile("robots.txt");
assertContains(robotsTxt, "Sitemap:", "robots.txt");
assertNotContains(robotsTxt, "__PUBLIC_SITE_URL__", "robots.txt");

const wranglerConfig = readOutputFile("wrangler.toml");
assertContains(wranglerConfig, 'API_PROXY_TARGET = "https://', "wrangler.toml");

console.log(JSON.stringify({
  ok: true,
  checkedAt: new Date().toISOString(),
  outputDir,
  requiredFileCount: requiredFiles.length,
  stampedFileCount: stampedFiles.length
}, null, 2));
