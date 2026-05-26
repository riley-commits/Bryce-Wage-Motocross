# Bryce Wadge Motocross Training

**Live:** <https://bryce-wage-motocross.vercel.app>
**Admin:** <https://bryce-wage-motocross.vercel.app/admin/login>

Pre-order interest platform for the Bryce Wadge Motocross Training apparel brand. Customers
browse a small product catalog, add to cart, and "check out" to express interest.
No real payments are processed — Bryce contacts each customer after the ordering
window closes to arrange e-transfer or cash and to confirm delivery.

The app runs in **batches** (ordering windows). The owner opens a window from
`/admin/settings`, customers express interest, the owner closes the window and
places his wholesale order with the supplier.

---

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS v4** (CSS-first config in `app/globals.css`)
- **Supabase** — Postgres, Storage for product images, RLS-secured public data
- **Twilio** — SMS notification to Bryce when an order is submitted
- **iron-session + bcryptjs** — single-password admin auth
- **React Hook Form + Zod** — form validation (client and server)
- **Vercel** — hosting, auto-deploys from `main`

## Project layout

```
app/
  (public)/                 storefront routes: /, /product/[id], /cart, /checkout, /confirmation/[orderNumber]
  admin/
    login/                  unprotected login page
    (authed)/               protected admin shell — dashboard, products, orders, settings
  api/
    orders/                 POST — public submits interest order
    settings/public/        GET  — public-safe subset of settings
    admin/                  protected admin APIs (products CRUD, image upload, settings, auth)
components/
  ui/                       Button, Input, Pill, Card, QuantityStepper, SizePicker
  storefront/               header, footer, product card, gallery, add-to-cart form
  admin/                    settings form, product form, image manager, ordering toggle
lib/
  supabase/                 server + browser clients, image URL helper
  auth.ts                   iron-session + bcrypt
  cart.ts                   useCart hook (localStorage)
  currency.ts               cent ↔ CAD formatting
  sms.ts                    Twilio helper
  validators.ts             zod schemas + E.164 phone normalizer
proxy.ts                    Next.js 16 middleware (renamed Proxy) — gates /admin
supabase/migrations/        SQL migrations (0001_init.sql is current schema)
scripts/hash-password.ts    CLI to generate ADMIN_PASSWORD_HASH
```

---

## One-time setup

### 1. Supabase

A Supabase project (`bryce-wage-motocross`, ref `kmldjzswzrpuvlbbowqe`, region
`ca-central-1`) is already provisioned and the migration is applied. Get its
keys from <https://supabase.com/dashboard/project/kmldjzswzrpuvlbbowqe/settings/api>:

- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- Publishable key (`sb_publishable_…`) → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** key (click *Reveal*) → `SUPABASE_SERVICE_ROLE_KEY` (NEVER commit or expose to the browser)

To start a fresh project from scratch, run `supabase/migrations/0001_init.sql`
in the Supabase SQL editor.

### 2. Twilio (optional, for SMS notifications)

1. Sign in at <https://console.twilio.com>
2. Buy a Canadian phone number (E.164 format, e.g. `+12045551234`)
3. Set on Vercel:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_FROM_NUMBER`

If Twilio vars are missing, order submission still succeeds — SMS is best-effort
and never blocks the customer experience.

### 3. Admin password

The admin section is protected by a single bcrypt hash stored in env. Generate
it once:

```bash
npm run hash-password -- "your-strong-password-here"
```

Copy the output (`$2a$10$…`) into `ADMIN_PASSWORD_HASH`. Also generate a session
signing secret:

```bash
openssl rand -base64 48
```

Paste into `SESSION_SECRET`. **Never** ship a deploy with the placeholder value
from `.env.example`.

### 4. Environment variables on Vercel

All required env vars (see `.env.example`) must be configured in Vercel
under **Project Settings → Environment Variables → Production**. To inspect
or modify:

```bash
npx vercel env ls production
npx vercel env add KEY_NAME production
```

---

## Deploy workflow

The Vercel project is connected to <https://github.com/riley-commits/Bryce-Wadge-Motocross>.
**Every push to `main` auto-deploys to production.**

```bash
git push origin main
```

No manual `vercel deploy` needed for normal changes. If env vars change, redeploy
from the Vercel dashboard (Next.js bakes `NEXT_PUBLIC_*` vars at build time).

---

## Common admin tasks

### Start a new batch

1. Sign in at `/admin/login`
2. **Settings → Ordering Window**
   - Set a fresh `Batch label` (e.g. *"Fall 2026 Drop — closes Oct 20"*)
   - Toggle **Status → Open**
   - Save
3. Optionally archive last batch's products (set `Active = false`) and add new
   ones under **Products → New Product**
4. Each interest order placed during this window automatically snapshots the
   current batch label, so the dashboard's per-batch totals stay coherent
   forever — even after you change the label.

### Close a batch

Settings → **Status → Closed** → Save. The storefront immediately reflects the
closed state; the cart/checkout flow is locked out at the API level too.

### Run the supplier order

Dashboard shows "Top requested — current batch" with quantities broken down by
size. Use that to fill out the supplier order. Order history is permanent —
every order keeps its `batch_label` snapshot.

---

## Domain-level decisions worth knowing

- **Order numbers** (`BWMT-XXXX`) come from a Postgres sequence — no collisions
  under concurrent inserts, zero-padded to 4 digits, automatically rolls past
  `BWMT-9999` to `BWMT-10000`. The prefix was switched from `BWM` to `BWMT`
  in migration `0002_rename_order_prefix.sql`; existing orders keep their
  original prefix (only the column default for new inserts changes).
- **`settings.owner_phone_e164` is NEVER readable by anon clients.** Public
  reads use the `public_settings()` SECURITY DEFINER RPC, which returns only
  safe fields (`ordering_open`, `ordering_window_label`, `etransfer_email`).
- **Order inserts are double-gated** — both the API route AND the row-level
  security policy check `settings.ordering_open = true`. Even if the API is
  bypassed, the DB rejects inserts to a closed window.
- **Product images** live in a public Supabase Storage bucket
  (`product-images`). Admin uploads happen via the service role key
  (server-only), public reads come straight from the CDN URL.
- **The confirmation page does not display customer name or contact info** —
  order numbers are sequential and could be guessed, so we only show items,
  totals, and payment instructions. Customers know it's theirs because they
  just submitted it.
- **Fulfillment** is always "Bryce contacts to arrange delivery." No address
  is collected on the platform — Bryce gathers it during the follow-up call.

---

## Out of scope (won't build without explicit ask)

- Real payment processing (Stripe, etc.)
- Customer accounts / login
- Shipping cost calculation
- Email notifications (SMS only for now)
- CSV export
- Discount codes, taxes, promotions
- Multiple admin users
