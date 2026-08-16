import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sequelize from "../src/db/sequelize.js";
import Product from "../src/db/models/Product.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PRODUCTS_FILE = path.resolve(__dirname, "../data/products.json");

// Runs at the end of the weekly refresh pipeline: the scrape/build scripts
// still produce products.json exactly as before, this just makes Postgres
// match it — upserting current rows and deleting slugs no longer present.
async function main() {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf8"));
  await sequelize.authenticate();
  await Product.sync();

  const seenSlugs = products.map((p) => p.slug);
  await sequelize.transaction(async (t) => {
    for (const p of products) {
      await Product.upsert(
        {
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
        },
        { transaction: t }
      );
    }
    const { Op } = await import("sequelize");
    await Product.destroy({ where: { slug: { [Op.notIn]: seenSlugs } }, transaction: t });
  });

  console.log(`Synced ${products.length} products to Postgres.`);
  await sequelize.close();
}

main().catch((err) => {
  console.error("syncProductsToDb failed:", err);
  process.exit(1);
});
