import "dotenv/config";

import "express-async-errors";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

import Product from "./db/models/Product.js";
import productsRouter from "./routes/products.js";
import authRouter from "./routes/auth.js";
import ordersRouter from "./routes/orders.js";
import adminRouter from "./routes/admin.js";
import { escapeHtml } from "./utils/html.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");

let rateCache = { rub: null, date: null, fetchedAt: 0 };
const RATE_TTL_MS = 24 * 60 * 60 * 1000;

async function getUsdRubRate() {
  if (rateCache.rub && Date.now() - rateCache.fetchedAt < RATE_TTL_MS) {
    return rateCache;
  }
  try {
    const res = await fetch("https://www.cbr.ru/scripts/XML_daily.asp");
    const buf = Buffer.from(await res.arrayBuffer());

    const xml = buf.toString("latin1");
    const dateMatch = xml.match(/Date="([\d.]+)"/);
    const usdMatch = xml.match(/CharCode>USD<\/CharCode>[\s\S]*?<Value>([\d,]+)<\/Value>/);
    if (usdMatch) {
      rateCache = {
        rub: Number(usdMatch[1].replace(",", ".")),
        date: dateMatch?.[1] || null,
        fetchedAt: Date.now(),
      };
    }
  } catch (err) {
    console.error("CBR rate fetch failed:", err);
  }
  return rateCache;
}

const ALLOWED_ORIGINS = [
  "https://nsp-club.ru",
  "https://www.nsp-club.ru",
  "http://localhost:5173",
];

const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://nsp-club.ru";

function renderProductBotHtml(res, product) {
  const description = (
    product.highlights?.[0] || `${product.name} — купить с доставкой. Артикул ${product.article}.`
  ).slice(0, 200);
  const imageUrl = product.images?.[0] ? `${SITE_ORIGIN}/images/${product.images[0]}` : null;
  const pageUrl = `${SITE_ORIGIN}/product/${product.slug}`;
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(product.name)} — NSP Club</title>
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:type" content="product">
<meta property="og:title" content="${escapeHtml(product.name)} — NSP Club">
<meta property="og:description" content="${escapeHtml(description)}">
${imageUrl ? `<meta property="og:image" content="${imageUrl}">` : ""}
<meta property="og:url" content="${pageUrl}">
<meta name="twitter:card" content="summary_large_image">
</head>
<body>
<h1>${escapeHtml(product.name)}</h1>
<p>${escapeHtml(description)}</p>
<a href="${pageUrl}">${escapeHtml(pageUrl)}</a>
</body>
</html>`);
}

const app = express();
app.set("trust proxy", 1);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));
app.use(cookieParser());

const IMAGES_DIR = path.join(DATA_DIR, "images");

app.use("/images", (req, res, next) => {
  if (!/\.(jpe?g|png)$/i.test(req.path) || !(req.headers.accept || "").includes("image/webp")) {
    return next();
  }
  const webpPath = path.join(IMAGES_DIR, req.path.replace(/\.(jpe?g|png)$/i, ".webp"));
  if (!fs.existsSync(webpPath)) return next();
  res.set("Content-Type", "image/webp");
  res.set("Vary", "Accept");
  fs.createReadStream(webpPath).pipe(res);
});

app.use("/images", express.static(IMAGES_DIR));

app.use("/api/v1/products", productsRouter);
app.use("/api/v1/auth", authRouter);

app.use("/api/v1/order", ordersRouter);
app.use("/api/v1/orders", ordersRouter);

app.get("/api/v1/rate", async (req, res) => {
  const rate = await getUsdRubRate();
  res.set("Cache-Control", "public, max-age=3600");
  res.json(rate);
});

app.get("/product/:slug", async (req, res, next) => {
  const product = await Product.findByPk(req.params.slug);
  if (!product) return next();
  renderProductBotHtml(res, product);
});

app.use("/admin", adminRouter);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "Origin not allowed" });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal error" });
});

export default app;
