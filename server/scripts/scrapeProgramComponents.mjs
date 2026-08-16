import * as cheerio from "cheerio";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = "https://naturessunshine.ru";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

const PROGRAM_PATHS = [
  "active-longevity-with-nsp", "anti-stress", "antiparasitic", "bone-health",
  "clear-head", "connective-tissue-health", "detoxification", "eye-health",
  "fitness", "gastrointestinal-health-as-a-foundation", "healthy-child",
  "healthy-heart", "joint-health", "liver-wellness", "plan-success",
  "rehabilitation-after-covid-19", "respiratory-health", "skin-hair-nails",
  "stop-allergies", "stop-puffiness", "stop-smoking", "strong-immune-system",
  "vascular-care", "weight-correction", "wellness-with-nsp-all-year-round",
];

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function main() {
  const results = [];
  for (const slug of PROGRAM_PATHS) {
    const url = `${BASE}/catalog/programs/${slug}/`;
    try {
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);
      const title = $("h1").first().text().trim();
      const products = [];
      $('a[href^="/catalog/bad/"], a[href^="/catalog/bremani-care/"]').each((_, el) => {
        const href = $(el).attr("href");
        const name = $(el).text().trim().replace(/\*$/, "");
        if (name && href.split("/").filter(Boolean).length === 3) {
          products.push({ name, officialSlug: href.split("/").filter(Boolean).pop() });
        }
      });
      console.log(`${title}: ${products.length} products`);
      results.push({ programSlug: slug, title, products });
    } catch (err) {
      console.log(`FAIL ${slug}: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  const outFile = path.resolve(__dirname, "../data/program-components.json");
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2), "utf8");
  console.log(`Saved -> ${outFile}`);
}

main();
