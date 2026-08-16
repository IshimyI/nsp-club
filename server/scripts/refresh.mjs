import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IS_DEPLOYED = process.env.NSP_CLUB_DEPLOYED === "1";

function run(script, args = []) {
  console.log(`\n=== ${script} ${args.join(" ")} ===`);
  execFileSync("node", [path.join(__dirname, script), ...args], { stdio: "inherit" });
}

run("scrapePrices.mjs");
run("buildSets.mjs");
run("buildSetImages.mjs");
run("mergeProducts.mjs");
run("syncProductsToDb.mjs");

const sitemapOut = IS_DEPLOYED
  ? path.resolve(__dirname, "../../client/sitemap.xml")
  : path.resolve(__dirname, "../../client/public/sitemap.xml");
run("generateSitemap.mjs", [sitemapOut]);

if (IS_DEPLOYED) {
  execFileSync("chown", ["www-data:www-data", sitemapOut], { stdio: "inherit" });
}

if (IS_DEPLOYED) {
  console.log("\n=== restarting nsp-club.service ===");
  execFileSync("systemctl", ["restart", "nsp-club.service"], { stdio: "inherit" });
  run("pingIndexNow.mjs");
}

console.log("\nRefresh complete.");
