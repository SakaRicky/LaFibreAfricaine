// One-time migration: upload the catalog photos in media/products to Cloudinary
// and point the product_images rows at the CDN delivery URLs.
// Idempotent — safe to re-run (overwrites the same public IDs).
// Usage: npm run media:cloudinary   (requires CLOUDINARY_URL in env)
import "dotenv/config";
import { readdir, readFile } from "fs/promises";
import { basename, extname, join, dirname } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import { cloudinaryReady, uploadBuffer, deliveryUrl } from "../src/cloudinary.js";

const prisma = new PrismaClient();
const PRODUCTS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "media", "products");
const FOLDER = "lafibre/products";

async function main() {
  if (!cloudinaryReady) {
    console.error("CLOUDINARY_URL is not set — nothing to do.");
    process.exit(1);
  }

  const files = (await readdir(PRODUCTS_DIR)).filter((f) => extname(f).toLowerCase() === ".jpg");
  console.log(`Uploading ${files.length} catalog photos to Cloudinary (${FOLDER})…`);

  for (const file of files) {
    const stem = basename(file, ".jpg");
    const publicId = `${FOLDER}/${stem}`;
    const buffer = await readFile(join(PRODUCTS_DIR, file));
    await uploadBuffer(buffer, publicId);

    const { count } = await prisma.productImage.updateMany({
      where: { url: `/media/products/${file}` },
      data: { url: deliveryUrl(publicId), publicId },
    });
    console.log(`  ✓ ${file} → ${publicId}${count ? ` (${count} DB row updated)` : ""}`);
  }

  const remaining = await prisma.productImage.count({ where: { url: { startsWith: "/media/products/" } } });
  console.log(`Done. Product images still on local disk: ${remaining}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
