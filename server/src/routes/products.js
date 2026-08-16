import express from "express";
import Product from "../db/models/Product.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const products = await Product.findAll();
  res.set("Cache-Control", "public, max-age=600");
  res.json(products);
});

router.get("/:slug", async (req, res) => {
  const product = await Product.findByPk(req.params.slug);
  if (!product) return res.status(404).json({ error: "Not found" });
  res.set("Cache-Control", "public, max-age=600");
  res.json(product);
});

export default router;
