import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { serializeProduct, productInclude } from "../serialize.js";

const router = Router();

function sortOrder(sort: unknown): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc": return [{ priceCents: "asc" }];
    case "price_desc": return [{ priceCents: "desc" }];
    case "name": return [{ name: "asc" }];
    default:
      return [{ collection: { sortOrder: "asc" } }, { featured: "desc" }, { id: "asc" }];
  }
}

// GET /api/products?collection=bags&featured=true&sort=price_asc
router.get("/", async (req, res, next) => {
  try {
    const where: Prisma.ProductWhereInput = { archived: false };
    if (typeof req.query.collection === "string") {
      where.collection = { slug: req.query.collection };
    }
    if (req.query.featured === "true") where.featured = true;

    const products = await prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: sortOrder(req.query.sort),
    });
    res.json(products.map(serializeProduct));
  } catch (err) { next(err); }
});

// GET /api/products/:slug — includes related products from the same collection
router.get("/:slug", async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: productInclude,
    });
    if (!product || product.archived) return res.status(404).json({ error: "Product not found" });

    const related = await prisma.product.findMany({
      where: { collectionId: product.collectionId, id: { not: product.id }, archived: false },
      include: productInclude,
      orderBy: [{ featured: "desc" }, { id: "asc" }],
      take: 4,
    });

    res.json({ ...serializeProduct(product), related: related.map(serializeProduct) });
  } catch (err) { next(err); }
});

export default router;
