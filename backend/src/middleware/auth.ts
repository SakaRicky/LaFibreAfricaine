import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET ?? "lfa-dev-secret-change-in-prod";
const COOKIE = "lfa_admin";

export interface AdminRequest extends Request {
  adminId?: number;
}

export function signAdminToken(adminId: number): string {
  return jwt.sign({ sub: String(adminId) }, SECRET, { expiresIn: "7d" });
}

export function setAdminCookie(res: Response, token: string): void {
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 3600 * 1000,
  });
}

export function clearAdminCookie(res: Response): void {
  res.clearCookie(COOKIE);
}

export function requireAdmin(req: AdminRequest, res: Response, next: NextFunction): void {
  try {
    const token = (req as Request & { cookies?: Record<string, string> }).cookies?.[COOKIE];
    if (!token) throw new Error("no token");
    const payload = jwt.verify(token, SECRET) as { sub: string };
    req.adminId = Number(payload.sub);
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
