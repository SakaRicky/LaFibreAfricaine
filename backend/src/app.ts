import "dotenv/config";
import express from "express";
import { errorHandler } from "./middleware/errors.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import productsRouter from "./routes/products.js";
import collectionsRouter from "./routes/collections.js";
import ordersRouter from "./routes/orders.js";
import newsletterRouter from "./routes/newsletter.js";
import configRouter from "./routes/config.js";
import adminRouter from "./routes/admin.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
// Railway terminates HTTPS at one reverse proxy. Keep local headers untrusted.
app.set("trust proxy", process.env.NODE_ENV === "production" ? 1 : false);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Product photography served straight from disk
app.use("/media", express.static(join(__dirname, "..", "media"), { maxAge: "7d", immutable: true }));

app.get("/api/health", (_req, res) => res.json({ ok: true, brand: "La Fibre Africaine" }));

app.use("/api/products", productsRouter);
app.use("/api/collections", collectionsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/newsletter", newsletterRouter);
app.use("/api/config", configRouter);
app.use("/api/admin", adminRouter);

// Production: serve the built storefront from the same service (Railway single-service setup)
const staticDir = process.env.SERVE_STATIC
  ? join(__dirname, "..", process.env.SERVE_STATIC)
  : null;
if (staticDir && existsSync(staticDir)) {
  app.use(express.static(staticDir));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api") || req.path.startsWith("/media")) return next();
    res.sendFile(join(staticDir, "index.html"));
  });
  console.log(`Serving storefront from ${staticDir}`);
}

app.use(errorHandler);

export default app;
