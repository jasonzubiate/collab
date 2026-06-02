# Product Requirements Document: Collab

## 1. Cursor Implementation Brief

Build a Next.js micro-SaaS MVP that helps Instagram brands automate creator collaboration intake, estimate creator payouts, and triage proposals into actionable admin workflows.

The product serves brands with roughly 20,000 to 250,000 Instagram followers. These brands receive inbound creator collaboration requests but do not yet need a heavy enterprise influencer marketing platform. The MVP should feel polished, fast, and focused: one admin user configures campaign pricing rules, creators complete a premium interactive intake flow, and the backend calculates suggested payouts and routes proposals into clear review tiers.

This PRD is optimized for Cursor AI coding agents. Implement the app with strongly typed, maintainable Next.js, TypeScript, Prisma, PostgreSQL, Tailwind CSS, and Framer Motion.

## 2. Product Summary

### Product Name

Collab

### Core Jobs

- Give brands a configurable intake link for creator collaboration requests.
- Let creators enter their Instagram handle, contact details, and requested campaign scope.
- Show creators an estimated payout before they submit.
- Enrich creator profiles through a mock provider for MVP, with a clean path to future APIs such as Instagram Graph API, Modash, HypeAuditor, or similar providers.
- Calculate a suggested payout using brand-defined pricing rules.
- Route proposals into Green, Yellow, or Archived tiers.
- Give the admin tools to approve, reject, email, export, mark contacted, and manually change proposal status.

### MVP Positioning

This is not a full influencer CRM. It is a lightweight gatekeeper and pricing assistant for brands that want a better alternative to manual DMs, spreadsheets, and ad hoc negotiation.

## 3. Goals and Non-Goals

### Goals

- Create a secure authenticated admin dashboard for one brand admin.
- Support many campaigns per brand, with exactly one active campaign at a time.
- Provide a public creator intake page for the active campaign.
- Estimate creator payout before final submission.
- Store proposal data, enriched public metrics, requested scope, calculated payout, and admin workflow state.
- Provide admin proposal actions: approve, reject, email creator, export CSV, mark contacted, and change status.
- Keep future enrichment provider integrations modular.

### Non-Goals for MVP

- Multi-admin teams or role-based permissions.
- Real Instagram OAuth or live profile scraping.
- Automated payout transfer.
- Multi-brand agency workspaces.
- Automated counter-offer generation.
- Full email campaign automation.

**Post-MVP (implemented):** Dual entry website, brand self-service signup, creator accounts (Instagram OAuth + email magic link), and creator dashboard for proposal status and brand reply visibility. See §7.8–§7.10.

## 4. End Users

### Brand Admin

The brand admin configures campaign requirements and pricing rules, reviews incoming creator proposals, and takes workflow actions. Brands sign up at `/brand/signup` and signin at `/brand/signin`.

Primary needs:

- Set minimum creator quality thresholds.
- Set deliverable-based pricing rules.
- Create many campaigns and choose one active campaign.
- Review proposals quickly by status.
- Contact, approve, reject, export, or update proposals.

### Creator

Creators can submit proposals without an account via the public intake link (`/apply/[brandSlug]`) or Instagram DMs. Creators who create an account at `/creator/signup` can signin at `/creator/signin` (Instagram OAuth preferred, email magic link fallback) and view linked proposals at `/creator/requests`.

Primary needs:

- Understand whether they are eligible without friction.
- Build a campaign scope using tactile controls.
- See an estimated payout before submitting.
- Complete the request quickly on mobile.
- **(Account holders)** Track proposal status and brand replies across submissions.

## 5. Recommended Tech Stack

- Framework: Next.js App Router with TypeScript
- Styling: Tailwind CSS
- Animation: Framer Motion
- Database: PostgreSQL
- ORM: Prisma
- Auth: Auth.js / NextAuth with `UserType` (`BRAND` | `CREATOR`) in JWT session
- Validation: Zod
- Forms: React Hook Form where useful
- Testing: Vitest for unit tests, Playwright for critical flow tests
- Email MVP: `mailto:` links or logged email intents
- Email future: Resend, Postmark, SendGrid, or similar provider
- CSV export: Server route that streams or returns CSV

## 6. High-Level Architecture

### Frontend

- Marketing homepage at `/` with separate entry paths for brands and creators.
- Public creator intake experience under `/apply/[brandSlug]`.
- Authenticated brand dashboard under `/admin`.
- Brand signin and signup under `/brand/signin` and `/brand/signup` (`/login` redirects to brand signin).
- Creator signin and signup under `/creator/signin` and `/creator/signup`.
- Creator dashboard under `/creator/requests` and `/creator/settings`.
- Reusable components for sliders, usage rights selector, proposal table, status tabs, campaign settings, and action menus.

### Backend

- Next.js Route Handlers under `app/api`.
- Server-side validation with Zod for all API payloads.
- Prisma services for campaign, proposal, pricing, enrichment, and admin actions.
- Pricing calculation lives in a pure TypeScript helper with unit tests.
- Enrichment lives behind a provider interface so mock enrichment can be replaced later.

### Data Layer

- PostgreSQL stores brands, admin users, campaigns, proposal drafts, proposals, and proposal action history.
- Money should be stored in integer cents to avoid floating-point currency drift.
- Percentages and multipliers can be stored as decimals or integer basis points. For simplicity, the schema below uses `Decimal` for percentages and multipliers.

## 7. Core User Flows

### 7.1 Brand Signin

1. Brand admin visits `/brand/signin` (legacy `/login` and `/brand/login` redirect here).
2. Admin enters email and password.
3. On success, admin is redirected to `/admin/proposals`.
4. Unauthenticated visits to `/admin/*` redirect to `/brand/signin`.
5. Authenticated creators attempting `/admin/*` redirect to `/creator/requests`.

Acceptance criteria:

- Admin routes require `userType === BRAND` and a valid `brandId`.
- Public intake routes do not require signin.
- Invalid signin attempts return clear errors without exposing sensitive details.

### 7.2 Brand Sign Up

1. Brand visits `/brand/signup` from the marketing homepage.
2. Brand enters name, work email, password, and company name.
3. System creates `Brand` + `User` (`userType: BRAND`) in one transaction with a unique slug.
4. Brand is signed in and redirected to `/admin/campaigns?onboarding=1`.

Acceptance criteria:

- Duplicate emails are rejected.
- New brands land on campaign onboarding empty state.

### 7.3 Creator Signin / Signup

1. Creator visits `/creator/signin` or `/creator/signup`.
2. **Primary:** Creator authorizes via Instagram OAuth (`/api/auth/creator/instagram`).
3. **Fallback:** Creator enters email and receives a magic link (`/api/auth/creator/verify`).
4. On success, creator is redirected to `/creator/requests`.
5. System links existing `Proposal` rows by email, Instagram scoped user ID, or normalized handle.

Acceptance criteria:

- Creator routes require `userType === CREATOR`.
- Authenticated brands attempting `/creator/*` redirect to `/admin/proposals`.
- Magic links expire after 15 minutes; session handoff tokens expire after 5 minutes.

### 7.4 Campaign Management

1. Admin opens `/admin/campaigns`.
2. Admin creates or edits campaigns.
3. Admin configures:
   - Campaign name
   - Public slug
   - Active state
   - Minimum follower threshold
   - Minimum engagement rate
   - Base rate per 10,000 followers
   - Rate per reel
   - Rate per story
   - 30-day usage rights multiplier
   - 90-day usage rights multiplier
4. Admin sets one campaign as active.
5. The system deactivates any previously active campaign for that brand.

Acceptance criteria:

- A brand can have many campaigns.
- Only one campaign can be active at a time.
- Public intake uses the active campaign.
- Inactive campaigns are not available for new creator submissions.

### 7.5 Creator Intake and Estimate

1. Creator visits `/apply/[brandSlug]`.
2. App loads the brand's active campaign.
3. Creator enters:
   - Instagram handle
   - Name
   - Email
4. Creator clicks Continue.
5. Backend calls the mock enrichment provider and creates a `ProposalDraft`.
6. Backend returns draft ID, enriched metrics, gatekeeper result, and initial state.
7. If the creator fails thresholds, show a polished "not a fit right now" message and allow final submission only if the brand wants archived records. Default MVP behavior: save final archived proposal only if creator clicks submit after seeing the message.
8. If the creator passes thresholds, creator proceeds to the Scope Builder.
9. Creator selects:
   - Reels count from 0 to 5
   - Stories count from 0 to 5
   - Usage rights: none, 30 days paid ads, or 90 days paid ads
10. As scope changes, the app requests or computes a server-backed estimate and displays the estimated payout.
11. Creator clicks Submit Proposal.
12. Backend creates the final `Proposal`, using the same enriched metrics from the draft.
13. Creator sees a confirmation screen.

Acceptance criteria:

- The estimated payout is visible before submit.
- The final payout saved on submit matches the last server-authoritative estimate.
- Refreshing or changing scope does not silently change enriched metrics.
- Mobile layout remains usable and polished.

### 7.6 Proposal Review

1. Admin opens `/admin/proposals`.
2. Admin sees primary match tier tabs:
   - Green
   - Yellow
   - Archived
3. Admin can also filter by workflow status:
   - New
   - Contacted
   - Approved
   - Rejected
4. Admin can search/filter by handle, campaign, email, status, and date.
5. Admin can open a proposal detail drawer or page.
6. Admin can take actions:
   - Approve
   - Reject
   - Email creator
   - Mark contacted
   - Change status manually
   - Export proposals to CSV

Acceptance criteria:

- Every admin action is persisted.
- Approval and rejection update workflow status without losing match tier.
- Email creator action can open `mailto:` in MVP and should log an action event.
- CSV export includes creator info, metrics, scope, calculated payout, tier, workflow status, and timestamps.

## 8. Data Model

Use this as the target Prisma schema direction. Cursor may adapt exact relation names, but the concepts and fields should remain intact.

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  name         String?
  passwordHash String?
  brandId      String
  brand        Brand    @relation(fields: [brandId], references: [id])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Brand {
  id                    String     @id @default(uuid())
  companyName           String
  slug                  String     @unique
  instagramBusinessId   String?    @unique
  users                 User[]
  campaigns             Campaign[]
  createdAt             DateTime   @default(now())
  updatedAt             DateTime   @updatedAt
}

model Campaign {
  id                       String         @id @default(uuid())
  brandId                  String
  brand                    Brand          @relation(fields: [brandId], references: [id])
  name                     String
  slug                     String
  isActive                 Boolean        @default(false)

  minFollowers             Int
  minEngagementRate        Decimal        @db.Decimal(5, 2)

  baseRatePer10kCents      Int
  ratePerReelCents         Int
  ratePerStoryCents        Int
  adUsage30DayMultiplier   Decimal        @db.Decimal(5, 2)
  adUsage90DayMultiplier   Decimal        @db.Decimal(5, 2)

  proposalDrafts           ProposalDraft[]
  proposals                Proposal[]
  createdAt                DateTime       @default(now())
  updatedAt                DateTime       @updatedAt

  @@unique([brandId, slug])
}

model ProposalDraft {
  id                  String      @id @default(uuid())
  campaignId          String
  campaign            Campaign    @relation(fields: [campaignId], references: [id])

  creatorHandle       String
  creatorName         String?
  creatorEmail        String

  followerCount       Int
  engagementRate      Decimal     @db.Decimal(5, 2)
  enrichmentProvider  String      @default("mock")
  enrichmentPayload   Json?

  expiresAt           DateTime
  createdAt           DateTime    @default(now())
}

model Proposal {
  id                    String          @id @default(uuid())
  campaignId            String
  campaign              Campaign        @relation(fields: [campaignId], references: [id])

  creatorHandle         String
  creatorName           String?
  creatorEmail          String

  followerCount         Int
  engagementRate        Decimal         @db.Decimal(5, 2)
  enrichmentProvider    String          @default("mock")
  enrichmentPayload     Json?

  reelsCount            Int
  storiesCount          Int
  adUsageDays           Int

  calculatedPayoutCents Int
  matchTier             MatchTier
  workflowStatus        WorkflowStatus  @default(NEW)

  contactedAt           DateTime?
  approvedAt            DateTime?
  rejectedAt            DateTime?
  adminNotes            String?

  events                ProposalEvent[]
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt
}

model ProposalEvent {
  id          String          @id @default(uuid())
  proposalId  String
  proposal    Proposal        @relation(fields: [proposalId], references: [id])
  type        ProposalEventType
  metadata    Json?
  createdAt   DateTime        @default(now())
}

enum MatchTier {
  GREEN
  YELLOW
  ARCHIVED
}

enum WorkflowStatus {
  NEW
  CONTACTED
  APPROVED
  REJECTED
}

enum ProposalEventType {
  CREATED
  CONTACTED
  APPROVED
  REJECTED
  STATUS_CHANGED
  EMAIL_OPENED
  EXPORTED
}
```

Implementation note:

- Enforce one active campaign per brand in a transaction when setting `isActive = true`.
- Optionally add a PostgreSQL partial unique index in a migration for `brandId WHERE isActive = true`.

## 9. Pricing and Evaluation Logic

### Inputs

```ts
type UsageDays = 0 | 30 | 90;

type CampaignPricing = {
  minFollowers: number;
  minEngagementRate: number;
  baseRatePer10kCents: number;
  ratePerReelCents: number;
  ratePerStoryCents: number;
  adUsage30DayMultiplier: number;
  adUsage90DayMultiplier: number;
};

type CreatorMetrics = {
  followerCount: number;
  engagementRate: number;
};

type RequestedScope = {
  reelsCount: number;
  storiesCount: number;
  adUsageDays: UsageDays;
};
```

### Gatekeeper Logic

If `followerCount < minFollowers` or `engagementRate < minEngagementRate`, assign:

```ts
matchTier = "ARCHIVED";
```

Archived proposals should still be storable so the brand can audit inbound demand, but they should not be presented as qualified opportunities.

### Payout Formula

Use integer cents for all money calculations.

```ts
baseCreatorRate =
  (followerCount / 10000) * baseRatePer10kCents;

deliverableRate =
  reelsCount * ratePerReelCents +
  storiesCount * ratePerStoryCents;

preUsageTotal =
  baseCreatorRate + deliverableRate;

if adUsageDays === 30:
  calculatedPayout = preUsageTotal * adUsage30DayMultiplier

if adUsageDays === 90:
  calculatedPayout = preUsageTotal * adUsage90DayMultiplier

if adUsageDays === 0:
  calculatedPayout = preUsageTotal
```

Round to the nearest cent at the final calculation boundary.

### Match Tier Logic

For MVP:

- `ARCHIVED`: failed follower or engagement threshold.
- `GREEN`: passed thresholds and `engagementRate >= 3.5`.
- `YELLOW`: passed thresholds and `engagementRate < 3.5`.

The app recommends a suggested payout only. It does not generate or optimize counter-offer language in the MVP.

## 10. Enrichment Provider Design

Create a provider interface now, even though the MVP uses mock data.

```ts
export type EnrichedCreatorProfile = {
  handle: string;
  followerCount: number;
  engagementRate: number;
  provider: "mock" | "instagram_graph" | "modash" | "hypeauditor";
  raw?: unknown;
};

export interface CreatorEnrichmentProvider {
  enrich(handle: string): Promise<EnrichedCreatorProfile>;
}
```

### Mock Provider Requirements

The mock provider should return realistic random public metrics:

- `followerCount`: integer from 2,000 to 150,000
- `engagementRate`: float from 0.5 to 6.0
- `provider`: `mock`

For local testing, optionally make mock output deterministic by hashing the handle. This is preferable because the estimate and final proposal remain predictable across repeated tests.

## 11. API Routes

### Public Intake Routes

#### `GET /api/public/brands/[brandSlug]/active-campaign`

Returns public campaign metadata needed to render the intake page.

Do not expose all admin settings unless required. It is acceptable to expose safe display fields only and keep pricing calculation server-side.

#### `POST /api/public/proposals/start`

Starts an intake draft.

Request:

```json
{
  "brandSlug": "example-brand",
  "creatorHandle": "creatorhandle",
  "creatorName": "Creator Name",
  "creatorEmail": "creator@example.com"
}
```

Behavior:

- Validate handle and email.
- Load active campaign by brand slug.
- Enrich creator profile.
- Create `ProposalDraft` with an expiration time.
- Return draft ID, metrics, and gatekeeper status.

#### `POST /api/public/proposals/estimate`

Calculates a server-authoritative estimated payout for a draft and requested scope.

Request:

```json
{
  "draftId": "uuid",
  "scope": {
    "reelsCount": 2,
    "storiesCount": 3,
    "adUsageDays": 30
  }
}
```

Response:

```json
{
  "calculatedPayoutCents": 85000,
  "formattedPayout": "$850.00",
  "matchTier": "GREEN"
}
```

#### `POST /api/public/proposals/submit`

Creates the final proposal from a draft.

Request:

```json
{
  "draftId": "uuid",
  "scope": {
    "reelsCount": 2,
    "storiesCount": 3,
    "adUsageDays": 30
  }
}
```

Behavior:

- Validate draft exists and is not expired.
- Load campaign pricing.
- Recalculate payout server-side.
- Create final proposal.
- Create `ProposalEvent` with type `CREATED`.
- Return confirmation and final calculated payout.

### Admin Routes

#### `GET /api/admin/campaigns`

List campaigns for the authenticated admin's brand.

#### `POST /api/admin/campaigns`

Create campaign.

#### `PATCH /api/admin/campaigns/[campaignId]`

Update campaign fields.

#### `POST /api/admin/campaigns/[campaignId]/activate`

Set this campaign as active and deactivate all other campaigns for the brand in a transaction.

#### `GET /api/admin/proposals`

List proposals with filters:

- `matchTier`
- `workflowStatus`
- `campaignId`
- `q`
- `from`
- `to`

#### `PATCH /api/admin/proposals/[proposalId]`

Update admin editable fields such as `workflowStatus`, `matchTier`, and `adminNotes`.

#### `POST /api/admin/proposals/[proposalId]/approve`

Set `workflowStatus = APPROVED`, set `approvedAt`, and create event.

#### `POST /api/admin/proposals/[proposalId]/reject`

Set `workflowStatus = REJECTED`, set `rejectedAt`, and create event.

#### `POST /api/admin/proposals/[proposalId]/mark-contacted`

Set `workflowStatus = CONTACTED`, set `contactedAt`, and create event.

#### `POST /api/admin/proposals/[proposalId]/email`

MVP behavior:

- Return a `mailto:` URL and create an `EMAIL_OPENED` event.

Future behavior:

- Send email through a provider and store message metadata.

#### `GET /api/admin/proposals/export`

Export filtered proposals as CSV.

## 12. Pages and Components

### Public Pages

#### `/apply/[brandSlug]`

Public creator intake page.

Required sections:

- Handle/contact step
- Enrichment loading state
- Eligibility state
- Scope Builder
- Estimated payout display
- Submit confirmation

Design direction:

- Premium and tactile
- Mobile-first
- Smooth Framer Motion transitions
- Minimal copy
- Clear progress between steps
- No marketing landing page before the actual intake flow

### Admin Pages

#### `/brand/signin`

Brand authentication page. Legacy `/login` redirects here.

#### `/brand/signup`

Brand registration page.

#### `/admin/proposals`

Main dashboard view.

Required UI:

- Match tier tabs
- Workflow status filters
- Search/filter controls
- Proposal table
- Proposal detail drawer or page
- Action menu for approve, reject, email, mark contacted, change status
- CSV export button

#### `/admin/campaigns`

Campaign management page.

Required UI:

- Campaign list
- Active campaign indicator
- Create/edit campaign form
- Pricing controls
- Threshold controls
- Activate campaign action

### Recommended Components

- `CreatorIntakeForm`
- `CreatorHandleStep`
- `ScopeBuilder`
- `DeliverableSlider`
- `UsageRightsSelector`
- `EstimatedPayoutPanel`
- `CampaignSettingsForm`
- `ProposalTabs`
- `ProposalTable`
- `ProposalDetailDrawer`
- `ProposalActionMenu`
- `StatusBadge`
- `CurrencyInput`

## 13. UI Requirements

### Creator Intake UI

- Use Framer Motion for transitions between handle/contact step, loading state, scope builder, and confirmation.
- Reels slider range: 0 to 5.
- Stories slider range: 0 to 5.
- Usage rights selector:
  - No Ad Usage: `0`
  - 30 Days Paid Ads: `30`
  - 90 Days Paid Ads: `90`
- Estimated payout must be visually prominent.
- Submit button should be disabled while estimate is loading or invalid.
- Handle keyboard, focus, loading, and error states.

### Admin UI

- Prioritize scanability over decorative layout.
- Use compact tables, filters, tabs, and badges.
- Do not hide key proposal actions behind unclear icons only.
- Show payout in dollars.
- Show engagement rate as percent.
- Show follower count with compact formatting.

## 14. Validation Rules

### Creator Start

- `creatorHandle`: required, strip leading `@`, allow letters, numbers, periods, and underscores.
- `creatorEmail`: required valid email.
- `creatorName`: optional, max 120 chars.

### Scope

- `reelsCount`: integer 0 to 5.
- `storiesCount`: integer 0 to 5.
- `adUsageDays`: must be `0`, `30`, or `90`.
- At least one deliverable should be selected before submit, unless the brand explicitly allows zero-deliverable inquiries. Default: require at least one reel or story.

### Campaign

- `minFollowers`: integer >= 0.
- `minEngagementRate`: decimal >= 0.
- Money fields: integer cents >= 0.
- Usage multipliers:
  - 30-day multiplier >= 1.0
  - 90-day multiplier >= 1.0
  - 90-day multiplier should be >= 30-day multiplier.

## 15. Auth and Security

- Protect all `/admin/*` pages and `/api/admin/*` routes.
- Public routes must only expose data needed for intake.
- Never trust client-calculated payout.
- Always recalculate estimate and final proposal server-side.
- Use Zod validation on every API route.
- Rate limit public proposal start and submit routes in future. MVP can include a simple in-memory or middleware placeholder.
- Sanitize exported CSV values to avoid spreadsheet formula injection.
- Store passwords hashed if credentials auth is used.

## 16. Suggested File Structure

```txt
app/
  (public)/
    apply/[brandSlug]/page.tsx
  (auth)/
    login/page.tsx
  admin/
    layout.tsx
    proposals/page.tsx
    campaigns/page.tsx
  api/
    public/
      brands/[brandSlug]/active-campaign/route.ts
      proposals/start/route.ts
      proposals/estimate/route.ts
      proposals/submit/route.ts
    admin/
      campaigns/route.ts
      campaigns/[campaignId]/route.ts
      campaigns/[campaignId]/activate/route.ts
      proposals/route.ts
      proposals/[proposalId]/route.ts
      proposals/[proposalId]/approve/route.ts
      proposals/[proposalId]/reject/route.ts
      proposals/[proposalId]/mark-contacted/route.ts
      proposals/[proposalId]/email/route.ts
      proposals/export/route.ts

components/
  admin/
  intake/
  ui/

lib/
  auth.ts
  prisma.ts
  pricing/
    calculateProposalPayout.ts
    evaluateProposal.ts
  enrichment/
    types.ts
    mockProvider.ts
    index.ts
  validation/
    campaignSchemas.ts
    proposalSchemas.ts
  csv/
    exportProposals.ts

prisma/
  schema.prisma
  seed.ts
```

## 17. Implementation Phases

### Phase 1: Project Foundation

- Initialize Next.js app with TypeScript, Tailwind, Prisma, PostgreSQL, and Auth.js.
- Add Prisma schema and migrations.
- Add seed data for one brand, one admin, and one active campaign.
- Create shared Prisma client and auth helpers.

### Phase 2: Pricing and Enrichment Engine

- Implement mock enrichment provider.
- Implement gatekeeper evaluation helper.
- Implement payout calculation helper.
- Add unit tests for payout and tier logic.

### Phase 3: Public Intake

- Build `/apply/[brandSlug]`.
- Implement start, estimate, and submit routes.
- Add creator scope sliders and usage selector.
- Show estimated payout before submit.
- Add confirmation and archived/not-fit states.

### Phase 4: Admin Dashboard

- Build login.
- Build proposals dashboard.
- Add filters, tabs, detail drawer, and action menu.
- Implement approve, reject, email, mark contacted, manual status update, and CSV export.

### Phase 5: Campaign Management

- Build campaign list and campaign form.
- Implement create/edit/activate behavior.
- Enforce one active campaign per brand.

### Phase 6: QA and Hardening

- Add Playwright tests for:
  - Creator estimate and submit flow
  - Admin login
  - Proposal action workflow
  - Campaign activation
- Add loading, empty, and error states.
- Verify responsive layouts.

## 18. Testing Requirements

### Unit Tests

Test `calculateProposalPayout`:

- No usage rights.
- 30-day usage multiplier.
- 90-day usage multiplier.
- Zero reels.
- Zero stories.
- Rounding to cents.

Test `evaluateProposal`:

- Archived by follower threshold.
- Archived by engagement threshold.
- Green when engagement >= 3.5.
- Yellow when engagement < 3.5 but thresholds pass.

### API Tests

- Public start validates handle and email.
- Estimate refuses expired draft.
- Submit recalculates server-side.
- Admin routes reject unauthenticated requests.
- Campaign activation deactivates previous active campaign.

### E2E Tests

- Creator completes intake and sees matching final payout.
- Admin approves a Green proposal.
- Admin marks a Yellow proposal contacted.
- Admin exports CSV.

## 19. Seed Data

Create seed data:

- Brand:
  - `companyName`: Example Studio
  - `slug`: example-studio
  - follower positioning: 20k to 250k target brand
- Admin:
  - `email`: admin@example.com
  - password or provider configured for local login
- Active campaign:
  - `name`: Summer Creator Collabs
  - `slug`: summer-creator-collabs
  - `isActive`: true
  - `minFollowers`: 10000
  - `minEngagementRate`: 2.0
  - `baseRatePer10kCents`: 10000
  - `ratePerReelCents`: 25000
  - `ratePerStoryCents`: 7500
  - `adUsage30DayMultiplier`: 1.2
  - `adUsage90DayMultiplier`: 1.4

## 20. MVP Acceptance Criteria

The MVP is complete when:

- A brand admin can log in.
- The admin can create multiple campaigns and set exactly one active campaign.
- A creator can open the active campaign intake page.
- A creator can enter handle, name, and email.
- The system mocks enrichment and stores a proposal draft.
- A creator can build scope with sliders and usage selector.
- The creator sees an estimated payout before submitting.
- Final submission saves the proposal with matching payout.
- Proposals are assigned Green, Yellow, or Archived match tiers.
- Admin can review proposals by tier and workflow status.
- Admin can approve, reject, email, export, mark contacted, and change status.
- Pricing logic is covered by unit tests.
- Public and admin routes validate inputs server-side.

## 21. Future Roadmap

### Enrichment Integrations

- Add Instagram Graph API where authenticated access is available.
- Add Modash, HypeAuditor, or other creator intelligence provider.
- Store provider confidence, last fetched timestamp, and raw payload.

### Negotiation Intelligence

- Add brand budget tiers.
- Add suggested counter-offer amount.
- Add negotiation email templates.
- Add creator response tracking.

### CRM Features

- Add creator history.
- Add notes and tags.
- Add campaign-specific shortlists.
- Add bulk actions.

### Multi-Tenant SaaS

- Add multiple brands.
- Add admin roles.
- Add agency workspaces.
- Add billing and subscription plans.

## 22. Key Build Principles for Cursor

- Keep pricing and evaluation logic pure, typed, and testable.
- Keep public creator flow polished and simple.
- Keep admin UI utilitarian, dense, and easy to scan.
- Do not expose private pricing rules unless intentionally needed.
- Do not rely on client-calculated payout for persisted data.
- Prefer small route handlers that call service functions.
- Add validation before database writes.
- Preserve the distinction between `matchTier` and `workflowStatus`.
- Design enrichment as replaceable from day one.
