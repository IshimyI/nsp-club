import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.resolve(__dirname, "../data/images");
const SETS_FILE = path.resolve(__dirname, "../data/products-sets.json");

const CANVAS = 640;

function loadJson(file) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : [];
}

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[«»,.()]/g, " ")
    .replace(/\bнсп\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findComponentImages(componentName, catalog) {
  const needle = normalizeName(componentName);
  let best = null;
  for (const p of catalog) {
    if (!p.images?.length) continue;
    const hay = normalizeName(p.name);
    if (hay === needle) return p.images; // exact match wins immediately
    if (!best && (hay.includes(needle) || needle.includes(hay))) best = p.images;
  }
  return best;
}

// Composites up to 4 of the set's actual component-product photos into one
// square collage — built entirely from images we already legitimately own
// (local product shoots + naturessunshine.ru), not sourced from the web.
async function buildCollage(imagePaths, outPath) {
  const cell = Math.floor(CANVAS / 2);
  const tiles = await Promise.all(
    imagePaths.slice(0, 4).map(async (imgPath) => {
      const buf = await sharp(imgPath)
        .resize(cell - 8, cell - 8, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .toBuffer();
      return buf;
    })
  );

  const positions = [
    [4, 4],
    [cell + 4, 4],
    [4, cell + 4],
    [cell + 4, cell + 4],
  ];

  const composite = tiles.map((buf, i) => ({ input: buf, left: positions[i][0], top: positions[i][1] }));

  await sharp({
    create: { width: CANVAS, height: CANVAS, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .composite(composite)
    .jpeg({ quality: 85 })
    .toFile(outPath);
}

async function main() {
  const sets = loadJson(SETS_FILE);
  const localProducts = loadJson(path.resolve(__dirname, "../data/products-local.json"));
  const officialExtra = loadJson(path.resolve(__dirname, "../data/products-official-extra.json"));
  const catalog = [...localProducts, ...officialExtra];

  let built = 0;
  for (const set of sets) {
    if (!set.componentNames?.length) continue;
    const imagePaths = [];
    for (const name of set.componentNames) {
      const images = findComponentImages(name, catalog);
      if (images?.[0]) {
        imagePaths.push(path.join(IMAGES_DIR, images[0]));
        if (imagePaths.length >= 4) break;
      }
    }
    if (imagePaths.length === 0) {
      console.log(`  no component images found for: ${set.name}`);
      continue;
    }
    const outName = `set-${set.slug}.jpg`;
    try {
      await buildCollage(imagePaths, path.join(IMAGES_DIR, outName));
      set.images = [outName];
      built++;
      console.log(`  built ${outName} from ${imagePaths.length} component photo(s) — ${set.name}`);
    } catch (err) {
      console.log(`  FAILED collage for ${set.name}: ${err.message}`);
    }
  }

  fs.writeFileSync(SETS_FILE, JSON.stringify(sets, null, 2), "utf8");
  console.log(`Built ${built}/${sets.length} set collages`);
}

main();
