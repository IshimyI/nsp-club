import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Google retired sitemap ping in 2023; IndexNow (supported directly by Bing
// and Yandex) is the current standard for "hey, these URLs changed" —
// worth more than a dead Google endpoint. Key file lives in client/public/
// so it's served at https://nsp-club.ru/<KEY>.txt as IndexNow requires.
const KEY = "e2e5ae9b4ba45e77a65e578d87ac7c2d";
const HOST = "nsp-club.ru";

async function main() {
  const productsFile = path.resolve(__dirname, "../data/products.json");
  const products = JSON.parse(fs.readFileSync(productsFile, "utf8"));
  const urlList = [
    `https://${HOST}/`,
    `https://${HOST}/catalog`,
    ...products.map((p) => `https://${HOST}/product/${p.slug}`),
  ];

  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: HOST,
        key: KEY,
        keyLocation: `https://${HOST}/${KEY}.txt`,
        urlList,
      }),
    });
    console.log(`IndexNow ping: HTTP ${res.status} (${urlList.length} URLs submitted)`);
  } catch (err) {
    console.error("IndexNow ping failed:", err.message);
  }
}

main();
