import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import sequelize from "../src/db/sequelize.js";
import Product from "../src/db/models/Product.js";
import User from "../src/db/models/User.js";
import Order from "../src/db/models/Order.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");

// One-time move from the old file-based storage (products.json, orders.log,
// orders-processed.json) to Postgres. Safe to re-run: orders are upserted
// by the same synthetic id the admin panel already used for legacy rows
// (see the old orderId() helper), so re-running never duplicates them.
function orderId(o) {
  if (o.id) return o.id;
  return crypto.createHash("sha256").update(`${o.at}|${o.phone}|${o.name}`).digest("hex").slice(0, 16);
}

function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

async function main() {
  await sequelize.authenticate();
  await sequelize.sync(); // creates products/users/orders tables if missing

  const productsFile = path.join(DATA_DIR, "products.json");
  if (fs.existsSync(productsFile)) {
    const products = JSON.parse(fs.readFileSync(productsFile, "utf8"));
    for (const p of products) {
      await Product.upsert({
        slug: p.slug,
        name: p.name,
        nameEn: p.nameEn ?? null,
        article: p.article ?? null,
        category: p.category ?? null,
        tags: p.tags ?? [],
        sections: p.sections ?? {},
        highlights: p.highlights ?? [],
        images: p.images ?? [],
        componentNames: p.componentNames ?? null,
        priceRetailUsd: p.priceRetailUsd ?? null,
        priceDiscountUsd: p.priceDiscountUsd ?? null,
      });
    }
    console.log(`Migrated ${products.length} products.`);
  }

  const orders = readJsonl(path.join(DATA_DIR, "orders.log"));
  let processedIds = new Set();
  try {
    processedIds = new Set(JSON.parse(fs.readFileSync(path.join(DATA_DIR, "orders-processed.json"), "utf8")));
  } catch {
    // no processed-state file yet — fine, nothing was marked processed
  }

  let migratedOrders = 0;
  for (const o of orders) {
    const id = orderId(o);
    const exists = await Order.findByPk(id).catch(() => null);
    if (exists) continue;
    await Order.create({
      id,
      userId: null,
      name: o.name,
      phone: o.phone,
      comment: o.comment || "",
      items: o.items || [],
      processed: processedIds.has(id),
      createdAt: o.at ? new Date(o.at) : new Date(),
    });
    migratedOrders++;
  }
  console.log(`Migrated ${migratedOrders} orders (${orders.length - migratedOrders} already present).`);

  console.log("Users table created empty — no accounts existed before this migration.");
  void User;

  await sequelize.close();
}

main().catch((err) => {
  console.error("migrateToPostgres failed:", err);
  process.exit(1);
});
