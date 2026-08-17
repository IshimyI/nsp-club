import "dotenv/config";
// Express 4 doesn't forward a rejected promise from an async route handler
// to next(err) on its own — without this, any DB hiccup or thrown error
// inside an async handler becomes an unhandled rejection that crashes the
// whole process on Node 18+. This patches Express so those rejections
// reach the error-handling middleware at the bottom of this file instead.
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

// Official CBR (Russian central bank) USD/RUB rate, refetched at most once
// a day and cached in memory — used to show a real (not guessed) ruble
// estimate next to the dollar prices on the site.
let rateCache = { rub: null, date: null, fetchedAt: 0 };
const RATE_TTL_MS = 24 * 60 * 60 * 1000;

async function getUsdRubRate() {
  if (rateCache.rub && Date.now() - rateCache.fetchedAt < RATE_TTL_MS) {
    return rateCache;
  }
  try {
    const res = await fetch("https://www.cbr.ru/scripts/XML_daily.asp");
    const buf = Buffer.from(await res.arrayBuffer());
    // The feed is windows-1251; the bits we need (digits, comma, date) are
    // all ASCII-safe, so latin1 decoding is enough without a full charset lib.
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

// Regular users never reach this — nginx only proxies /product/:slug here
// for requests whose User-Agent matches a known social-media
// link-unfurling bot (see /etc/nginx/conf.d/social-bots.conf on the VPS).
// Those bots don't execute JS, so the SPA's dynamic <title>/meta never
// reaches them — this server-rendered response stands in, just for this path.
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

// Transparent WebP negotiation: if the browser accepts image/webp and a
// pre-generated .webp sibling exists for the requested jpg/jpeg/png, serve
// that instead. Keeps every existing image URL in the product data working
// unchanged while still shipping the smaller format where possible.
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
// Mounted at both the singular path (POST /api/v1/order — what the client
// has always posted to) and the plural one (GET /api/v1/orders/mine, the
// new order-history endpoint) since they're the same router.
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
