import * as cheerio from "cheerio";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.resolve(__dirname, "../data/images");
const LOCAL_PRODUCTS_FILE = path.resolve(__dirname, "../data/products-local.json");

const BASE = "https://naturessunshine.ru";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function buildArticleImageMap() {
  const map = new Map();
  for (let page = 1; page <= 5; page++) {
    const url = page === 1 ? `${BASE}/catalog/bad/` : `${BASE}/catalog/bad/?PAGEN_1=${page}`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    let count = 0;
    $(".catalog-list__item").each((_, el) => {
      const artText = $(el).find(".catalog-list__item--artnumber").text().trim();
      const article = artText.replace(/Артикул:\s*/i, "").trim();
      const img = $(el).find(".catalog-list__item--img").attr("src");
      if (article && img) {
        map.set(article, img);
        count++;
      }
    });
    console.log(`  page ${page}: ${count} items`);
    if (count === 0) break;
    await new Promise((r) => setTimeout(r, 300));
  }
  return map;
}

async function main() {
  const products = JSON.parse(fs.readFileSync(LOCAL_PRODUCTS_FILE, "utf8"));
  const missing = products.filter((p) => (p.photoCount ?? p.images.length) === 0);
  console.log(`${missing.length} local products have no real photo`);

  const articleImageMap = await buildArticleImageMap();

  let filled = 0;
  for (const product of missing) {
    const imgPath = articleImageMap.get(product.article);
    if (!imgPath) {
      console.log(`  no official image found for ${product.article} ${product.name}`);
      continue;
    }
    const ext = path.extname(imgPath).split("?")[0] || ".jpg";
    const outName = `official-${product.slug}${ext}`;
    try {
      const res = await fetch(`${BASE}${imgPath}`, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(path.join(IMAGES_DIR, outName), buf);
      // Prepend so the real photo leads the gallery; any certificate scans
      // already present stay as supplementary images after it.
      product.images = [outName, ...product.images];
      product.photoCount = 1;
      filled++;
      console.log(`  filled ${product.article} ${product.name} -> ${outName}`);
    } catch (err) {
      console.log(`  FAIL ${product.article}: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  fs.writeFileSync(LOCAL_PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf8");
  console.log(`Filled ${filled}/${missing.length} missing photos`);
}

main();
