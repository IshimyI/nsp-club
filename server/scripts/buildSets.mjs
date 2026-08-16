import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prices = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../data/prices.json"), "utf8")
);
const programsPath = path.resolve(__dirname, "../data/program-components.json");
const programs = fs.existsSync(programsPath)
  ? JSON.parse(fs.readFileSync(programsPath, "utf8"))
  : [];

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

// Official NSP "programs" pages list which individual products belong to
// each health program — matched here to our set names so we can show the
// real composition instead of a generic placeholder. Matched by
// stemmed-word overlap; a few names diverge enough from the program title
// to need a manual pointer (or genuinely have no official equivalent).
const MANUAL_PROGRAM_OVERRIDES = {
  64213: "vascular-care", // "Защита сосудов"
  64214: "antiparasitic", // "Противопаразитарная"
  64216: "detoxification", // "Программа детоксикации"
  64208: null, // "Стоп простуда" — no matching official program
};

function wordSet(s) {
  return new Set(
    s
      .toLowerCase()
      .replace(/[«»,.\-–]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !["набор", "нсп", "ваших", "вашей", "ваша"].includes(w))
      .map((w) => w.slice(0, 6))
  );
}

function findProgram(setName, article) {
  if (article in MANUAL_PROGRAM_OVERRIDES) {
    const slug = MANUAL_PROGRAM_OVERRIDES[article];
    return slug ? programs.find((p) => p.programSlug === slug) : null;
  }
  const sw = wordSet(setName);
  let best = null;
  let bestScore = 0;
  for (const p of programs) {
    const pw = wordSet(p.title);
    const overlap = [...sw].filter((w) => pw.has(w)).length;
    const score = overlap / Math.min(sw.size, pw.size || 1);
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return bestScore >= 0.99 ? best : null;
}

const sets = Object.entries(prices)
  .filter(([, info]) => info.name && /набор/i.test(info.name))
  .map(([article, info]) => {
    const program = findProgram(info.name, article);
    const componentNames = program?.products?.map((p) => p.name) || [];
    const composition = componentNames.length
      ? `В набор входит: ${componentNames.join(", ")}.`
      : "Точный состав набора и наличие уточняйте при оформлении заявки.";
    return {
      slug: slugify(info.name) || `nabor-${article}`,
      name: info.name,
      nameEn: null,
      article,
      category: "Наборы",
      highlights: [],
      sections: {
        Применение: `Набор из нескольких продуктов NSP, подобранных по одному направлению здоровья, по специальной цене. ${composition}`,
      },
      componentNames,
      images: [],
    };
  });

const outFile = path.resolve(__dirname, "../data/products-sets.json");
fs.writeFileSync(outFile, JSON.stringify(sets, null, 2), "utf8");
console.log(`Built ${sets.length} sets -> ${outFile}`);
console.log(`With real composition: ${sets.filter((s) => !s.sections.Применение.includes("уточняйте")).length}`);
