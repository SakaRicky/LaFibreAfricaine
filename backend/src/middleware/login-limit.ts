import type { RequestHandler } from "express";

// Per-process fixed windows. Bound memory and fail closed when capacity is full.
export function createLoginLimiter({ limit = 10, windowMs = 15 * 60_000, maxKeys = 10_000, now = Date.now } = {}): RequestHandler {
  const attempts = new Map<string, { count: number; reset: number }>();
  return (req, res, next) => {
    const time = now();
    for (const [key, entry] of attempts) if (entry.reset <= time) attempts.delete(key);
    const key = req.ip || req.socket.remoteAddress || "unknown";
    let entry = attempts.get(key);
    if (!entry && attempts.size < maxKeys) {
      entry = { count: 0, reset: time + windowMs };
      attempts.set(key, entry);
    }
    if (!entry || entry.count >= limit) {
      res.setHeader("Retry-After", Math.max(1, Math.ceil(((entry?.reset ?? time + windowMs) - time) / 1000)));
      res.setHeader("Cache-Control", "no-store");
      res.status(429).json({ error: "Trop de tentatives de connexion. Réessayez plus tard." });
      return;
    }
    entry.count++;
    next();
  };
}
