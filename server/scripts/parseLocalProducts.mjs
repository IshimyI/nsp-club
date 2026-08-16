import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = path.resolve(
  __dirname,
  "../../../Здоровье в капсулах/Товары (фото и СГР и описание)"
);
const IMAGES_OUT_DIR = path.resolve(__dirname, "../data/images");
const OUT_FILE = path.resolve(__dirname, "../data/products-local.json");

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const SECTION_HEADERS = [
  "Преимущества",
  "Активные ингредиенты",
  "Состав",
  "Применение",
  "Противопоказания",
];

function slugify(input) {
  const map = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
    ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return input
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function convertDocxToText(docxPath) {
  return execFileSync("textutil", ["-convert", "txt", "-stdout", docxPath], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20,
  });
}

// The source docx files mix Latin homoglyphs into Cyrillic words in a
// handful of names (OCR/copy-paste artifact) — e.g. "Чеснoк" has a Latin
// "o". Fixed by exact substring swap since these are one-off typos, not a
// systematic encoding issue.
const NAME_TYPO_FIXES = {
  Глюкозaмин: "Глюкозамин",
  Гoту: "Готу",
  Индoл: "Индол",
  Макc: "Макс",
  Маслo: "Масло",
  Пaу: "Пау",
  "Пo ": "По ",
  HCП: "НСП",
  Грабберc: "Грабберс",
  Чеснoк: "Чеснок",
};

function fixNameTypos(name) {
  let fixed = name;
  for (const [bad, good] of Object.entries(NAME_TYPO_FIXES)) {
    fixed = fixed.split(bad).join(good);
  }
  return fixed;
}

function parseProductText(raw, folderName) {
  const lines = raw.replace(/\r/g, "").split("\n");
  // First non-empty line is the Russian name; the following line often holds
  // the English name glued to "Артикул: N" with no separator, e.g.
  // "HP FighterАртикул: 917"
  let i = 0;
  while (i < lines.length && !lines[i].trim()) i++;
  const name = fixNameTypos(lines[i]?.trim() || folderName);
  i++;
  while (i < lines.length && !lines[i].trim()) i++;
  const secondLine = lines[i] || "";
  const artMatch = secondLine.match(/Артикул:\s*([A-Za-zА-Яа-я0-9\-]+)/);
  const article = artMatch ? artMatch[1] : null;
  const nameEn = secondLine.replace(/Артикул:.*$/, "").trim() || null;
  i++;

  const rest = lines.slice(i).join("\n");

  // Split remaining text on section headers that sit alone on their own line.
  const headerPattern = new RegExp(
    `^(${SECTION_HEADERS.join("|")})$`,
    "m"
  );
  const highlightsBlock = rest.split(headerPattern)[0];
  const highlights = highlightsBlock
    .split("\n")
    .map((l) => l.replace(/^[\s•\-]+/, "").trim())
    .filter((l) => l && l !== "СГР");

  const sections = {};
  const parts = rest.split(headerPattern);
  // parts alternates: [pre, header, body, header, body, ...]
  for (let p = 1; p < parts.length; p += 2) {
    const header = parts[p].trim();
    const body = (parts[p + 1] || "")
      .trim()
      .replace(/[ \t]*•[ \t]*/g, "\n• ")
      .replace(/\n{2,}/g, "\n")
      .trim();
    sections[header] = body;
  }

  return { name, nameEn, article, highlights, sections };
}

function isCertificateFilename(filename) {
  // SGR/certificate scans are consistently named "д<article>", sometimes
  // with a "_2"-style suffix for a second scanned page (e.g. "д1825.jpg",
  // "д1602_1.jpg") — distinct from real product photos.
  const stem = path.basename(filename, path.extname(filename));
  return /^д\d+/i.test(stem);
}

function getImageRatio(filePath) {
  try {
    const out = execFileSync(
      "sips",
      ["-g", "pixelWidth", "-g", "pixelHeight", filePath],
      { encoding: "utf8" }
    );
    const w = Number(out.match(/pixelWidth:\s*(\d+)/)?.[1]);
    const h = Number(out.match(/pixelHeight:\s*(\d+)/)?.[1]);
    if (!w || !h) return null;
    return h / w;
  } catch {
    return null;
  }
}

// The two certificate page templates (front "Свидетельство" page and
// "Приложение" continuation page) are scanned/exported at consistent
// aspect ratios across the whole dataset, regardless of filename —
// narrow bands around 1.19 and 1.38 catch both, even hash-named copies.
function isCertificateRatio(ratio) {
  if (ratio == null) return false;
  return (ratio > 1.16 && ratio < 1.21) || (ratio > 1.33 && ratio < 1.41);
}

function isCertificate(folderPath, filename) {
  if (isCertificateFilename(filename)) return true;
  return isCertificateRatio(getImageRatio(path.join(folderPath, filename)));
}

// Flat print-ready label artwork (the unwrapped bottle label as a design
// file, not a photo of the product) is consistently a very wide/short crop
// in this dataset — real product photography (bottles, pouches, lifestyle
// shots) is never this elongated, even landscape lifestyle shots stay
// above this. Confirmed by eye against ~15 samples across the ratio range.
const LABEL_RATIO_MAX = 0.55;

function isFlatLabel(folderPath, filename) {
  const ratio = getImageRatio(path.join(folderPath, filename));
  return ratio != null && ratio < LABEL_RATIO_MAX;
}

// Real product photos always come first (so the card thumbnail and primary
// gallery image are never a certificate or a flat label) — labels and
// certificate scans are still appended after rather than dropped, since
// they're legitimate supplementary images (a label lists the full official
// composition; a registration certificate is a trust signal), just not
// what should represent the product at a glance.
function pickImages(folderPath) {
  const files = fs
    .readdirSync(folderPath)
    .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()));
  const photos = [];
  const labels = [];
  const certs = [];
  for (const f of files) {
    const entry = { file: f, size: fs.statSync(path.join(folderPath, f)).size };
    if (isCertificate(folderPath, f)) certs.push(entry);
    else if (isFlatLabel(folderPath, f)) labels.push(entry);
    else photos.push(entry);
  }
  photos.sort((a, b) => b.size - a.size);
  labels.sort((a, b) => b.size - a.size);
  certs.sort((a, b) => b.size - a.size);
  return { photos, labels, certs };
}

function main() {
  const folders = fs
    .readdirSync(SOURCE_DIR)
    .filter((f) => fs.statSync(path.join(SOURCE_DIR, f)).isDirectory());

  fs.mkdirSync(IMAGES_OUT_DIR, { recursive: true });

  const products = [];
  const errors = [];

  for (const folder of folders) {
    const folderPath = path.join(SOURCE_DIR, folder);
    const docxFile = fs
      .readdirSync(folderPath)
      .find((f) => f.toLowerCase().endsWith(".docx"));
    if (!docxFile) {
      errors.push({ folder, error: "no docx" });
      continue;
    }
    try {
      const raw = convertDocxToText(path.join(folderPath, docxFile));
      const parsed = parseProductText(raw, folder);
      const { photos, labels, certs } = pickImages(folderPath);

      const slug = slugify(parsed.name || folder);
      const outImages = [];
      [...photos, ...labels, ...certs].forEach((img, idx) => {
        const ext = path.extname(img.file).toLowerCase();
        const outName = `${slug}-${idx + 1}${ext}`;
        fs.copyFileSync(
          path.join(folderPath, img.file),
          path.join(IMAGES_OUT_DIR, outName)
        );
        outImages.push(outName);
      });

      products.push({
        slug,
        folder,
        name: parsed.name,
        nameEn: parsed.nameEn,
        article: parsed.article,
        photoCount: photos.length,
        highlights: parsed.highlights,
        sections: parsed.sections,
        images: outImages,
      });
    } catch (err) {
      errors.push({ folder, error: String(err.message || err) });
    }
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(products, null, 2), "utf8");
  console.log(`Parsed ${products.length} products, ${errors.length} errors`);
  if (errors.length) console.log(JSON.stringify(errors, null, 2));
}

main();
