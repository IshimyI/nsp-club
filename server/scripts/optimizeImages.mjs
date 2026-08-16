import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.resolve(__dirname, "../data/images");
const MAX_DIMENSION = 900;
const JPEG_QUALITY = 80;

async function main() {
  const files = fs.readdirSync(IMAGES_DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  let before = 0;
  let after = 0;
  let processed = 0;

  for (const file of files) {
    const filePath = path.join(IMAGES_DIR, file);
    const sizeBefore = fs.statSync(filePath).size;
    before += sizeBefore;

    const buf = fs.readFileSync(filePath);
    const ext = path.extname(file).toLowerCase();
    let pipeline = sharp(buf).resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });

    if (ext === ".png") {
      pipeline = pipeline.png({ quality: 85, compressionLevel: 9 });
    } else if (ext === ".webp") {
      pipeline = pipeline.webp({ quality: JPEG_QUALITY });
    } else {
      pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
    }

    const outBuf = await pipeline.toBuffer();
    if (outBuf.length < sizeBefore) {
      fs.writeFileSync(filePath, outBuf);
      after += outBuf.length;
    } else {
      after += sizeBefore;
    }
    processed++;

    // Also maintain a .webp sibling for jpg/png originals — the server
    // transparently serves this to browsers that send Accept: image/webp,
    // so no client-side or products.json change is needed.
    if (ext === ".jpg" || ext === ".jpeg" || ext === ".png") {
      const webpPath = filePath.replace(/\.(jpe?g|png)$/i, ".webp");
      await sharp(fs.readFileSync(filePath)).webp({ quality: JPEG_QUALITY }).toFile(webpPath);
    }
  }

  console.log(`Processed ${processed} images`);
  console.log(`Before: ${(before / 1024 / 1024).toFixed(1)} MB`);
  console.log(`After:  ${(after / 1024 / 1024).toFixed(1)} MB`);
}

main();
