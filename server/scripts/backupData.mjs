import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");
const BACKUP_ROOT = path.resolve(__dirname, "../backups");
const KEEP_DAYS = 14;

// Scrape-pipeline artifacts (still file-based — see scripts/mergeProducts.mjs
// etc.), kept alongside the DB dump for easy inspection without a DB client.
const FILES_TO_BACKUP = ["products.json", "products-local.json", "products-sets.json", "products-official-extra.json", "prices.json"];

function backupDatabase(destDir) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log("DATABASE_URL not set — skipping database dump.");
    return;
  }
  const dumpFile = path.join(destDir, "nspclub.sql");
  execFileSync("pg_dump", [databaseUrl, "-f", dumpFile]);
  console.log(`Database dumped to ${dumpFile}`);
}

function main() {
  const stamp = new Date().toISOString().slice(0, 10);
  const destDir = path.join(BACKUP_ROOT, stamp);
  fs.mkdirSync(destDir, { recursive: true });

  let copied = 0;
  for (const file of FILES_TO_BACKUP) {
    const src = path.join(DATA_DIR, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(destDir, file));
      copied++;
    }
  }
  console.log(`Backed up ${copied} files to ${destDir}`);

  backupDatabase(destDir);

  const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
  if (fs.existsSync(BACKUP_ROOT)) {
    for (const entry of fs.readdirSync(BACKUP_ROOT)) {
      const entryPath = path.join(BACKUP_ROOT, entry);
      const stat = fs.statSync(entryPath);
      if (stat.isDirectory() && stat.mtimeMs < cutoff) {
        fs.rmSync(entryPath, { recursive: true, force: true });
        console.log(`Removed old backup: ${entry}`);
      }
    }
  }
}

main();
