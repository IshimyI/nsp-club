import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localProducts = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../data/products-local.json"), "utf8")
);
const officialExtraPath = path.resolve(__dirname, "../data/products-official-extra.json");
const officialExtra = fs.existsSync(officialExtraPath)
  ? JSON.parse(fs.readFileSync(officialExtraPath, "utf8"))
  : [];
const setsPath = path.resolve(__dirname, "../data/products-sets.json");
const sets = fs.existsSync(setsPath) ? JSON.parse(fs.readFileSync(setsPath, "utf8")) : [];
const prices = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../data/prices.json"), "utf8")
);

const CARE_KEYWORDS = [
  "зубная паста",
  "антиперспирант",
  "дезодорант",
  "бальзам для губ",
  "масло чайного дерева",
  "гель «серебряный",
];

function deriveLocalCategory(name) {
  const lower = name.toLowerCase();
  if (CARE_KEYWORDS.some((kw) => lower.includes(kw))) return "Уход и гигиена";
  return "БАД";
}

const TAG_KEYWORDS = [
  ["Иммунитет", ["иммун"]],
  ["ЖКТ и пищеварение", ["пищевар", "желудк", "кишечник", "жкт", "фермент"]],
  ["Сердце и сосуды", ["сердечно-сосудист", "давлен", "сосуд", "сердц", "холестерин"]],
  ["Суставы и кости", ["сустав", "кост", "хрящ", "остео", "коллаген"]],
  ["Нервная система и сон", ["нервн", "сон", "стресс", "успокаива", "релакс"]],
  ["Для детей", ["детей", "детск", "заврики"]],
  ["Для женщин", ["женщин", "менструа", "климакс"]],
  ["Для мужчин", ["мужчин", "простат", "потенц"]],
  ["Похудение и метаболизм", ["похуден", "жиросжига", "метаболи", "снижен веса", "лишн вес"]],
  ["Печень и детокс", ["печен", "очищен", "токсин", "детокс"]],
];

function deriveTags(product) {
  if (product.category !== "БАД") return [];
  const haystack = [
    product.name,
    ...(product.highlights || []),
    ...Object.values(product.sections || {}),
  ]
    .join(" ")
    .toLowerCase();
  return TAG_KEYWORDS.filter(([, keywords]) =>
    keywords.some((kw) => haystack.includes(kw))
  ).map(([tag]) => tag);
}

const products = [
  ...localProducts.map((p) => ({ ...p, category: deriveLocalCategory(p.name) })),
  ...officialExtra,
  ...sets,
];

const merged = products.map((p) => {
  const priceInfo = prices[p.article];
  let priceRetailUsd = null;
  let priceDiscountUsd = null;
  if (priceInfo) {
    for (const [label, info] of Object.entries(priceInfo.prices)) {
      if (/розничная/i.test(label)) priceRetailUsd = info.value;
      if (/диск/i.test(label)) priceDiscountUsd = info.value;
    }
  }
  return {
    slug: p.slug,
    name: p.name,
    nameEn: p.nameEn,
    article: p.article,
    category: p.category,
    tags: deriveTags(p),
    highlights: p.highlights,
    sections: p.sections,
    images: p.images,
    priceRetailUsd,
    priceDiscountUsd,
  };
});

const outFile = path.resolve(__dirname, "../data/products.json");
fs.writeFileSync(outFile, JSON.stringify(merged, null, 2), "utf8");
console.log(`Merged ${merged.length} products -> ${outFile}`);
console.log(`With price: ${merged.filter((p) => p.priceRetailUsd).length}`);
