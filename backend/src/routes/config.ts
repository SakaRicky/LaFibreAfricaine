import { Router } from "express";
import { prisma } from "../prisma.js";

const router = Router();

// GET /api/config — public storefront configuration (admin-editable settings)
router.get("/", async (_req, res, next) => {
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: ["whatsapp_number", "pickup_note_fr", "pickup_note_en"] } },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    res.json({
      whatsappNumber: map.whatsapp_number ?? "",
      pickupNoteFr: map.pickup_note_fr ?? "",
      pickupNoteEn: map.pickup_note_en ?? "",
    });
  } catch (err) { next(err); }
});

export default router;
