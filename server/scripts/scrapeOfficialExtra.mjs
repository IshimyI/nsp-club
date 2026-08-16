import * as cheerio from "cheerio";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_OUT_DIR = path.resolve(__dirname, "../data/images");
const OUT_FILE = path.resolve(__dirname, "../data/products-official-extra.json");

const BASE = "https://naturessunshine.ru";
const CATEGORY_LABELS = {
  "/catalog/bremani-care/": "Уход за кожей (Bremani Care)",
  "/catalog/for-home-and-family/": "Уход и гигиена",
};
const CATEGORY_PATHS = Object.keys(CATEGORY_LABELS);
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

const SECTION_HEADERS = [
  "Преимущества",
  "Активные ингредиенты",
  "Состав",
  "Применение",
  "Противопоказания",
];

function slugify(input) {
  const map = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return input
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function findProductLinks(categoryPath) {
  const html = await fetchHtml(`${BASE}${categoryPath}`);
  const $ = cheerio.load(html);
  const links = new Set();
  $(`a[href^="${categoryPath}"]`).each((_, el) => {
    const href = $(el).attr("href");
    if (href && href !== categoryPath && /\/$/.test(href)) links.add(href);
  });
  return [...links];
}

function textDirect($el) {
  return $el
    .contents()
    .filter((_, n) => n.type === "text")
    .text()
    .trim();
}

async function scrapeProduct(url, category) {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const el = $(".bx-catalog-element").first();
  const name = el.find(".bx-catalog-element__name").first().text().trim();
  if (!name) return null;
  const nameEn = el.find(".bx-catalog-element__name-en").first().text().trim() || null;
  const artText = el.find(".bx-catalog-element__artnumber").first().text().trim();
  const article = artText.replace(/Артикул:\s*/i, "").trim() || null;

  const highlights = [];
  el.find(".bx-catalog-element__detail")
    .first()
    .find("ul")
    .first()
    .find("li")
    .each((_, li) => {
      const t = $(li).text().trim();
      if (t && t !== "СГР") highlights.push(t);
    });

  const sections = {};
  let currentHeader = null;
  el.find("h2, p, ul").each((_, node) => {
    const tag = node.tagName;
    if (tag === "h2") {
      currentHeader = $(node).text().trim();
    } else if (currentHeader && SECTION_HEADERS.includes(currentHeader)) {
      const t = $(node).text().trim();
      if (t) {
        sections[currentHeader] = sections[currentHeader]
          ? `${sections[currentHeader]}\n${t}`
          : t;
      }
    }
  });

  const imgSrc = el.find(".bx-catalog-element__detail-img").first().attr("src");
  const images = [];
  if (imgSrc) {
    const slug = slugify(name);
    const ext = path.extname(imgSrc).split("?")[0] || ".jpg";
    const outName = `official-${slug}${ext}`;
    try {
      const res = await fetch(`${BASE}${imgSrc}`, { headers: { "User-Agent": UA } });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(path.join(IMAGES_OUT_DIR, outName), buf);
        images.push(outName);
      }
    } catch (err) {
      console.log(`  image fetch failed for ${name}: ${err.message}`);
    }
  }

  return {
    slug: slugify(name),
    name,
    nameEn,
    article,
    category,
    highlights,
    sections,
    images,
  };
}

async function main() {
  fs.mkdirSync(IMAGES_OUT_DIR, { recursive: true });
  const products = [];
  for (const categoryPath of CATEGORY_PATHS) {
    console.log(`Category ${categoryPath}`);
    const links = await findProductLinks(categoryPath);
    console.log(`  found ${links.length} product links`);
    for (const link of links) {
      try {
        const product = await scrapeProduct(`${BASE}${link}`, CATEGORY_LABELS[categoryPath]);
        if (product) {
          products.push(product);
          console.log(`  ok: ${product.article} ${product.name}`);
        }
      } catch (err) {
        console.log(`  FAIL ${link}: ${err.message}`);
      }
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  fs.writeFileSync(OUT_FILE, JSON.stringify(products, null, 2), "utf8");
  console.log(`Saved ${products.length} products -> ${OUT_FILE}`);
}

main();
