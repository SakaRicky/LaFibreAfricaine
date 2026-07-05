# La Fibre Africaine — Ecommerce Platform

**Wear Your Roots With Elegance.** Custom bilingual (EN/FR) online store for
La Fibre Africaine — African-inspired bags, sandals and matching sets,
handcrafted in Cameroon and shipped across Canada.

## Stack

| Layer    | Technology                                                        |
| -------- | ----------------------------------------------------------------- |
| Frontend | React 19 + Vite (TypeScript), Tailwind CSS v4, React Router, react-i18next |
| Fonts    | Cormorant Garamond (display) + Inter (body), self-hosted           |
| Backend  | Node.js + Express 5 (TypeScript, run with tsx)                     |
| ORM      | Prisma 6                                                           |
| Database | PostgreSQL 16 (project-local cluster in `database/pgdata`, port **5433**) |
| Media    | **Cloudinary CDN** — catalog + admin uploads, auto WebP/AVIF (`f_auto,q_auto`); local-disk fallback when unset |
| Payment  | **V1: WhatsApp** — orders are reserved in the DB, then finalized in a WhatsApp chat with the admin |
| Admin    | French dashboard at **/admin** — orders, products, stock, photos, settings, multi-admin |
| Emails   | Customer confirmation / paid thank-you (-10% code) / shipped notice + admin alerts (SMTP via env; skipped gracefully if unset) |

## Project layout

```
assets/       Brand assets, Project Bible, design concepts, product photos
backend/      Express + Prisma API, bilingual seed, product photo hosting (/media)
frontend/     React storefront (Vite dev server on :5173, proxies /api and /media to :4000)
database/     Project-owned Postgres 16 data directory (port 5433, user "lafibre")
```

## First login (admin)

Dashboard: `http://localhost:5173/admin` (or `/admin` in production)
Seeded account: `sakaricky91@gmail.com` / `LaFibre-2026!` — **change it immediately** in « Mon compte ».

All live settings (WhatsApp number, alert email, pickup note, promo code) are managed in **Réglages** — no redeploy needed. All stock is seeded at **zero**: enter real inventory in **Produits**.

## Running the app

Three things must run: the database, the API, the frontend.

```bash
# 1. Database (once per boot)
cd backend && npm run db:start

# 2. API  → http://localhost:4000
cd backend && npm run dev

# 3. Storefront → http://localhost:5173
cd frontend && npm run dev
```

First-time setup: `npm install` in both `backend/` and `frontend/`, then in
`backend/`: `npm run db:push && npm run db:seed`.

Other backend commands:

- `npm run db:stop` — stop the Postgres cluster
- `npm run db:push` — sync Prisma schema to the database
- `npm run db:seed` — load the 26-product bilingual catalog
- `npm run typecheck` — TypeScript check (also available in `frontend/`)
- `npm run media:cloudinary` — one-time: upload catalog photos to Cloudinary and repoint DB URLs

## Deployment

See **DEPLOY.md** (Railway single-service + Postgres + volume for photo uploads, SMTP setup).

## Internationalization

- **French is the default**; the header FR/EN toggle persists the choice in localStorage.
- UI strings live in `frontend/src/locales/en.json` and `fr.json` (react-i18next).
- Catalog content (descriptions, stories, materials, colors) is **bilingual in the
  database** (`*_en` / `*_fr` columns); the API returns `{en, fr}` objects and the
  frontend picks by active language. Prices format as `$85.00` / `85,00 $`.

## V1 order flow (WhatsApp)

1. Customer picks **shipping** or **pickup in Montréal (Lachine)** at checkout →
   `POST /api/orders` validates, atomically decrements stock, saves as `pending_whatsapp`,
   emails the customer a confirmation and the admin an alert with a one-tap WhatsApp link.
2. Confirmation page shows a WhatsApp button with the order pre-filled; payment
   (Interac e-Transfer or cash) and delivery are agreed in chat.
3. Admin moves the order through `pending_whatsapp → confirmed → paid → shipped → delivered`
   (or `cancelled`). **Paid** auto-sends the thank-you email with the -10% code; **shipped**
   sends the shipping/pickup-ready notice.
4. Product pages also have a "Chat with us on WhatsApp" inquiry link.

## API overview

- `GET /api/products` — catalog (`?collection=`, `?featured=true`, `?sort=price_asc|price_desc|name`)
- `GET /api/products/:slug` — one product + sizes + related
- `GET /api/collections` — collections with counts and cover images
- `POST /api/orders` / `GET /api/orders/:orderNumber`
- `POST /api/newsletter`
- `GET /media/*` — local fallback for product photography (production uses Cloudinary URLs)

## Business rules

- Prices in CAD cents; free shipping ≥ $100 CAD, otherwise $12 flat; pickup is free.
- Sandals and sets carry EU sizes 36–43 with per-size stock (product stock = sum of sizes).
- Sold-out products stay visible as « Épuisé » — never hidden. Archived products are hidden.
- No personalized items in V1.

## Next milestones

1. Deploy to Railway (see DEPLOY.md) + buy lafibreafricaine.com
2. Real product photo session (phone photography guide agreed)
3. Resend for emails once the domain exists
4. Stripe online payment (V2)
