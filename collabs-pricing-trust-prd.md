# Product Requirements Document: Collab — Pricing Transparency & Creator Trust (DM + Web)

**Document ID:** `collabs-pricing-trust-prd.md`  
**Status:** Draft for implementation  
**Depends on:** [`collabs-prd.md`](./collabs-prd.md) (core pricing, intake), [`collabs-instagram-dm-prd.md`](./collabs-instagram-dm-prd.md) (DM channel)  
**Last updated:** 2026-06-12

---

## 1. Purpose of this document

The core Collab product already calculates payouts deterministically and runs a DM state machine with LLM scope parsing and rich messaging primitives. **This PRD defines the next creator-facing differentiation layer:** make pricing *explainable*, rejection *empathetic*, and identity *real* — the three capabilities ManyChat-style bots cannot replicate because they lack Collab’s pricing model and Graph-backed profile resolution.

**Product intent:** Creators who DM or use the web intake should feel they are talking to a **credible pricing assistant**, not a keyword tree. Brands should see the same numbers in admin; nothing changes on the triage side except richer proposal metadata in API responses (optional admin display later).

**Channels in scope:** Instagram DM **and** web intake (`/apply/[brandSlug]`). Both must stay numerically consistent.

**Explicit non-goals for this slice**

- Shareable rate-card PNG / image attachments  
- Creator counter-offers or `budgetTier` evaluation  
- Live “what-if” scope editing from `ESTIMATE_REVIEW` without re-entering scope  
- Returning-creator “welcome back” resume  
- DM↔web session handoff  
- Real engagement-rate enrichment (Modash, Graph insights, etc.)  
- Admin template editor or breakdown display in dashboard (optional fast-follow)

---

## 2. Problem and opportunity

### Problem today

| Surface | Current behavior | Creator perception |
| --- | --- | --- |
| Estimate (DM) | Flat total: `$850.00 (2 Reels, 1 Story, 30-day paid ads)` | Black-box bot answer; hard to trust or negotiate |
| Estimate (web) | Large total in `EstimatedPayoutPanel`; no line items | Polished UI but same opacity |
| Ineligible (DM + web) | Generic thresholds: “{{minFollowers}}+ followers, {{minEngagement}}%+ engagement” | Cold rejection; creator doesn’t know *how close* they are |
| Greeting (DM) | Anonymous: “Hey! Thanks for reaching out to {{brandName}}…” | Could be any automation; no proof Collab “knows” them |
| Post-enrichment (DM) | Graph username/followers resolved in `runEnrichment` but **not surfaced** in copy | Wasted trust signal; admin sees handle, creator doesn’t |

### Opportunity

Collab’s moat is **deterministic, campaign-configured pricing**. Exposing the math builds trust. Combining that with **specific gatekeeper feedback** and **real @handles / follower counts** (when Graph allows) produces a DM experience that feels bespoke — without LLM-generated prices or manual brand work.

### Success criteria

1. **Explainability:** 100% of estimates shown to creators include an itemized breakdown whose line items sum (after rounding) to the displayed total. Breakdown is derived only from `lib/pricing/*` — never from LLM output.  
2. **Empathy:** Ineligible creators see **which** threshold failed and **by how much** (followers and/or engagement gap).  
3. **Personalization:** When Instagram Graph resolves `username` and/or `follower_count`, post-enrichment messages address the creator by `@handle` and reference their follower count. When Graph does not resolve, copy falls back gracefully with **no fabricated metrics**.  
4. **Parity:** DM and web show the same breakdown for the same draft + scope.  
5. **No regression:** `calculateProposalPayout` total remains the single source of truth; existing unit tests pass; new tests cover breakdown formatting and ineligible copy selection.

---

## 3. Relationship to existing architecture

| Layer | Today | This PRD |
| --- | --- | --- |
| Total payout | `calculateProposalPayout` → `formatCents` | Unchanged; breakdown is a **view** over the same inputs |
| Estimate API | `estimateProposal` returns `formattedPayout` | Extend return type with `breakdown` + `formattedBreakdown` |
| DM templates | `lib/instagram/templates.ts` | New placeholders; longer `estimate` / `ineligible` copy |
| DM state machine | `instagramConversationService.ts` | Pass new template vars from draft metrics + gatekeeper |
| Graph enrichment | `fetchScopedUserProfile` in `runEnrichment` | Surface resolved fields in templates; persist on draft (already done) |
| Engagement | Mock provider (`engagementRate` seeded from handle) | **Do not** cite engagement in creator-facing copy until a real provider ships |
| Admin | Proposal drawer shows total payout | No change required for MVP (breakdown optional later) |

---

## 4. Feature A — Explainable, itemized estimate

### 4.1 User story

> As a creator, when I see my estimated collab rate, I want to understand **how** it was calculated so I can trust the number and adjust scope confidently.

### 4.2 Breakdown model

Introduce a pure helper alongside `calculateProposalPayout`:

```ts
type PayoutBreakdown = {
  /** Integer cents; same rounding boundary as calculateProposalPayout. */
  totalCents: number;
  followerCount: number;
  baseCents: number; // round((followerCount / 10_000) * baseRatePer10kCents)
  reelsCount: number;
  reelsCents: number; // reelsCount * ratePerReelCents
  storiesCount: number;
  storiesCents: number; // storiesCount * ratePerStoryCents
  preUsageCents: number; // baseCents + reelsCents + storiesCents (pre-round subtotals summed)
  adUsageDays: 0 | 30 | 90;
  usageMultiplier: number; // 1 | adUsage30DayMultiplier | adUsage90DayMultiplier
  usageLabel: string; // "no ad usage" | "30-day paid ads" | "90-day paid ads"
};
```

**Rules**

- `totalCents` MUST equal `calculateProposalPayout(...)` for the same inputs.  
- Sub-line amounts (`baseCents`, `reelsCents`, `storiesCents`) are rounded to the nearest cent **individually** for display only; the authoritative total still uses the existing single boundary round on `preUsageTotal * multiplier`.  
- If displayed sub-lines do not sum exactly to `totalCents` after display rounding, append a one-line adjustment note: `Rounding: ±$0.01` — or prefer computing display lines from unrounded internals so they sum correctly (recommended: keep fractional cents internal until final `totalCents` round, format each line from the same unrounded pipeline).  
- Zero-quantity lines are **omitted** from creator copy (e.g. skip “$0 stories” when `storiesCount === 0`).

### 4.3 Formatted breakdown strings

Add `formatPayoutBreakdown(breakdown: PayoutBreakdown): string` in `lib/money.ts` (or `lib/pricing/formatPayoutBreakdown.ts`).

**Canonical one-line format (DM-friendly):**

```text
$500.00 base (45K followers) + $250.00 reels + $75.00 story × 1.2 (30-day paid ads) = $990.00
```

**Formatting rules**

| Segment | Rule |
| --- | --- |
| Money | `formatCents` (USD, 2 decimals) |
| Followers | `formatCompactNumber` (e.g. `45K`, `125K`) |
| Reels / stories | Omit segment when count is 0; pluralize: `1 reel` vs `2 reels` |
| Usage | `× {multiplier}` only when `adUsageDays !== 0`; append human label in parentheses |
| Total | Always last after `=` |

**Multi-line format (web, optional secondary):**

```text
Base (45K followers)     $500.00
2 reels                  $500.00
1 story                   $75.00
30-day usage (×1.2)      +$207.00
─────────────────────────────────
Estimated total          $990.00
```

Web MVP: show one-line under the big total in `EstimatedPayoutPanel`; multi-line is a polish fast-follow.

### 4.4 API changes

**`estimateProposal` / `submitProposal` outcomes** — extend success branch:

```ts
{
  calculatedPayoutCents: number;
  formattedPayout: string;
  breakdown: PayoutBreakdown;
  formattedBreakdown: string; // one-line canonical string
  matchTier: MatchTier;
}
```

**Routes**

- `POST /api/public/proposals/estimate` — include `breakdown` + `formattedBreakdown` in JSON response.  
- `POST /api/public/proposals/submit` — same (for done-screen parity).  
- No request schema changes.

### 4.5 DM template update

**Template key:** `estimate` (and `submitted_qualified` summary may reference total only).

**New placeholders:** `{{breakdown}}`, `{{estimate}}` (total unchanged).

**Proposed copy:**

```text
Hey{{creatorGreeting}} — here’s your estimate for {{campaignName}}:

{{breakdown}}

Reply SUBMIT to send this to {{brandName}}, or EDIT to change your scope.
```

> `{{creatorGreeting}}` is supplied by Feature C (e.g. ` @maya` or empty). See §6.

**Constraints**

- Instagram DM text should stay under ~900 characters; typical breakdown ≈ 120–200 chars.  
- Keep existing Submit / Edit **button template** on `estimate` (`buildMessage`).

### 4.6 Web UI update

**Component:** `EstimatedPayoutPanel`

- Below the large total, render `formattedBreakdown` in `text-xs text-white/50` (or muted foreground on light themes).  
- While loading, skeleton or omit breakdown line.  
- When `!hasDeliverable`, hide breakdown (unchanged empty state).

**Component:** `CreatorIntakeForm` done step — optionally show breakdown under `finalPayout` (use submit response).

### 4.7 Acceptance criteria (Feature A)

- [ ] `calculateProposalPayoutBreakdown` unit tests cover: no usage, 30d, 90d, zero reels, zero stories, rounding edge (33,333 followers × multiplier).  
- [ ] Property test or table test: `breakdown.totalCents === calculateProposalPayout(...)` for seed campaign presets.  
- [ ] DM `estimate` message includes `formattedBreakdown` and matches API for the same draft/scope.  
- [ ] Web scope step shows matching breakdown when sliders change (debounced estimate fetch).  
- [ ] LLM scope path unchanged: pricing only runs after `scopeSchema` validation in `runEstimate`.

---

## 5. Feature B — Specific, empathetic ineligible feedback

### 5.1 User story

> As a creator who doesn’t meet campaign thresholds, I want to know **why** and **how close** I am, so the brand feels fair and I might still engage (submit anyway or try again later).

### 5.2 Inputs (already available)

From `startDmProposalDraft` / `startProposalDraft` gatekeeper:

```ts
{
  passedThresholds: boolean;
  failedFollowerThreshold: boolean;
  failedEngagementThreshold: boolean;
}
metrics: { followerCount: number; engagementRate: number }
campaign: { minFollowers: number; minEngagementRate: number }
```

No schema migration required.

### 5.3 Gap calculation

Pure helper `computeEligibilityGaps(...)`:

```ts
type EligibilityGaps = {
  failedFollowerThreshold: boolean;
  failedEngagementThreshold: boolean;
  followerGap: number | null; // max(0, minFollowers - followerCount) when failed
  engagementGap: number | null; // max(0, minEngagementRate - engagementRate) when failed, 1 decimal
};
```

**Display rules**

- Follower gap: “about **2K** short” using `formatCompactNumber` on the gap, or “**38K** followers (need **40K**)” when clearer.  
- Engagement gap: “**1.2%** below the **2.0%** minimum” — one decimal via `formatEngagementRate`.  
- Both failed: combine with “and” in one message.  
- Neither failed (should not reach `ineligible` template): fall back to legacy generic copy.

### 5.4 Template variants

Replace single `ineligible` template with **render-time selection** (same `TemplateKey`, logic in `buildIneligibleMessage(vars)`):

| Case | Example copy |
| --- | --- |
| Followers only | `Hey{{creatorGreeting}} — for {{campaignName}}, we’re looking for creators with at least {{minFollowersFormatted}} followers. You’re at {{followerCountFormatted}} (about {{followerGapFormatted}} short). Reply SUBMIT ANYWAY to save your details and get a rate estimate, or STOP.` |
| Engagement only | `Hey{{creatorGreeting}} — for {{campaignName}}, we need at least {{minEngagement}}% engagement. Yours is {{engagementRate}}% ({{engagementGapDescription}}). Reply SUBMIT ANYWAY…` |
| Both | `Hey{{creatorGreeting}} — for {{campaignName}}, this campaign needs {{minFollowersFormatted}}+ followers and {{minEngagement}}%+ engagement. You’re at {{followerCountFormatted}} and {{engagementRate}}% engagement. Reply SUBMIT ANYWAY…` |
| Graph unavailable | Same templates; `{{creatorGreeting}}` empty; metrics from mock enrichment (existing behavior) — **do not** claim “we looked up your profile” |

**Important:** Engagement values shown in ineligible copy come from the **same mock or Graph+mock pipeline** as today. Add a single honest footnote only in web UI: “Engagement is estimated for this preview.” DM copy omits engagement sourcing jargon to save space.

### 5.5 Web intake parity

**Component:** `CreatorIntakeForm` step `ineligible`

- Replace static threshold sentence with the same gap logic (shared helper).  
- Keep CTA to proceed to scope (existing “continue anyway” path).

### 5.6 DM state machine

**File:** `runEnrichment` in `instagramConversationService.ts`

When `!draft.gatekeeper.passedThresholds`, call gap helper with `draft.metrics`, campaign thresholds, and gatekeeper flags; pass expanded vars to `buildMessage("ineligible", vars)`.

Quick replies unchanged: Submit anyway / Stop.

### 5.7 Acceptance criteria (Feature B)

- [ ] Follower-only, engagement-only, and both-failed cases render distinct, grammatically correct copy (unit tests on template builder).  
- [ ] Gap math correct for seed creators in `prisma/seed.ts` scenarios.  
- [ ] `INELIGIBLE_OFFER` → `SUBMIT` path still advances to `SCOPE_REELS` unchanged.  
- [ ] No PII beyond what is already stored on the draft.

---

## 6. Feature C — Personalized greeting with real handle / followers

### 6.1 User story

> As a creator messaging a brand on Instagram, I want the bot to recognize my **real @handle** and **follower count** so I believe the estimate is meant for me specifically.

### 6.2 Identity resolution (existing)

`runEnrichment` already:

1. Calls `fetchScopedUserProfile(accessToken, instagramScopedUserId)` when brand token exists.  
2. Passes `creatorHandle`, `creatorName`, `followerCount` into `startDmProposalDraft`.  
3. Uses Graph `follower_count` when present; else mock enrichment from handle / pseudo-handle.

**Provider label:** `enrichmentProvider === "instagram_graph"` when Graph supplied handle or followers; else `mock`.

### 6.3 Personalization policy

| Data | Use in creator copy? | Condition |
| --- | --- | --- |
| `username` | Yes — `@handle` | Graph returned non-null `username` (not pseudo-handle) |
| `name` | Optional — first name only | If `name` present and not equal to handle; use first token, max 20 chars |
| `follower_count` | Yes — in breakdown base segment & ineligible gaps | Graph returned non-null **or** mock (mock allowed but see honesty rule) |
| `engagementRate` | **No** in personalized greeting/estimate | Until real enrichment; only allowed in ineligible gap copy (already used for gating) |

**Honesty rule for mock fallback**

- When `isPseudoHandle(creatorHandle)` or `enrichmentProvider === "mock"`:  
  - Do **not** say “we checked your Instagram profile.”  
  - Use neutral phrasing: “based on your profile” → prefer “for this estimate” without implying live scrape.  
- When Graph resolved real `@username`:  
  - OK to say “Based on your account (**@maya**, **38K** followers)…” in estimate breakdown lead-in.

### 6.4 When to personalize (DM timing)

```text
collab keyword → welcome (generic, pre-identity) → START
    → enriching → [Graph lookup]
    → ask_reels | ineligible   ← first personalized touchpoint
    → … → estimate             ← full personalization
```

**Do not** delay `welcome` for Graph lookup (keeps time-to-first-response low; `welcome` stays automation disclosure + START CTA).

**New optional template** `post_enrich` — *not required for MVP*; personalize within `ask_reels`, `ineligible`, `estimate`, `submitted_qualified`.

### 6.5 Template variables

Add to `TemplateVars`:

| Key | Example | Source |
| --- | --- | --- |
| `creatorGreeting` | ` @maya` or `` | `` when anonymous; leading space before @ when embedded in “Hey{{creatorGreeting}}” |
| `creatorHandle` | `maya` | Normalized handle without `@` |
| `creatorHandleFormatted` | `@maya` | Display |
| `followerCountFormatted` | `38K` | `formatCompactNumber` |
| `isVerifiedIdentity` | `"true"` / `"false"` | Graph username resolved (internal; drives copy variant selection) |

**`ask_reels` example (Graph resolved):**

```text
Hey @maya! How many Reels (0–5) would you include? Tap a number or reply with a number.
```

**`ask_reels` fallback:**

```text
How many Reels (0–5)? Tap a number or reply with a number.
```

### 6.6 Conversation persistence

No new DB columns. Use:

- `conversation.draftId` → `ProposalDraft.creatorHandle`, `followerCount`  
- `conversation.draftMetrics` JSON snapshot for template rendering without extra queries during `advance`

Ensure `draftMetrics` includes `{ followerCount, engagementRate, creatorHandle?, isVerifiedIdentity? }` after enrichment (extend JSON shape in app layer only).

### 6.7 Web intake note

Web already collects handle before enrich; personalization is natural on scope step:

```text
Estimate for @{{handle}} ({{followerCountFormatted}} followers)
```

Optional header line above `EstimatedPayoutPanel` — same sprint if cheap.

### 6.8 Acceptance criteria (Feature C)

- [ ] Graph-resolved DM user sees `@handle` in `ask_reels` (or first post-enrich message) and in `estimate`.  
- [ ] Pseudo-handle / mock path never displays a fake `@username`.  
- [ ] Estimate breakdown references follower count in base segment.  
- [ ] Engagement rate is **not** in estimate/greeting copy.  
- [ ] Admin proposal drawer behavior unchanged; pseudo-handle disclaimer remains when applicable.

---

## 7. Shared implementation plan

### Phase 1 — Pricing breakdown library (½ day)

1. Add `lib/pricing/calculateProposalPayoutBreakdown.ts` + tests.  
2. Add `formatPayoutBreakdown` + tests.  
3. Wire into `computeForDraft` in `proposalService.ts`.

### Phase 2 — API + web (½ day)

1. Extend estimate/submit responses.  
2. Update `EstimatedPayoutPanel` + `CreatorIntakeForm` fetch handlers.  
3. Update ineligible step copy via shared `computeEligibilityGaps` + `formatIneligibleMessage`.

### Phase 3 — DM templates + state machine (½ day)

1. Extend `TemplateVars` and `renderTemplate` / `buildMessage`.  
2. Add `formatIneligibleVars` helper.  
3. Update `runEnrichment`, `runEstimate`, `advance` call sites to pass identity + breakdown vars.  
4. Extend `instagramConversationService.test.ts` fixtures.

### Phase 4 — QA (¼ day)

1. Manual DM happy path with test user (Graph on/off).  
2. Web intake ineligible + scope paths.  
3. Verify button template still sends on estimate step.

**Estimated effort:** 1.5–2 engineering days.

---

## 8. Message templates (v1.1 — delta from DM PRD §13)

Placeholders added: `{{breakdown}}`, `{{creatorGreeting}}`, `{{creatorHandleFormatted}}`, `{{followerCountFormatted}}`, `{{followerGapFormatted}}`, `{{engagementGapDescription}}`, `{{minFollowersFormatted}}`.

| Key | Updated example |
| --- | --- |
| `ask_reels` | `Hey{{creatorGreeting}}! How many Reels (0–5)? Tap a number or reply with a number.` |
| `ineligible` | *(variant selected per §5.4)* |
| `estimate` | `Hey{{creatorGreeting}} — here’s your estimate for {{campaignName}}:\n\n{{breakdown}}\n\nReply SUBMIT to send to {{brandName}}, or EDIT to change.` |
| `submitted_qualified` | `You’re all set{{creatorGreeting}}! Estimated rate: {{estimate}}. {{brandName}} will review and reply here.` |

`welcome` and `enriching` unchanged.

---

## 9. Testing strategy

| Layer | Tests |
| --- | --- |
| Unit | `calculateProposalPayoutBreakdown`, `formatPayoutBreakdown`, `computeEligibilityGaps`, template rendering with new vars |
| Unit | Breakdown total parity with `calculateProposalPayout` |
| Integration | `estimateProposal` returns breakdown; API route JSON shape |
| Integration | DM `runEstimate` → outbound message contains breakdown string |
| Integration | Ineligible DM path with mocked gatekeeper flags → correct variant |
| Manual | Graph profile on: real @handle in thread |
| Manual | Graph profile off: no @handle, generic copy, mock followers in breakdown base only |

---

## 10. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Long DM messages | Truncation or poor UX | One-line breakdown; omit zero lines; monitor char count in tests |
| Display sub-lines don’t sum to total | Trust erosion | Single pipeline from unrounded internals; test parity |
| Mock engagement shown as fact | Creator distrust | No engagement in estimate; light web footnote only |
| Graph `follower_count` unavailable | Personalization weak | Fall back to mock count without claiming live lookup |
| Button template + long text | Meta rendering quirks | Keep estimate text under 640 chars; test on real device |
| Web/DM copy drift | Inconsistent experience | Shared formatting helpers in `lib/pricing` + `lib/money` |

---

## 11. Open questions (defer)

1. **Admin breakdown:** Show itemized lines in `ProposalDetailDrawer`? (Low cost once `PayoutBreakdown` exists.)  
2. **Persist breakdown on `Proposal`:** Store JSON snapshot at submit for audit, or recompute on read?  
3. **Ineligible + estimate without submit:** Proactive “get your rate anyway” CTA — separate PRD slice.  
4. **Localization:** All copy English-only for v1.1.

---

## 12. Acceptance criteria (slice complete)

- [ ] Creator sees itemized breakdown in DM estimate and web scope step.  
- [ ] Breakdown total matches `formattedPayout` everywhere.  
- [ ] Ineligible creators see specific follower and/or engagement gaps (DM + web).  
- [ ] Graph-resolved creators see `@handle` and follower count in post-enrich DM messages.  
- [ ] Pseudo-handle creators never see a fabricated `@username`.  
- [ ] No LLM involvement in breakdown or gap math.  
- [ ] Existing pricing, gatekeeper, and state-machine tests pass; new tests added.  
- [ ] No database migration required.

---

## Appendix A — Example end-to-end (DM)

**Campaign:** min 40K followers, 2% engagement; pricing per seed defaults.

**Creator:** @maya, 38K followers (Graph), 4.1% engagement (mock).

1. Creator: `collab`  
2. Bot: `welcome` (generic)  
3. Creator: `START`  
4. Bot: `enriching` → `ask_reels`: “Hey @maya! How many Reels…”  
5. … scope 2 reels, 1 story, 30-day usage …  
6. Bot: `estimate`:

```text
Hey @maya — here’s your estimate for Summer Drop:

$380.00 base (38K followers) + $500.00 reels + $75.00 story × 1.2 (30-day paid ads) = $1,146.00

Reply SUBMIT to send this to Example Studio, or EDIT to change.
```

**Ineligible variant:** Same creator at 38K when min is 40K, engagement passes:

```text
Hey @maya — for Summer Drop, we’re looking for creators with at least 40K followers. You’re at 38K (about 2K short). Reply SUBMIT ANYWAY to save your details and get a rate estimate, or STOP.
```

---

## Appendix B — File touch list (implementation reference)

| File | Change |
| --- | --- |
| `lib/pricing/calculateProposalPayoutBreakdown.ts` | **New** — breakdown computation |
| `lib/pricing/formatPayoutBreakdown.ts` | **New** — canonical string formatting |
| `lib/pricing/computeEligibilityGaps.ts` | **New** — gap math + copy fragments |
| `lib/pricing/calculateProposalPayout.test.ts` | Parity cases |
| `lib/services/proposalService.ts` | Return breakdown from estimate/submit |
| `lib/instagram/templates.ts` | New vars + ineligible variant builder |
| `lib/services/instagramConversationService.ts` | Pass vars into `buildMessage` |
| `app/api/public/proposals/estimate/route.ts` | Serialize breakdown |
| `app/api/public/proposals/submit/route.ts` | Serialize breakdown |
| `components/intake/EstimatedPayoutPanel.tsx` | Show breakdown |
| `components/intake/CreatorIntakeForm.tsx` | Ineligible copy + breakdown fetch |
| `lib/services/instagramConversationService.test.ts` | Updated expectations |
