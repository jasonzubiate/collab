# Collab

A lightweight micro-SaaS for Instagram brands to automate creator collaboration intake, estimate payouts, and triage proposals.

- **Public creator intake** at `/apply/[brandSlug]` — a polished, mobile-first flow where creators enter their handle, see a server-calculated payout estimate, and submit a proposal.
- **Admin dashboard** at `/admin` — review proposals by match tier (Green / Yellow / Archived) and workflow status, take actions (approve, reject, email, mark contacted, change status), export CSV, and manage campaign pricing rules.

## Tech stack

- **Next.js 16** (App Router) + **TypeScript**
- **Prisma 7** + **PostgreSQL** (Neon, via the Vercel Marketplace) using the Neon driver adapter
- **Auth.js v5 (NextAuth)** — Credentials provider, JWT sessions, route protection via `proxy.ts`
- **Tailwind CSS v4** + **Motion** (Framer Motion) for animation
- **Zod** for end-to-end validation
- **Vitest** for unit tests

## Architecture notes

- Pricing and evaluation are pure, typed, unit-tested functions in `lib/pricing/`. Payouts are always recalculated server-side; the client estimate is never trusted for persisted data.
- Enrichment is behind a `CreatorEnrichmentProvider` interface (`lib/enrichment/`) with a deterministic mock provider, so real providers (Instagram Graph, Modash, HypeAuditor) can be swapped in later.
- Money is stored in integer cents. Engagement rate and usage multipliers are `Decimal(5,2)`.
- Route handlers are thin and call service functions in `lib/services/`.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Provision the database (Neon via Vercel)

```bash
vercel login
vercel link
vercel integration add neon      # auto-provisions Neon + injects env vars
vercel env pull .env.local       # writes DATABASE_URL / DATABASE_URL_UNPOOLED
```

Then add an auth secret to `.env.local`:

```bash
echo "AUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env.local
```

See `.env.example` for all variables. If you bring your own Postgres, just set `DATABASE_URL` (and `DATABASE_URL_UNPOOLED` for migrations) in `.env.local`.

### 3. Run migrations and seed

```bash
npm run db:migrate      # creates tables (dotenv -e .env.local -- prisma migrate dev)
npm run db:seed         # brand, admin, active campaign, sample proposals
```

### 4. Start the dev server

```bash
npm run dev
```

- Admin: http://localhost:3000/admin (signin `admin@example.com` / `password123`)
- Creator intake: http://localhost:3000/apply/example-studio

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run test` | Run Vitest unit tests |
| `npm run db:migrate` | Run Prisma migrations (dev) |
| `npm run db:deploy` | Apply migrations (prod/CI) |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |

## Project structure

```
app/
  (public)/apply/[brandSlug]/   Public creator intake
  (auth)/brand/signin/           Brand signin
  (auth)/brand/signup/           Brand signup
  (auth)/creator/signin/         Creator signin
  (auth)/creator/signup/         Creator signup
  (auth)/login/                  Legacy redirect to brand signin
  admin/                        Authenticated dashboard (proposals, campaigns)
  api/public/                   Intake routes (start, estimate, submit)
  api/admin/                    Campaign + proposal admin routes
components/intake/              Creator intake UI
components/admin/               Admin dashboard UI
components/ui/                  Shared primitives
lib/pricing/                    Pure pricing + evaluation (unit tested)
lib/enrichment/                 Provider interface + mock provider
lib/services/                   DB-backed service functions
lib/validation/                 Zod schemas
lib/csv/                        CSV export (formula-injection safe)
prisma/                         Schema + seed
auth.ts, auth.config.ts         Auth.js setup
proxy.ts                        Route protection (Next.js 16 proxy)
```

## Testing

```bash
npm run test
```

Covers payout calculation (usage multipliers, rounding, zero deliverables) and proposal evaluation (gatekeeper thresholds, Green/Yellow/Archived tiering).
