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
| Payment  | **Cash + Interac** — shared stock reservations and manual receipt confirmation; no gateway |
| Admin    | French dashboard at **/admin** — orders, products, stock, photos, settings, multi-admin |
| Emails   | Storefront order confirmation + admin alerts (SMTP via env; skipped gracefully if unset) |

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

All live settings (WhatsApp number, alert email, pickup note, promo code) are managed in **Réglages** — no redeploy needed. All stock is seeded at **zero**: record receipts in **Inventaire**.

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

## Shared inventory and in-person sales

Open `/admin` and sign in with an existing admin account. The mobile menu and
sidebar provide **Tableau de bord**, **Enregistrer une vente**, **Inventaire**,
**Réservations Interac**, and **Historique des ventes**. Product names, prices and
photos remain under **Produits**. Prices in the product editor are entered in CAD,
not cents.

- Cash sales require confirmation that cash was received. Interac sales remain
  reservations until an admin explicitly confirms receipt in their bank account.
- `Product.stock` and each size/colour's stock mean **available**, not physical
  stock. Reservations immediately remove availability across both storefront and
  admin sales. Confirmation never deducts twice. There is no automatic expiry.
- Inventory changes are signed quantity movements with an admin, timestamp and
  reason. Variant labels combine size and colour (for example `M · Rouge`), and
  the storefront uses the same variants. Stock cannot be overwritten through the
  old product or size endpoints.
- Cancellations restore stock once. Paid cancellations require a manual refund
  confirmation. Items already handed over use returns; each returned item can be
  restocked or marked unsuitable for resale. Refunds account for discounts and
  partial returns; delivery charges are retained on returns. The app never moves
  money. Returns and changes are recorded in an audit journal.
- Corrections release and reallocate stock atomically, retain the
  original snapshot, and use current catalog prices. Paid corrections require
  confirmation of any amount collected/refunded. After a return, use a new sale
  for replacements rather than editing the original transaction.
- Customer information is optional for admin sales. The logged-in admin and date
  are recorded automatically. Payment and fulfilment statuses are independent.
- History supports date (inclusive local calendar dates), product, payment and
  salesperson filters. CSV export applies those same filters and protects text
  cells against spreadsheet formula injection. One CSV row represents one sale
  line; order totals repeat for multi-item sales.

### Upgrade an existing local database

Use Node 22+, start PostgreSQL, then run from the project root:

```bash
npm run prisma:generate --prefix backend
npm run inventory:schema --prefix backend
npm run inventory:upgrade --prefix backend
npm run db:push --prefix backend
```

The reviewed SQL in `backend/prisma/inventory-upgrade.sql` only adds columns,
tables and indexes. The schema runner applies it once in a transaction. The data
upgrade keeps existing orders and their statuses, labels historical paid methods
as unknown (`legacy`), and synchronizes aggregate product quantities with their
existing size quantities. It does not infer a new Interac receipt or release
historically cancelled stock. The upgrade writes a one-time marker and any total
synchronization to the movement ledger. Production startup runs the same upgrade
before starting the API. Set a random `JWT_SECRET` of at least 32 characters in
production; authenticated sessions for deleted admins are rejected.

### Verify inventory rules

```bash
npm test --prefix backend
npm run typecheck --prefix backend
npm run typecheck --prefix frontend
npm run build --prefix frontend
```

The integration test runner creates and removes an isolated PostgreSQL schema;
it never resets the live catalog. It tests concurrent last-item reservations,
idempotent sale creation, cash and manual Interac confirmation, cancellation,
partial returns, corrections, stock adjustments, storefront/admin sharing,
authentication, filters and CSV export.
