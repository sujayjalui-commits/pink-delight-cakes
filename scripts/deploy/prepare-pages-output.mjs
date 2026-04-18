import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const sourceDir = path.join(repoRoot, "apps", "web");
const outputDir = path.join(repoRoot, ".deploy", "pages-site");

function ensureTrailingSlash(value) {
  return value.replace(/\/+$/, "") + "/";
}

function normalizeBaseUrl(value, fallback) {
  const trimmedValue = String(value || "").trim() || fallback;
  return ensureTrailingSlash(trimmedValue);
}

function normalizeApiBaseUrl(value, fallback) {
  return String(value || "").trim().replace(/\/+$/, "") || fallback;
}

const siteBaseUrl = normalizeBaseUrl(
  process.env.SITE_BASE_URL,
  "https://pink-delight-cakes.pages.dev/"
);
const adminBaseUrl = normalizeBaseUrl(
  process.env.ADMIN_BASE_URL,
  new URL("admin/", siteBaseUrl).toString()
);
const apiBaseUrl = normalizeApiBaseUrl(
  process.env.API_BASE_URL,
  "https://pink-delight-cakes-api.sujayjalui.workers.dev"
);

const replacements = new Map([
  ["__PUBLIC_SITE_URL__", siteBaseUrl],
  ["__ADMIN_SITE_URL__", adminBaseUrl],
  ["__API_BASE_URL__", apiBaseUrl]
]);

const filesToStamp = [
  "_headers",
  "index.html",
  path.join("track", "index.html"),
  path.join("admin", "index.html"),
  "admin.html",
  "robots.txt",
  "sitemap.xml"
];

function replaceTokens(contents) {
  let nextContents = contents;

  for (const [token, value] of replacements.entries()) {
    nextContents = nextContents.split(token).join(value);
  }

  return nextContents;
}

fs.mkdirSync(path.dirname(outputDir), { recursive: true });
try {
  fs.rmSync(outputDir, { recursive: true, force: true });
} catch (error) {
  if (error?.code !== "EPERM") {
    throw error;
  }
}

fs.mkdirSync(outputDir, { recursive: true });
fs.cpSync(sourceDir, outputDir, { recursive: true });

for (const relativeFile of filesToStamp) {
  const targetFile = path.join(outputDir, relativeFile);
  const contents = fs.readFileSync(targetFile, "utf8");
  fs.writeFileSync(targetFile, replaceTokens(contents));
}

const wranglerConfigPath = path.join(outputDir, "wrangler.toml");
const wranglerConfig = fs.readFileSync(wranglerConfigPath, "utf8").replace(
  /^API_PROXY_TARGET = ".*"$/m,
  `API_PROXY_TARGET = "${apiBaseUrl}"`
);

fs.writeFileSync(wranglerConfigPath, wranglerConfig);

console.log(JSON.stringify({
  ok: true,
  outputDir,
  siteBaseUrl,
  adminBaseUrl,
  apiBaseUrl
}, null, 2));
