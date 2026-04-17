import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const sourceConfigPath = path.join(repoRoot, "wrangler.toml");
const deployConfigPath = path.join(repoRoot, "wrangler.deploy.toml");

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
const adminOrigin = adminBaseUrl.replace(/\/admin\/$/, "");
const corsAllowedOrigins = String(process.env.CORS_ALLOWED_ORIGINS || "").trim() || adminOrigin;

const replacements = [
  [/^SITE_URL = ".*"$/m, `SITE_URL = "${siteBaseUrl.replace(/\/$/, "")}"`],
  [/^ADMIN_URL = ".*"$/m, `ADMIN_URL = "${adminBaseUrl}"`],
  [/^API_BASE_URL = ".*"$/m, `API_BASE_URL = "${apiBaseUrl}"`],
  [/^CORS_ALLOWED_ORIGINS = ".*"$/m, `CORS_ALLOWED_ORIGINS = "${corsAllowedOrigins}"`]
];

let contents = fs.readFileSync(sourceConfigPath, "utf8");

for (const [pattern, replacement] of replacements) {
  contents = contents.replace(pattern, replacement);
}

fs.writeFileSync(deployConfigPath, contents);

console.log(JSON.stringify({
  ok: true,
  deployConfigPath,
  siteBaseUrl: siteBaseUrl.replace(/\/$/, ""),
  adminBaseUrl,
  apiBaseUrl,
  corsAllowedOrigins
}, null, 2));
