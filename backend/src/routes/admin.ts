import { Router } from "express";
import type { Response } from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import sharp from "sharp";
import { mkdir } from "fs/promises";
import { unlink } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { prisma } from "../prisma.js";
import {
  requireAdmin, signAdminToken, setAdminCookie, clearAdminCookie,
} from "../middleware/auth.js";
import type { AdminRequest } from "../middleware/auth.js";
import { sendPaidThankYou, sendShippedNotice } from "../mail.js";

const router = Router();
const __dirname = dirname(fileURLToPath(import.meta.url));
// Admin uploads live in media/uploads (mounted as a volume in production);
// the seeded catalog photos stay in media/products (baked into the image).
const UPLOADS_DIR = join(__dirname, "..", "..", "media", "uploads");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

const ORDER_STATUSES = ["pending_whatsapp", "confirmed", "paid", "shipped", "delivered", "cancelled"];
const SETTING_KEYS = ["alert_email", "whatsapp_number", "pickup_note_fr", "pickup_note_en", "thankyou_code"];

// ——— Auth ———

router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");
    const admin = await prisma.adminUser.findUnique({ where: { email } });
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      return res.status(401).json({ error: "Courriel ou mot de passe invalide" });
    }
    setAdminCookie(res, signAdminToken(admin.id));
    res.json({ id: admin.id, email: admin.email, name: admin.name });
  } catch (err) { next(err); }
});

router.post("/logout", (_req, res) => {
  clearAdminCookie(res);
  res.json({ ok: true });
});

router.use(requireAdmin);

router.get("/me", async (req: AdminRequest, res, next) => {
  try {
    const admin = await prisma.adminUser.findUnique({ where: { id: req.adminId! } });
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    res.json({ id: admin.id, email: admin.email, name: admin.name });
  } catch (err) { next(err); }
});

// Change own email / name / password (current password required)
router.patch("/me", async (req: AdminRequest, res, next) => {
  try {
    const admin = await prisma.adminUser.findUnique({ where: { id: req.adminId! } });
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const { currentPassword, email, name, newPassword } = req.body ?? {};
    if (!(await bcrypt.compare(String(currentPassword ?? ""), admin.passwordHash))) {
      return res.status(403).json({ error: "Mot de passe actuel incorrect" });
    }
    const data: { email?: string; name?: string; passwordHash?: string } = {};
    if (email) data.email = String(email).trim().toLowerCase();
    if (name !== undefined) data.name = String(name).trim();
    if (newPassword) {
      if (String(newPassword).length < 8) return res.status(400).json({ error: "Le nouveau mot de passe doit contenir au moins 8 caractères" });
      data.passwordHash = await bcrypt.hash(String(newPassword), 10);
    }
    const updated = await prisma.adminUser.update({ where: { id: admin.id }, data });
    res.json({ id: updated.id, email: updated.email, name: updated.name });
  } catch (err) { next(err); }
});

// ——— Admin management ———

router.get("/admins", async (_req, res, next) => {
  try {
    const admins = await prisma.adminUser.findMany({ orderBy: { id: "asc" } });
    res.json(admins.map((a) => ({ id: a.id, email: a.email, name: a.name, createdAt: a.createdAt })));
  } catch (err) { next(err); }
});

router.post("/admins", async (req, res, next) => {
  try {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const name = String(req.body?.name ?? "").trim();
    const tempPassword = String(req.body?.tempPassword ?? "");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: "Courriel invalide" });
    if (tempPassword.length < 8) return res.status(400).json({ error: "Mot de passe temporaire : 8 caractères minimum" });
    const admin = await prisma.adminUser.create({
      data: { email, name, passwordHash: await bcrypt.hash(tempPassword, 10) },
    });
    res.status(201).json({ id: admin.id, email: admin.email, name: admin.name });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === "P2002") return res.status(409).json({ error: "Ce courriel existe déjà" });
    next(err);
  }
});

// ——— Orders ———

router.get("/orders", async (req, res, next) => {
  try {
    const where = typeof req.query.status === "string" && ORDER_STATUSES.includes(req.query.status)
      ? { status: req.query.status }
      : {};
    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  } catch (err) { next(err); }
});

router.patch("/orders/:id/status", async (req, res, next) => {
  try {
    const status = String(req.body?.status ?? "");
    if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ error: "Statut invalide" });
    const order = await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: { status },
      include: { items: true },
    });
    // Customer emails on key transitions (fire-and-forget)
    if (status === "paid") void sendPaidThankYou(order);
    if (status === "shipped") void sendShippedNotice(order);
    res.json(order);
  } catch (err) { next(err); }
});

// ——— Products ———

router.get("/products", async (_req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        collection: true,
        images: { orderBy: { sortOrder: "asc" } },
        sizes: { orderBy: { size: "asc" } },
      },
      orderBy: [{ collection: { sortOrder: "asc" } }, { id: "asc" }],
    });
    res.json(products);
  } catch (err) { next(err); }
});

const EDITABLE_FIELDS = [
  "name", "priceCents", "stock", "featured", "archived", "isSet",
  "descriptionEn", "descriptionFr", "storyEn", "storyFr",
  "materialsEn", "materialsFr", "colorEn", "colorFr",
] as const;

router.post("/products", async (req, res, next) => {
  try {
    const { name, collectionSlug, priceCents, hasSizes } = req.body ?? {};
    if (!name || !String(name).trim()) return res.status(400).json({ error: "Nom requis" });
    const collection = await prisma.collection.findUnique({ where: { slug: String(collectionSlug) } });
    if (!collection) return res.status(400).json({ error: "Collection invalide" });
    const price = Math.max(0, Math.round(Number(priceCents) || 0));
    const slug = String(name).trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);
    const product = await prisma.product.create({
      data: {
        slug,
        name: String(name).trim(),
        collectionId: collection.id,
        priceCents: price,
        isSet: collection.slug === "matching-sets",
        sizes: hasSizes || collection.slug !== "bags"
          ? { create: ["36", "37", "38", "39", "40", "41", "42", "43"].map((size) => ({ size, stock: 0 })) }
          : undefined,
      },
      include: { collection: true, images: true, sizes: true },
    });
    res.status(201).json(product);
  } catch (err) { next(err); }
});

router.patch("/products/:id", async (req, res, next) => {
  try {
    const data: Record<string, unknown> = {};
    for (const field of EDITABLE_FIELDS) {
      if (req.body?.[field] !== undefined) {
        if (field === "priceCents" || field === "stock") {
          data[field] = Math.max(0, Math.round(Number(req.body[field]) || 0));
        } else if (field === "featured" || field === "archived" || field === "isSet") {
          data[field] = Boolean(req.body[field]);
        } else {
          data[field] = String(req.body[field]);
        }
      }
    }
    const product = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data,
      include: { collection: true, images: { orderBy: { sortOrder: "asc" } }, sizes: { orderBy: { size: "asc" } } },
    });
    res.json(product);
  } catch (err) { next(err); }
});

// Bulk per-size stock update: { sizes: [{size, stock}] }
router.patch("/products/:id/sizes", async (req, res, next) => {
  try {
    const productId = Number(req.params.id);
    const sizes = (req.body?.sizes ?? []) as { size: string; stock: number }[];
    for (const s of sizes) {
      await prisma.productSize.upsert({
        where: { productId_size: { productId, size: String(s.size) } },
        update: { stock: Math.max(0, Math.round(Number(s.stock) || 0)) },
        create: { productId, size: String(s.size), stock: Math.max(0, Math.round(Number(s.stock) || 0)) },
      });
    }
    const rows = await prisma.productSize.findMany({ where: { productId }, orderBy: { size: "asc" } });
    res.json(rows);
  } catch (err) { next(err); }
});

// Photo upload — resized with sharp, stored in media/uploads
router.post("/products/:id/images", upload.single("image"), async (req: AdminRequest, res: Response, next) => {
  try {
    const productId = Number(req.params.id);
    const product = await prisma.product.findUnique({ where: { id: productId }, include: { images: true } });
    if (!product) return res.status(404).json({ error: "Produit introuvable" });
    if (!req.file) return res.status(400).json({ error: "Aucune image reçue" });

    await mkdir(UPLOADS_DIR, { recursive: true });
    const filename = `${product.slug}-${Date.now().toString(36)}.jpg`;
    await sharp(req.file.buffer)
      .rotate()
      .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(join(UPLOADS_DIR, filename));

    const image = await prisma.productImage.create({
      data: {
        productId,
        url: `/media/uploads/${filename}`,
        alt: product.name,
        sortOrder: product.images.length,
      },
    });
    res.status(201).json(image);
  } catch (err) { next(err); }
});

router.delete("/images/:id", async (req, res, next) => {
  try {
    const image = await prisma.productImage.delete({ where: { id: Number(req.params.id) } });
    if (image.url.startsWith("/media/uploads/")) {
      await unlink(join(UPLOADS_DIR, image.url.split("/").pop()!)).catch(() => {});
    }
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Reorder photos: { ids: [imageId, ...] } in desired order
router.patch("/products/:id/images/order", async (req, res, next) => {
  try {
    const ids = (req.body?.ids ?? []) as number[];
    for (let i = 0; i < ids.length; i++) {
      await prisma.productImage.update({ where: { id: Number(ids[i]) }, data: { sortOrder: i } });
    }
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ——— Settings ———

router.get("/settings", async (_req, res, next) => {
  try {
    const rows = await prisma.setting.findMany({ where: { key: { in: SETTING_KEYS } } });
    res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
  } catch (err) { next(err); }
});

router.patch("/settings", async (req, res, next) => {
  try {
    for (const key of SETTING_KEYS) {
      if (req.body?.[key] !== undefined) {
        await prisma.setting.upsert({
          where: { key },
          update: { value: String(req.body[key]).trim() },
          create: { key, value: String(req.body[key]).trim() },
        });
      }
    }
    const rows = await prisma.setting.findMany({ where: { key: { in: SETTING_KEYS } } });
    res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
  } catch (err) { next(err); }
});

export default router;
