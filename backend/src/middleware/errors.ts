import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  console.error(err);
  if (res.headersSent) { next(err); return; }
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status <= 599 ? err.status : 500;
  const message = process.env.NODE_ENV === "production" && status >= 500
    ? "Internal server error"
    : err.type === "entity.parse.failed" ? "Invalid JSON body"
    : err.message || "Internal server error";
  res.status(status).json({ error: message });
};
