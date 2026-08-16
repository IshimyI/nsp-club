import * as cheerio from "cheerio";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.resolve(__dirname, "../data/prices.json");

const BASE = "https://nspshop.pro";
const CATEGORY_PATHS = [
  "/catalog/bady_nsp/",
  "/catalog/kosmetika_nsp/",
  "/catalog/nabory_dobavok_nsp/",
  "/catalog/ukhod_i_gigiena/",
];
const MAX_PAGES = 12;

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function parseListingPage(html) {
  const $ = cheerio.load(html);
  const items = [];
  $(".article_block[data-value]").each((_, el) => {
    const article = $(el).attr("data-value")?.trim();
    if (!article) return;
    const card = $(el).closest(".item, .item_block, [data-id]");
    const name = card.find(".item-title a span").first().text().trim() || null;
    const prices = {};
    card.find(".price[data-currency]").each((__, priceEl) => {
      const value = $(priceEl).attr("data-value");
      const currency = $(priceEl).attr("data-currency");
      const groupLabel = $(priceEl)
        .closest(".price_group")
        .find(".price_name")
        .text()
        .trim();
      if (value) {
        prices[groupLabel || "unknown"] = { value: Number(value), currency };
      }
    });
    if (Object.keys(prices).length) {
      items.push({ article, name, prices });
    }
  });
  return items;
}

async function scrapeCategory(categoryPath) {
  const all = [];
  let prevArticles = null;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url =
      page === 1
        ? `${BASE}${categoryPath}`
        : `${BASE}${categoryPath}?PAGEN_1=${page}`;
    let html;
    try {
      html = await fetchHtml(url);
    } catch (err) {
      console.log(`  stop at page ${page}: ${err.message}`);
      break;
    }
    const items = parseListingPage(html);
    if (items.length === 0) {
      console.log(`  page ${page}: 0 items, stopping`);
      break;
    }
    const articles = items.map((i) => i.article).sort().join(",");
    if (articles === prevArticles) {
      console.log(`  page ${page}: same as previous page, stopping`);
      break;
    }
    prevArticles = articles;
    console.log(`  page ${page}: ${items.length} items`);
    all.push(...items);
    await new Promise((r) => setTimeout(r, 400));
  }
  return all;
}

async function main() {
  const byArticle = {};
  for (const categoryPath of CATEGORY_PATHS) {
    console.log(`Scraping ${categoryPath}`);
    const items = await scrapeCategory(categoryPath);
    for (const item of items) {
      byArticle[item.article] = item;
    }
  }
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(byArticle, null, 2), "utf8");
  console.log(`Saved ${Object.keys(byArticle).length} priced articles to ${OUT_FILE}`);
}

main();
