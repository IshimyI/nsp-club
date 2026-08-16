import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const products = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../data/products.json"), "utf8")
);

const BASE = "https://nsp-club.ru";
const STATIC_PATHS = ["/", "/catalog", "/about", "/contacts", "/privacy", "/order"];

const today = new Date().toISOString().slice(0, 10);

const urls = [
  ...STATIC_PATHS.map((p) => ({ loc: `${BASE}${p}`, priority: p === "/" ? "1.0" : "0.6" })),
  ...products.map((p) => ({ loc: `${BASE}/product/${p.slug}`, priority: "0.8" })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><priority>${u.priority}</priority></url>`
  )
  .join("\n")}
</urlset>
`;

const outFile = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(__dirname, "../../client/public/sitemap.xml");
fs.writeFileSync(outFile, xml, "utf8");
console.log(`Wrote sitemap with ${urls.length} URLs -> ${outFile}`);
