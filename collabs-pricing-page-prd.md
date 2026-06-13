# Product Requirements Document: Collab — Pricing Page

**Document ID:** `collabs-pricing-page-prd.md`  
**Status:** Draft for implementation  
**Depends on:** [`collabs-prd.md`](./collabs-prd.md) (product positioning, brand admin flows)  
**Last updated:** 2026-06-12

---

## 1. Purpose of this document

Collab has no public pricing surface today. The dashboard account menu links to `/pricing`, but that route does not exist. **This PRD defines the marketing pricing page** — a static, conversion-focused page that presents two subscription tiers (**Pro** and **Team**) to brand buyers.

**Product intent:** Give prospective and signed-in brand admins a clear, trustworthy answer to “what does Collab cost?” without implementing billing, Stripe, or entitlement enforcement in this slice.

**Buyer in scope:** Brand admins only. Creators never pay; the page should not pitch creator accounts.

**Explicit non-goals for this slice**

- Stripe Checkout, Customer Portal, or webhooks  
- Subscription records in the database  
- Plan-based feature gating or usage metering  
- Annual/monthly billing toggle with live price IDs  
- Sales-assisted “Contact us” enterprise tier  
- A/B testing or analytics instrumentation beyond basic page metadata  
- In-app upgrade flows from `/admin`

Billing integration is a **follow-on slice** once copy and tier structure are validated on the marketing page.

---

## 2. Problem and opportunity

### Problem today

| Surface | Current behavior | Buyer perception |
| --- | --- | --- |
| Homepage hero | Single CTA (“Get started” / “Go to dashboard”) | No price anchor before signup |
| Dashboard menu | “Pricing” navigates to `/pricing` | Broken link / 404 |
| Competitive set | ManyChat, spreadsheets, manual DMs | Unclear where Collab sits on cost vs. value |

### Opportunity

Collab’s positioning is **lightweight gatekeeper + pricing assistant**, not enterprise influencer CRM. A two-tier page (Pro + Team) reinforces focus: solo operator vs. small marketing team. Transparent limits (seats, proposals, campaigns) set expectations before signup and reduce support churn later.

### Success criteria

1. `/pricing` renders a polished marketing page consistent with the homepage design system.  
2. Two plan cards — **Pro** and **Team** — display price, positioning line, feature list, and CTA.  
3. Homepage hero includes a secondary **View plans** CTA linking to `/pricing`.  
4. Page is mobile-first, accessible, and requires no client-side JavaScript for core content.  
5. Signed-in brand users see contextual CTAs (e.g. “Go to dashboard”); signed-out users see “Get started” → `/brand/signup`.  
6. All plan copy and limits are sourced from a single typed config file so billing can reuse the same constants later.

---

## 3. Tier structure (v1 copy)

Two tiers only. No free plan. Trial language is **marketing copy only** until billing ships.

### Pro — solo operator

**Positioning:** *“I run creator collabs myself.”*

| Attribute | Value (v1 placeholder) |
| --- | --- |
| **Price** | $59 / month |
| **Seats** | 1 |
| **Active campaigns** | 1 |
| **Proposals / month** | 75 |
| **Channels** | Branded web intake + Instagram DM automation |
| **Triage** | Green / Yellow / Archived workflow |
| **Export** | CSV export |
| **Support** | Email support |

### Team — shared pipeline

**Positioning:** *“Our marketing team shares one creator pipeline.”*

| Attribute | Value (v1 placeholder) |
| --- | --- |
| **Price** | $149 / month |
| **Seats** | 5 |
| **Active campaigns** | 3 |
| **Proposals / month** | 300 (display as “300+” or “Unlimited*” with fair-use footnote — pick one in implementation) |
| **Collaboration** | Roles (Owner, Member, Viewer), assignment, shared notes, activity log |
| **Admin power** | Bulk approve / reject / export, teammate notifications |
| **Everything in Pro** | ✓ |
| **Support** | Priority email support |

**Recommended badge:** Mark **Team** as “Most popular” only if analytics later support it; for v1, mark **Pro** as “Best for getting started” and leave Team unbadged, **or** badge Team as “For growing teams” — avoid two badges.

### Shared across both tiers (never gate in copy)

These are core product identity and must appear on **both** cards or in a shared “Included in every plan” section:

- Deterministic payout estimates from your pricing rules  
- Auto-vetting on follower and engagement thresholds  
- Branded intake link (`/apply/[brandSlug]`)  
- Instagram DM intake (same pipeline as web)  
- Proposal triage dashboard  

### Trial and billing footnotes (copy only)

- “14-day free trial on all plans” (honor when Stripe ships; display now for GTM consistency)  
- “Cancel anytime”  
- “Prices in USD. Billed monthly.”  
- Optional fair-use asterisk if Team shows “300+” proposals  

---

## 4. Page information architecture

Route: **`/pricing`**

Reuse the marketing shell from [`app/privacy/page.tsx`](./app/privacy/page.tsx):

- `LandingNav` (session-aware `dashboardHref`)  
- Main content  
- `SiteFooter`

### Section order

| # | Section | Purpose |
| --- | --- | --- |
| 1 | **Page hero** | Headline + subcopy; anchor value before price |
| 2 | **Plan cards** | Pro + Team side-by-side (stack on mobile) |
| 3 | **Comparison table** | Scannable feature matrix (optional on mobile: collapsible or cards-only) |
| 4 | **FAQ** | 5–7 objections (trial, creators, DM setup, switching plans, limits) |
| 5 | **Final CTA** | Reuse `FinalCta` or a slim variant |

### Page hero copy (draft)

- **Headline:** “Simple pricing for smarter creator collabs”  
- **Subcopy:** “Two plans. No enterprise bloat. Pick the seat count and volume that match how your team runs Instagram partnerships.”

### FAQ topics (minimum)

1. Is there a free plan?  
2. Do creators pay?  
3. What counts as a proposal toward my monthly limit?  
4. Can I connect Instagram DMs on Pro?  
5. What happens if I exceed my proposal limit?  
6. Can I switch between Pro and Team later?  
7. How does the free trial work?

Draft answers should align with tier table in §3 and defer enforcement language (“we’ll notify you before blocking submissions”) until billing exists.

---

## 5. Component architecture

### New files

```
app/pricing/page.tsx              # Server component; metadata + layout shell
components/marketing/PricingHero.tsx
components/marketing/PricingPlans.tsx
components/marketing/PricingComparison.tsx   # optional for v1 if cards are sufficient
components/marketing/PricingFaq.tsx
lib/marketing/plans.ts            # Single source of truth for tiers, limits, CTAs
```

### `lib/marketing/plans.ts`

Export typed plan definitions consumed by all pricing components:

```ts
export type PlanId = "pro" | "team";

export type PlanDefinition = {
  id: PlanId;
  name: string;
  tagline: string;
  priceMonthlyCents: number;
  seats: number;
  activeCampaigns: number;
  proposalsPerMonth: number | "fair_use_unlimited";
  features: string[];       // bullet list for card
  highlighted?: boolean;    // optional card emphasis
  badge?: string;           // e.g. "Best for getting started"
};

export const PLANS: PlanDefinition[] = [ /* pro, team */ ];
```

Use `formatCents` or a small `formatPlanPrice(cents)` helper for display. Apply `tabular-nums` on price elements to prevent layout shift.

### Plan card CTA behavior

| Session state | CTA label | Href |
| --- | --- | --- |
| No session | Get started | `/brand/signup` |
| Brand user | Go to dashboard | `/admin` (or `dashboardPath("BRAND")`) |
| Creator user | View plans N/A — creators don’t buy | Hide plan CTAs or show “For brands” note; nav still works |

For v1, **both plan buttons route to the same href** (signup or dashboard). Per-plan checkout URLs come with Stripe.

### Existing component updates

| File | Change |
| --- | --- |
| [`components/marketing/Hero.tsx`](./components/marketing/Hero.tsx) | Add secondary CTA **View plans** → `/pricing` |
| [`components/marketing/SiteFooter.tsx`](./components/marketing/SiteFooter.tsx) | Add “Pricing” under “For brands” links (recommended) |
| [`app/page.tsx`](./app/page.tsx) | No change required if Hero owns secondary CTA |

---

## 6. Visual and UX spec

Follow existing marketing patterns ([`Hero`](./components/marketing/Hero.tsx), [`HowItWorks`](./components/marketing/HowItWorks.tsx), [`BeforeAfter`](./components/marketing/BeforeAfter.tsx)) and design-engineering checklist.

### Layout

- `max-w-5xl` content width, `px-4 sm:px-6` horizontal padding  
- Plan cards: `grid gap-6 md:grid-cols-2`  
- Card surface: `rounded-2xl border border-border bg-surface p-7` (match HowItWorks cards)  
- Highlighted plan (if any): `ring-2 ring-primary` or `border-primary` — no layout shift on hover  

### Typography

- Display headings: `font-display`, `tracking-tighter`, `text-balance`  
- Section labels: `font-mono text-xs uppercase tracking-wide text-muted-foreground`  
- Price: large display numeral + `/mo` suffix in muted text  

### Buttons

- Primary plan CTA: `rounded-full bg-zinc-950 … uppercase font-mono` (same as homepage)  
- Hero secondary CTA (homepage): outline on `bg-primary` — `ring-1 ring-zinc-950/20 bg-white/70 hover:bg-white`  
- Minimum tap target: `h-13` (44px+)  

### Motion

- No scroll-driven animations  
- Optional: subtle `transition-colors` on buttons and FAQ disclosure  
- Respect `prefers-reduced-motion`  

### Accessibility

- Plan cards: use `<section aria-labelledby={plan-id}>`  
- FAQ: native `<details>` / `<summary>` or a single-accordions pattern with proper `aria-expanded`  
- Price announced clearly: “59 dollars per month” in visible text, not icon-only  
- Focus rings on all interactive elements  

---

## 7. SEO and metadata

```ts
export const metadata: Metadata = {
  title: "Pricing | Collab",
  description:
    "Collab Pro and Team plans for Instagram brands. Automate creator intake, DM triage, and upfront payout estimates.",
};
```

Add canonical `/pricing` via existing site metadata patterns if present.

---

## 8. Phased implementation plan

### Phase A — Marketing page (this PRD)

- [ ] `lib/marketing/plans.ts` with Pro + Team definitions  
- [ ] `app/pricing/page.tsx` with shell + metadata  
- [ ] `PricingHero`, `PricingPlans`, `PricingFaq` components  
- [ ] Homepage `Hero` secondary CTA  
- [ ] Footer link to `/pricing`  
- [ ] Manual QA: mobile, keyboard, signed-in / signed-out states  

### Phase B — Billing (separate PRD)

- Stripe products/prices matching `PlanId`  
- `Brand.subscription` fields + webhook handlers  
- Entitlement checks for seats, campaigns, proposal volume  
- Dashboard upgrade CTA and trial state  

### Phase C — Polish (fast-follow)

- Annual billing toggle (list prices in config)  
- Comparison table if card bullets are insufficient  
- `PricingComparison` component  
- Testimonials or logo strip (if available)  

---

## 9. Acceptance criteria

The pricing page slice is complete when:

- [ ] `GET /pricing` returns 200 with Pro and Team cards and FAQ.  
- [ ] Plan limits and prices match `lib/marketing/plans.ts` (no duplicated magic numbers in JSX).  
- [ ] Homepage hero shows primary CTA + **View plans** linking to `/pricing`.  
- [ ] Dashboard account menu → Pricing no longer 404s.  
- [ ] Page matches marketing visual language (display font, mono labels, rounded cards, primary accent).  
- [ ] Responsive at 320px / 768px / 1280px without horizontal scroll.  
- [ ] Lighthouse accessibility score ≥ 90 on `/pricing` (manual spot-check acceptable for MVP).  
- [ ] No Stripe secrets or env vars required to ship Phase A.  

---

## 10. Copy deck (ready for implementation)

### Pro card

- **Name:** Pro  
- **Tagline:** Run your entire creator pipeline solo.  
- **Bullets:**  
  - 1 seat  
  - 1 active campaign  
  - 75 proposals per month  
  - Web intake + Instagram DMs  
  - Auto-vetting and upfront payout estimates  
  - CSV export  

### Team card

- **Name:** Team  
- **Tagline:** Share triage, notes, and approvals across your marketing team.  
- **Bullets:**  
  - 5 seats with roles  
  - 3 active campaigns  
  - 300+ proposals per month  
  - Assignment and shared notes  
  - Bulk actions and teammate notifications  
  - Everything in Pro  
  - Priority support  

### Final CTA (reuse)

- **Headline:** Stop chasing creators. Start closing collabs.  
- **Button:** Same session-aware primary as homepage (`Get started` / `Go to dashboard`)

---

## 11. Open questions (resolve before Phase B billing)

| # | Question | Default for Phase A |
| --- | --- | --- |
| 1 | Exact Pro/Team price points | $59 / $149 as placeholders |
| 2 | Team proposal limit copy | “300+ proposals / month” |
| 3 | Highlight which plan visually | Neither required; optional “Best for getting started” on Pro |
| 4 | Annual pricing display | Omit until Phase C |
| 5 | Creator signed-in UX on `/pricing` | Show page normally; plan CTAs still point to brand signup |

---

## 12. Key build principles

- **Single source of truth:** `lib/marketing/plans.ts` feeds cards, FAQ, and future Stripe mapping.  
- **Static-first:** Server Components; no pricing API for Phase A.  
- **Honest scope:** Page sells plans that exist in product vision; mark collaboration features as Team-only only when Phase B entitlements ship **or** label them “coming soon” if not built — prefer honest labels over overpromising.  
- **Brand-only GTM:** Creators are not a monetization audience; keep CTAs pointed at `/brand/signup`.  
- **Match the homepage:** Pricing should feel like the next scroll section of the landing page, not a separate design system.
