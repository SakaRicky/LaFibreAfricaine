import { Router } from "express";
import { prisma } from "../prisma.js";

const router = Router();

// GET /api/collections — with product counts and a cover image
router.get("/", async (_req, res, next) => {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { products: true } },
        products: {
          orderBy: [{ featured: "desc" }, { id: "asc" }],
          take: 1,
          include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
        },
      },
    });

    res.json(
      collections.map((c) => ({
        slug: c.slug,
        name: { en: c.nameEn, fr: c.nameFr },
        description: { en: c.descriptionEn, fr: c.descriptionFr },
        productCount: c._count.products,
        coverImage: c.products[0]?.images[0]?.url ?? null,
      }))
    );
  } catch (err) { next(err); }
});

export default router;
