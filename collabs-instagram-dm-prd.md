# Product Requirements Document: Collab — Instagram DM Channel

**Document ID:** `collabs-instagram-dm-prd.md`  
**Status:** Draft for review (feasibility + build plan)  
**Depends on:** [`collabs-prd.md`](./collabs-prd.md) (core intake, pricing, admin triage)  
**Last updated:** 2026-06-02

---

## 1. Purpose of this document

The core Collab PRD defines a **web-based** creator intake link and admin dashboard. This document defines a **second acquisition channel**: creators who **DM the brand on Instagram**, where Collab **owns the full stack** (Meta app, webhooks, messaging send API, conversation state) rather than delegating to ManyChat or similar.

**Product intent:** When a creator messages the brand with collaboration intent, Collab detects it, runs the prospecting flow **primarily inside the DM thread** (minimal web handoff), reuses existing **pricing / gatekeeper / proposal** logic, and surfaces results in the **same admin proposals UI** with a clear **Instagram DM** source.

This PRD is written for review of **feasibility**, scope, and phased delivery while you build now.

---

## 2. Decisions captured (stakeholder input)

| Topic | Decision |
| --- | --- |
| Channel ownership | Collab native stack (Meta Developer app + webhooks + send API) |
| **Messaging API path** | **Instagram API with Instagram Login** (no Facebook Page dependency). See §11 for the trade-off vs the Facebook-Page path; this decision drives the connection model, OAuth scopes, and token handling. |
| Creator UX | Maximize flow **inside Instagram DMs**; avoid separate web form for v1 DM path |
| Intent | English **free-text keyword** detection; **no** false-positive guardrails in v1 |
| Automation disclosure / opt-out | **In v1:** welcome message discloses automation; **`STOP` keyword** honored (Meta policy + App Review requirement) |
| Creator identity | Persist **Instagram scoped user ID** from the DM thread as primary contact key |
| Email | **Not required** for DM-originated proposals; DM thread is sufficient for follow-up |
| Brand setup | **Instagram Professional** account. A linked Facebook Page is **only required if** the Facebook-Login path is chosen (see §11); the recommended Instagram-Login path does not need one. |
| Accounts | **One Instagram account per brand** (matches current brand model) |
| Meta app | **Greenfield** — no app in review yet; App Review **+ Business Verification** is a delivery milestone |
| Post-submit | Send DM **confirmation + estimate summary** |
| Admin outbound | Reply from **Instagram app** and from **Collab dashboard** (both supported in design) |
| Copy | **Fixed templates** in v1 (no dashboard editor) |
| Enrichment | Keep **mock provider** for v1 (same as core app) |
| Timeline | **Build now** — phased implementation below |

---

## 3. Problem and opportunity

### Problem

Brands in the 20k–250k follower range receive collab inquiries in **Instagram DMs** first. Today Collab only replaces the **link-in-bio / manual send-a-link** step. The real friction is:

- Repetitive questions in DMs  
- No structured scope or payout estimate in-thread  
- Proposals live in the admin’s head or a spreadsheet until someone opens the dashboard  

### Opportunity

Treat the DM thread as the **system of record for creator input**, and Collab as the **automation + pricing brain** behind it—similar in *feel* to ManyChat, but with Collab-owned logic tied to campaigns, tiers, and the existing admin workflow.

### Success criteria (channel-specific)

- A creator can complete collab intake **without leaving Instagram** (except Meta’s own UI).  
- Collab creates a `Proposal` that appears in `/admin/proposals` with source **DM**, tier, and payout consistent with core pricing rules.  
- Creator receives an **estimate summary DM** after submit.  
- Brand admin can **reply in dashboard** and message is delivered to the creator’s IG inbox when policy allows.  
- Connection flow: brand links IG Professional account once; webhooks stay healthy.

---

## 4. Relationship to core Collab

| Layer | Core PRD (`collabs-prd.md`) | This PRD (DM channel) |
| --- | --- | --- |
| Pricing formula | `lib/pricing/calculateProposalPayout` | Reuse unchanged |
| Gatekeeper / tiers | `lib/pricing/evaluateProposal` | Reuse unchanged |
| Enrichment | Mock provider (handle-based) | Reuse; see §8 for handle resolution |
| Admin triage | Green / Yellow / Archived, workflow actions | Reuse; extend UI for DM source + thread link |
| Creator intake UI | `/apply/[brandSlug]` web flow | **Parallel path** via DM state machine |
| Proposal storage | `Proposal` model | Extend schema (§9) |

**Explicit non-goals for this channel (v1)**

- ManyChat / third-party bot builder integration  
- Comment automation, story mention replies, WhatsApp  
- Multi-language intent or replies  
- LLM intent classification (keyword-only v1)  
- False-positive / “are you sure?” disambiguation flows  
- Configurable message templates in admin UI  
- Real Instagram profile enrichment (Graph / Modash) — mock only  
- Creator login or creator-facing web account  

---

## 5. User roles and flows

### 5.1 Brand admin — one-time connection

1. Admin opens **Settings → Instagram** (new admin section).  
2. Admin starts **Connect Instagram** (Instagram Business Login — the Instagram-Login path from §2/§11).  
3. Collab requests permissions needed for messaging (see §11).  
4. Admin authorizes the **Instagram Professional** account directly. *(Only the Facebook-Login fallback path requires the extra "select linked Facebook Page" step.)*  
5. Collab stores the encrypted **Instagram user access token**, IG User ID, and `igUsername`, and sets `Brand.instagramBusinessId` (or the dedicated connection record in §9). *(Facebook-Login path additionally stores `pageId` + Page token.)*  
6. Collab subscribes webhooks for that account (`messages`, `messaging_postbacks`; `message_reads` optional).  
7. UI shows **Connected** + IG username + “Send test message to yourself” health check.

**Acceptance:** Disconnect revokes tokens and stops processing webhooks for that brand.

### 5.2 Creator — DM-native intake (happy path)

```text
Creator DMs brand
    → Webhook: inbound message
    → Intent: collab keyword match (English)
    → Conversation created / resumed
    → Welcome + explain (template)
    → Resolve identity (IGSID stored; username/handle for mock enrich — §8)
    → Mock enrich + gatekeeper (same rules as web)
    → If ineligible: "not a fit" template + offer to submit anyway
    → Scope collection IN DM:
         reels count (0–5)
         stories count (0–5)
         usage rights (none / 30d / 90d)
    → Live estimate message (server-calculated, formatted)
    → Confirm submit (quick reply: Submit / Edit)
    → Create Proposal + events
    → Confirmation DM with estimate summary
```

**DM UX patterns (v1):** Use **quick replies**, **button templates** (where supported), or **numeric replies** (`0`–`5`, `1`/`2`/`3` for usage). Do not depend on a web URL for the creator path.

### 5.3 Creator — ineligible path

Same as web PRD spirit:

- Show which threshold failed (followers or engagement).  
- Offer **Submit anyway** (creates `ARCHIVED` tier proposal).  
- Confirmation copy differs (no strong rate promise).

### 5.4 Brand admin — review and reply

1. Proposal appears in existing dashboard with badge **Via Instagram DM** and link to **open thread context** (IGSID, optional last message preview).  
2. Admin uses existing actions: approve, reject, mark contacted, change status, export CSV.  
3. **New:** **Reply in Collab** — compose text → Collab calls send API → delivered to creator DM.  
4. Admin may still reply from Instagram app; v1 does not require bidirectional sync of manual IG-app messages into Collab (see §12 open question).

### 5.5 Admin — outbound after proposal (automated)

Template message including:

- Thank you  
- Suggested rate (formatted, from server)  
- Match tier–aware tone (qualified vs on-file)  
- Optional: “We’ll follow up here in DMs”

---

## 6. Intent detection (v1)

### Approach

**Keyword / phrase matching** on normalized inbound text (lowercase, strip punctuation).

### Default English triggers (configurable in code, not admin UI)

Match if message contains any of:

- `collab`, `collaboration`, `partner`, `partnership`  
- `paid promo`, `sponsored`, `brand deal`  
- `rate`, `rates`, `rate card`, `media kit`  
- `gifted`, `pr package`, `ambassador`  
- `work together`, `work with you`

### Behavior

- **First match** in a conversation window starts the collab flow (or resumes if already in progress).  
- **No** secondary classifier or human confirmation in v1.  
- Non-matching messages: **no auto-reply** from Collab (silent).  
- If creator is mid-flow, route numeric/button replies to state machine, not keyword re-detection.

### Required in v1 (policy)

- **Automation disclosure:** the first automated message (`welcome`) must state that replies are automated. Meta Platform Terms require automated experiences to disclose themselves; App Review will check this.  
- **`STOP` opt-out:** at any state, `STOP` (case-insensitive) moves the conversation to `STOPPED` and suppresses further automation until the creator restarts with a keyword. This is the in-thread opt-out Meta expects. *(Promoted from open question §17.5.)*

### Future (out of v1)

- Ice breakers / persistent menu as explicit triggers  
- LLM intent with confidence threshold  
- False-positive “Did you mean collab?” step  

---

## 7. Conversation state machine

Collab maintains a **Conversation** record per `(brandId, instagramScopedUserId)` (and optionally per `campaignId` when active campaign is unambiguous).

### States (v1)

| State | Creator sees (template) | Valid inputs |
| --- | --- | --- |
| `IDLE` | — | Keywords → `WELCOME` (or `NO_CAMPAIGN` if brand has no active campaign) |
| `NO_CAMPAIGN` | “Not accepting collab requests right now.” | — (terminal; keywords re-check later) |
| `WELCOME` | Short intro + automation disclosure + “Let’s estimate your collab rate” | Tap **Start** / reply `START` |
| `ENRICHING` | “Checking your profile…” | — (async) |
| `INELIGIBLE_OFFER` | Not a fit + thresholds | **Submit anyway** / **Stop** |
| `SCOPE_REELS` | “How many Reels? (0–5)” | Integer 0–5 |
| `SCOPE_STORIES` | “How many Stories? (0–5)” | Integer 0–5 |
| `SCOPE_USAGE` | Usage rights options | `1` none, `2` 30d, `3` 90d (or buttons) |
| `ESTIMATE_REVIEW` | Formatted estimate + deliverables | **Submit** / **Edit** |
| `SUBMITTING` | “Submitting…” | — |
| `COMPLETED` | Thank you + summary | Keywords may start new proposal (policy: §12) |
| `STOPPED` | “No problem” | Keywords restart |

**`STOP` is valid in every non-terminal state** and routes to `STOPPED` (see §6).

**No active campaign:** Mirror the web `NO_ACTIVE_CAMPAIGN` outcome (`getActiveCampaignByBrandSlug` returns null). A keyword match with no active campaign goes to `NO_CAMPAIGN` instead of `WELCOME` — do **not** start enrichment or create a draft, since `Proposal.campaignId` is required.

**Empty-scope guard:** The web `scopeSchema` enforces `reelsCount + storiesCount >= 1`. If the creator answers `0` Reels **and** `0` Stories, re-ask (do not advance to `ESTIMATE_REVIEW`) so the DM can never reach submit with an invalid scope.

**Edit:** From `ESTIMATE_REVIEW`, **Edit** returns to `SCOPE_REELS`.

**Persistence:** Store `draftScope`, enriched metrics snapshot, `proposalId` when complete. Note the reuse implication in §10: the simplest integration is to persist a real `ProposalDraft` row and keep its id on the conversation, rather than holding the draft only as JSON.

**Concurrency:** Instagram may deliver messages for the same conversation **concurrently or out of order**. `mid` dedup (§11) is not enough to prevent two replies racing a state transition. Serialize per conversation — e.g. a `version` column with a conditional update on `(id, state)`, or a row lock — so only one transition wins.

**Timeout:** Align with web draft TTL (1 hour) or conversation idle 24h → expire state, require restart.

---

## 8. Identity, handle, and mock enrichment

### Instagram scoped user ID (IGSID)

- Every inbound DM webhook includes sender **IGSID** (Instagram-scoped ID).  
- Collab stores this on `Conversation` and `Proposal` as **`instagramScopedUserId`** (string).  
- This is the **primary creator contact key** for DM follow-up.

### Handle for mock enrichment

Mock enrichment today keys off **@handle** string. DM path options:

| Option | Pros | Cons |
| --- | --- | --- |
| **A. Graph API profile fetch** | Real username | Needs `instagram_basic` + approved app; not mock |
| **B. Ask in DM** | Works with mock now | Extra step; user said minimize input |
| **C. Derive stable pseudo-handle from IGSID** | Fully automated with mock | `ig_<hash>` — metrics deterministic but not “real” creator |

**v1 recommendation for build-now:** **C** for zero extra creator steps while mock is active; store `creatorHandle` as resolved username when Graph returns it (Phase 1.5). Document in admin UI: “Handle: @xyz (from Instagram)” vs “Handle: derived (mock)”.

When Graph User Profile is enabled later, replace C with A in the same state transition after `WELCOME`.

### Email

- DM proposals: `creatorEmail` **nullable**.  
- **Scope of the change (verified against code):** email is currently non-null on **both** `ProposalDraft` and `Proposal`, and is required by `startProposalSchema` and written by `submitProposal`. Making DM work requires nullable `creatorEmail` on **both** models (not just `Proposal`) plus a `source`-aware validation branch — otherwise the draft-row reuse in §10 fails at insert.  
- Web proposals: may still require email (core PRD) unless you unify optional everywhere.  
- Admin **Email creator** action becomes **Message on Instagram** when email is null.

---

## 9. Data model extensions

Add to Prisma (conceptual; exact names may vary in implementation):

```prisma
model InstagramConnection {
  id              String   @id @default(uuid())
  brandId         String   @unique
  brand           Brand    @relation(...)
  pageId          String
  pageAccessToken String   // encrypted at rest
  igUserId        String   // Instagram professional account id
  igUsername      String?
  tokenExpiresAt  DateTime?
  webhookSubscribed Boolean @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model InstagramConversation {
  id                    String   @id @default(uuid())
  brandId               String
  campaignId            String
  instagramScopedUserId String
  state                 String   // enum in app layer
  draftMetrics          Json?    // followerCount, engagementRate snapshot
  draftScope            Json?    // reels, stories, adUsageDays
  lastInboundAt         DateTime
  lastOutboundAt        DateTime?
  expiresAt             DateTime?
  proposalId            String?  @unique
  proposal              Proposal? @relation(...)
  @@unique([brandId, instagramScopedUserId, campaignId])
}

model Proposal {
  // existing fields...
  source                ProposalSource @default(WEB)
  instagramScopedUserId String?
  creatorEmail          String?        // was required; optional for DM
}

model ProposalDraft {
  // existing fields...
  creatorEmail          String?        // must ALSO become nullable for the §10 draft-row reuse
}

enum ProposalSource {
  WEB
  INSTAGRAM_DM
}
```

**ProposalEvent types to add:** `DM_SENT`, `DM_RECEIVED`, `INSTAGRAM_REPLY`, `CONVERSATION_STARTED`.

**Notes on the proposed `InstagramConversation`:**

- `campaignId` is **required and part of `@@unique([brandId, instagramScopedUserId, campaignId])`**. Decide up front (open question §17.2) whether a mid-conversation campaign change starts a **new** conversation row or mutates the existing one — the unique key forces this decision now, not later.  
- Add a `version Int @default(0)` (or equivalent) to support the per-conversation concurrency control described in §7.  
- If you adopt the draft-row reuse (§10), add a `draftId String?` pointing at the `ProposalDraft`, so submit can call the existing service unchanged.

---

## 10. API and service architecture

### New routes (indicative)

| Route | Purpose |
| --- | --- |
| `GET/POST /api/webhooks/instagram` | Verify + receive Meta webhooks |
| `GET/POST /api/admin/instagram/connect` | OAuth start / callback |
| `DELETE /api/admin/instagram/disconnect` | Revoke |
| `GET /api/admin/instagram/status` | Connection health |
| `POST /api/admin/proposals/[id]/instagram-message` | Admin sends DM from dashboard |

### Services

| Service | Responsibility |
| --- | --- |
| `instagramWebhookService` | Verify signature, parse payload, idempotency |
| `instagramIntentService` | Keyword matching |
| `instagramConversationService` | State machine transitions |
| `instagramMessagingService` | Send API wrapper, templates, rate limits |
| `instagramConnectionService` | Token storage, refresh, subscribe webhooks |

### Reuse from core (corrected against actual code)

The current services are **coupled to a `ProposalDraft` row by id**: `submitProposal(draftId, scope)` does `prisma.proposalDraft.findUnique(...)` and reads `draft.creatorEmail`, and `estimateSchema`/`submitProposalSchema` require `draftId` to be a UUID. So the draft cannot live *only* as JSON on the conversation.

**Recommended (low-effort) approach:** when a DM conversation reaches `ENRICHING`, create a real `ProposalDraft` row (via the existing `startProposalDraft` path, with a synthetic/pseudo handle and nullable email per §8), store its id on `InstagramConversation.draftId`, and then call the **unchanged** `estimateProposal` / `submitProposal`. After submit, patch the resulting `Proposal` with `source = INSTAGRAM_DM` and `instagramScopedUserId`.

- This keeps "Pricing/gatekeeper reuse = Low" (§19) honest.  
- The alternative "unify behind an `IntakeSession` interface" is a **medium** refactor of the service + Zod layer, not low — only do it if you want to drop `ProposalDraft` rows for the DM path entirely.

### Webhook implementation notes (Next.js 16)

- **Signature verification needs the raw body.** Read `await req.text()` and verify `X-Hub-Signature-256` *before* `JSON.parse` — parsing first loses the exact bytes the HMAC was computed over.  
- **Respond `200` fast, process after.** Use `after()` (Next 16) / `waitUntil` to run the state machine after the response. There is no queue in the repo today; `lib/rateLimit.ts` is in-memory and will not coordinate outbound send limits across serverless instances — note this before relying on it for send throttling.  
- **Route inbound events to a brand by recipient IG id.** A single app-level webhook receives events for every connected account; look up the `InstagramConnection` by the recipient `igUserId` to resolve `brandId`. Make this explicit even at one brand.

---

## 11. Meta platform constraints (feasibility)

### Choose the API path first (this gates everything below)

Meta offers two ways to do IG DM automation, and they differ in tokens, scopes, endpoints, and whether a Facebook Page is required:

| Path | Needs FB Page? | Token | Messaging permission |
| --- | --- | --- | --- |
| **Instagram API with Instagram Login** *(recommended, §2)* | No | Instagram **user** access token | `instagram_business_manage_messages` |
| Instagram API with Facebook Login *(fallback)* | Yes | **Page** access token | `instagram_manage_messages` + `pages_*` |

Committing to the Instagram-Login path removes the Facebook Page, the Page picker, and the `pages_*` scopes from the connection flow (§5.1) and the data model (§9). **Verify exact permission names against current Meta docs at build time** — they change.

### Requirements

- Instagram **Professional** account  
- Linked **Facebook Page** *(only for the Facebook-Login fallback path)*  
- Meta **Developer app** with Instagram Business Login configured  
- **App Review + Business Verification** for production permissions (major calendar risk)

### Permissions (indicative — depends on chosen path)

| Permission | Use |
| --- | --- |
| `instagram_business_manage_messages` *(IG-Login)* / `instagram_manage_messages` *(FB-Login)* | Receive + send DMs |
| `instagram_basic` | Username/profile (when moving off pseudo-handle) |
| `pages_manage_metadata`, `pages_show_list` | **FB-Login path only** — webhook subscription + Page picker |
| `business_management` | Business asset access |

### Development Mode gating (testing constraint)

Before App Review + Business Verification clear, **only people with a role on the app** (admin / developer / tester) can have their DMs received and replied to. You **cannot** test the flow with arbitrary creator accounts in dev mode — add testers explicitly. This gates Phase 1 testing, not just Phase 3 production.

### Messaging policy highlights

- **24-hour standard messaging window** after creator’s last message: Collab can send session replies freely.  
- Outside 24h: restricted to approved **message tags** (e.g. human agent)—design admin dashboard replies accordingly.  
- **Human Agent** tag may apply when brand replies from dashboard after delay—document ops expectation.  
- Rate limits and burst sending: queue outbound messages; handle `429` with retry.  
- **App Review** will scrutinize automation, data use, and privacy policy URL.

### Webhook reliability

- Must respond `200` quickly; process async (queue or `waitUntil` / background job).  
- Dedupe by `message.mid`.  
- Support webhook verification challenge on subscribe.

### Feasibility verdict

| Area | Verdict | Notes |
| --- | --- | --- |
| Receive DMs | **Feasible** | Well-documented Instagram Messaging API |
| In-DM scope collection | **Feasible** | Quick replies / numeric; UX acceptable |
| Server-side estimate in DM | **Feasible** | Reuse pricing libs |
| Collab-owned stack | **Feasible** | Engineering + App Review effort |
| No email | **Feasible** | Schema + admin UX adjustment |
| Dashboard → IG send | **Feasible** | Watch 24h window + tags |
| Mock enrich without handle | **Feasible** | Pseudo-handle; label clearly in admin |
| Build now timeline | **Moderate risk** | App Review may lag dev; use test users / dev mode |

---

## 12. Phased implementation plan (build now)

### Phase 0 — Foundation (week 1)

- [x] Meta Developer app created (dev mode)  
- [x] Webhook endpoint + verification  
- [x] `InstagramConnection` model + encrypt tokens  
- [x] Admin “Connect Instagram” UI (staging)  
- [ ] Log inbound messages only (no auto-reply)

### Phase 1 — Intent + state machine (week 1–2)

- [x] Keyword intent service  
- [x] `InstagramConversation` state machine  
- [x] Template outbound messages (hardcoded)  
- [x] Pseudo-handle + mock enrich + gatekeeper in DM  
- [x] Scope collection messages → estimate → submit → `Proposal` with `INSTAGRAM_DM`  
- [x] Post-submit summary DM  

### Phase 2 — Admin integration (week 2–3)

- [x] Proposals list/detail: source badge, IGSID, “Open in Instagram” deep link if available  
- [x] Nullable email; DM reply action from dashboard  
- [ ] Proposal events for DM sent/received  
- [x] CSV export includes `source`, `instagramScopedUserId`  

### Phase 3 — Production readiness (week 3+)

- [ ] App Review submission + privacy policy + data deletion instructions  
- [ ] Token refresh + connection health monitoring  
- [ ] Idempotency, dead-letter for failed sends  
- [x] Graph username resolution (replace pseudo-handle) when approved  

### Phase 4 — Polish (later)

- [ ] Ice breakers documentation for brands to configure in IG app  
- [ ] False-positive flow  
- [ ] Template editor in admin  
- [ ] Sync inbound messages from native IG app into Collab timeline (optional CRM thread view)

---

## 13. Message templates (v1 — fixed copy)

Placeholders: `{{brandName}}`, `{{campaignName}}`, `{{estimate}}`, `{{minFollowers}}`, `{{minEngagement}}`.

| Key | Example |
| --- | --- |
| `welcome` | “Hey! Thanks for reaching out to {{brandName}}. 🤖 This is an automated assistant that can estimate a collab rate for {{campaignName}} — reply STOP anytime to opt out. Reply START when you’re ready.” *(automation disclosure + opt-out are required, §6)* |
| `no_active_campaign` | “Thanks for reaching out to {{brandName}}! We’re not accepting collab requests right now — feel free to message again later.” |
| `stopped` | “No problem — I won’t send any more automated messages. Reply ‘collab’ anytime to start again.” |
| `enriching` | “One sec — checking your profile…” |
| `ineligible` | “Based on this campaign’s criteria ({{minFollowers}}+ followers, {{minEngagement}}%+ engagement), you’re not a fit right now. Reply SUBMIT to save your details anyway, or STOP.” |
| `ask_reels` | “How many Reels (0–5)? Reply with a number.” |
| `ask_stories` | “How many Stories (0–5)? Reply with a number.” |
| `ask_usage` | “Usage rights: 1 = none, 2 = 30-day paid ads, 3 = 90-day paid ads.” |
| `estimate` | “Estimated collab rate: **{{estimate}}** ({{reels}} Reels, {{stories}} Stories, {{usage}}). Reply SUBMIT to send to the brand, or EDIT to change.” |
| `submitted_qualified` | “You’re all set! Estimated rate: **{{estimate}}**. {{brandName}} will review and reply here.” |
| `submitted_archived` | “Thanks — your details are on file with {{brandName}}.” |
| `invalid_input` | “I didn’t catch that. {{hint}}” |
| `session_expired` | “This session expired. Send ‘collab’ to start again.” |

---

## 14. Security and compliance

- Encrypt Page access tokens at rest (KMS or app-level encryption).  
- Verify `X-Hub-Signature-256` on every webhook.  
- Never log raw tokens or full webhook payloads in production.  
- Privacy policy: disclose automated DM processing, retention, and deletion.  
- Provide admin **Disconnect** and user data deletion path for Meta review.  
- Store minimum PII: IGSID, optional username, message metadata for debugging (TTL optional).

---

## 15. Testing strategy

| Layer | Approach |
| --- | --- |
| Unit | Intent keywords, state transitions, template rendering |
| Integration | Webhook payload fixtures → conversation → proposal |
| Manual | Meta test users, test Page, ngrok/webhook tunnel in dev |
| E2E | Simulated webhook sequence for full DM happy path |

**Dev tip:** Meta test Instagram accounts can message the test Page without App Review for development.

---

## 16. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| App Review + Business Verification delay | Blocks production IG for all brands; **dev mode only allows app-role testers** | Add testers explicitly; parallel web intake stays live |
| Wrong API path chosen | Rework of connection model, scopes, tokens | Decide IG-Login vs FB-Login in Phase 0 (§11) before building `InstagramConnection` |
| Out-of-order / concurrent webhooks | State machine races, double transitions | Per-conversation serialization (`version` + conditional update); `mid` dedup alone insufficient |
| 24h messaging window | Admin late reply fails | Show window expiry in UI; use human-agent tag where valid |
| No username in webhook | Mock enrich uses pseudo-handle → **random eligibility for real creators** | Phase 3 Graph profile; show admin disclaimer; flag in stakeholder demos |
| Keyword false positives | Wrong threads start flow | Accepted for v1; STOP opt-out limits damage; iterate in Phase 4 |
| Missing automation disclosure / opt-out | App Review rejection / policy violation | Disclosure in `welcome` + `STOP` handling shipped in v1 (§6) |
| Cross-channel duplicate | Same creator via web + DM = two unlinked proposals | Accept for v1; see open question §17.6 |
| DM UX limits | Sliders/web UX not possible | Numeric + buttons; keep copy short |
| Dual reply channels | Confusion if IG app + dashboard | v1: no sync of manual IG replies; document SOP |
| Schema migration | Email required on **draft and proposal** today | Migration: nullable on both models + validation branch by `source` (§8) |

---

## 17. Open questions (for later review)

1. **Repeat proposals:** If same IGSID DMs “collab” again after `COMPLETED`, start new proposal or reject as duplicate?  
2. **Active campaign switch:** Mid-conversation campaign change — reset or complete current? *(Interacts with the `@@unique([brandId, instagramScopedUserId, campaignId])` key — see §9.)*  
3. **Inbound sync:** Should messages sent by brand from native IG app appear in Collab proposal timeline in v1?  
4. **Web + DM:** Keep `/apply` live as fallback forever, or DM-only brands eventually?  
5. ~~**Opt-out:** Implement `STOP` keyword…~~ **Resolved — promoted into v1 (§6).**  
6. **Cross-channel dedup:** A creator who applies on web *and* via DM produces two unrelated `Proposal`s (web uses a real handle, DM uses a pseudo-handle). Should these be linked/deduped, and on what key?

---

## 18. Acceptance criteria (channel MVP done)

- [x] Brand connects Instagram via admin UI; webhook receives messages.  
- [x] Creator DM containing trigger word starts automated flow without web link.  
- [x] Creator completes scope in DM and receives server-calculated estimate before submit.  
- [x] Proposal created with `source = INSTAGRAM_DM`, `instagramScopedUserId`, tier per existing rules.  
- [x] Creator receives post-submit summary DM with estimate.  
- [x] Admin sees proposal in dashboard with DM source indicator.  
- [x] Admin can send a reply from dashboard that delivers to creator DM (within policy window).  
- [x] Mock enrichment used; pricing matches web path for equivalent inputs.  
- [x] Core web intake at `/apply/[brandSlug]` still works unchanged.

---

## 19. Effort summary (for feasibility review)

| Component | Relative effort |
| --- | --- |
| Meta app + OAuth + webhooks | Medium |
| Conversation state machine + templates | Medium |
| Pricing/gatekeeper reuse | Low |
| Schema + admin UI extensions | Medium |
| Dashboard send DM | Medium |
| App Review + legal pages | Medium–High (calendar) |
| **Total** | **~3–5 weeks** engineering for Phases 0–2; App Review may add **2–6+ weeks** wall-clock |

---

## 20. References

- Core product: [`collabs-prd.md`](./collabs-prd.md)  
- Meta: [Instagram Messaging API](https://developers.facebook.com/docs/messenger-platform/instagram) (verify current docs at build time)  
- Existing code: `lib/pricing/`, `lib/enrichment/`, `lib/services/proposalService.ts`, `Brand.instagramBusinessId`

---

*End of document.*
