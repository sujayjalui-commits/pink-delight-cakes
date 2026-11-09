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

function replaceTokens(contents) {
  let nextContents = contents;

  for (const [token, value] of replacements.entries()) {
    nextContents = nextContents.split(token).join(value);
  }

  return nextContents;
}

function removeOutputEntry(targetPath) {
  const stats = fs.lstatSync(targetPath);

  if (stats.isDirectory() && !stats.isSymbolicLink()) {
    fs.rmSync(targetPath, { recursive: true, force: true });
    return;
  }

  fs.unlinkSync(targetPath);
}

function pruneStaleOutputEntries(sourcePath, outputPath) {
  if (!fs.existsSync(sourcePath) || !fs.existsSync(outputPath)) {
    return;
  }

  for (const entry of fs.readdirSync(outputPath, { withFileTypes: true })) {
    const sourceEntryPath = path.join(sourcePath, entry.name);
    const outputEntryPath = path.join(outputPath, entry.name);

    if (!fs.existsSync(sourceEntryPath)) {
      try {
        removeOutputEntry(outputEntryPath);
      } catch (error) {
        if (error?.code !== "EPERM") {
          throw error;
        }
      }
      continue;
    }

    if (entry.isDirectory() && fs.statSync(sourceEntryPath).isDirectory()) {
      pruneStaleOutputEntries(sourceEntryPath, outputEntryPath);
    }
  }
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
pruneStaleOutputEntries(sourceDir, outputDir);

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
