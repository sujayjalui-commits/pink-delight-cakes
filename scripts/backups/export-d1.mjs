import { mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import { spawn } from "node:child_process";

const databaseName = String(process.env.D1_DATABASE_NAME || "pink-delight-cakes").trim();
const outputDir = resolve(process.cwd(), process.env.D1_BACKUP_OUTPUT_DIR || "artifacts/d1-backups");
const timestamp = new Date().toISOString().replace(/[:]/g, "-");
const outputPath = join(outputDir, `${databaseName}-${timestamp}.sql`);
const command = process.platform === "win32" ? "cmd.exe" : "npx";
const args = process.platform === "win32"
  ? ["/d", "/s", "/c", "npx", "wrangler", "d1", "export", databaseName, "--remote", "--output", outputPath]
  : ["wrangler", "d1", "export", databaseName, "--remote", "--output", outputPath];

await mkdir(outputDir, { recursive: true });

await new Promise((resolvePromise, rejectPromise) => {
  const child = spawn(command, args, { stdio: "inherit" });

  child.on("error", rejectPromise);
  child.on("exit", (code) => {
    if (code === 0) {
      resolvePromise();
      return;
    }

    rejectPromise(new Error(`D1 export exited with code ${code}`));
  });
});

console.log(`D1 backup written to ${outputPath}`);
