import { DataTypes } from "sequelize";
import sequelize from "../sequelize.js";

// Mirrors the shape the scrape/build pipeline (scripts/*.mjs) already
// produces in products.json — the DB is a second, queryable copy of that
// same data, kept in sync by scripts/syncProductsToDb.mjs at the end of
// every refresh, rather than a replacement for the scraping pipeline itself.
const Product = sequelize.define(
  "Product",
  {
    slug: { type: DataTypes.STRING, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    nameEn: { type: DataTypes.STRING, allowNull: true },
    article: { type: DataTypes.STRING, allowNull: true },
    category: { type: DataTypes.STRING, allowNull: true },
    tags: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    sections: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    highlights: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    images: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    componentNames: { type: DataTypes.JSONB, allowNull: true },
    priceRetailUsd: { type: DataTypes.FLOAT, allowNull: true },
    priceDiscountUsd: { type: DataTypes.FLOAT, allowNull: true },
  },
  {
    tableName: "products",
    timestamps: false,
  }
);

export default Product;
