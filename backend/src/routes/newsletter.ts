import { Router } from "express";
import { prisma } from "../prisma.js";

const router = Router();

// POST /api/newsletter { email }
router.post("/", async (req, res, next) => {
  try {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: {},
      create: { email },
    });
    res.status(201).json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
