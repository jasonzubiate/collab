"use client";

import { Table } from "@heroui/react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  formatCents,
  formatCompactNumber,
  formatEngagementRate,
} from "@/lib/money";
import type { WorkflowStatus } from "@/lib/adminTypes";

type MockProposal = {
  id: string;
  creatorHandle: string;
  subtitle: string;
  source?: "INSTAGRAM_DM";
  followerCount: number;
  engagementRate: number;
  reelsCount: number;
  storiesCount: number;
  calculatedPayoutCents: number;
  workflowStatus: WorkflowStatus;
  highlighted?: boolean;
};

const MOCK_PROPOSALS: MockProposal[] = [
  {
    id: "maya",
    creatorHandle: "maya.makes",
    subtitle: "Instagram DM",
    source: "INSTAGRAM_DM",
    followerCount: 84_200,
    engagementRate: 0.051,
    reelsCount: 2,
    storiesCount: 3,
    calculatedPayoutCents: 145_000,
    workflowStatus: "NEW",
    highlighted: true,
  },
  {
    id: "fitkitchen",
    creatorHandle: "thefitkitchen",
    subtitle: "The Fit Kitchen",
    followerCount: 41_800,
    engagementRate: 0.047,
    reelsCount: 1,
    storiesCount: 2,
    calculatedPayoutCents: 82_000,
    workflowStatus: "APPROVED",
  },
  {
    id: "leo",
    creatorHandle: "fitwithleo",
    subtitle: "Leo Marsh",
    followerCount: 120_000,
    engagementRate: 0.037,
    reelsCount: 1,
    storiesCount: 2,
    calculatedPayoutCents: 224_000,
    workflowStatus: "CONTACTED",
  },
];

const REEL_CHIPS = ["0", "1", "2", "3", "4", "5"] as const;

function ProposalTableMock({ clipOnMobile = false }: { clipOnMobile?: boolean }) {
  const tableContent = (
    <Table.Content
      aria-label="Incoming creator proposals"
      className="min-w-[640px]"
    >
      <Table.Header>
        <Table.Column isRowHeader>Creator</Table.Column>
        <Table.Column className="text-end">Followers</Table.Column>
        <Table.Column
          className={
            clipOnMobile
              ? "text-end"
              : "hidden text-end sm:table-cell"
          }
        >
          Engagement
        </Table.Column>
        <Table.Column
          className={
            clipOnMobile
              ? "text-center"
              : "hidden text-center md:table-cell"
          }
        >
          Deliverables
        </Table.Column>
        <Table.Column className="text-end">Payout</Table.Column>
        <Table.Column>Status</Table.Column>
      </Table.Header>
      <Table.Body>
        {MOCK_PROPOSALS.map((proposal) => (
          <Table.Row
            key={proposal.id}
            id={proposal.id}
            className={proposal.highlighted ? "bg-primary/10" : undefined}
          >
            <Table.Cell>
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                @{proposal.creatorHandle}
                {proposal.source === "INSTAGRAM_DM" ? (
                  <span
                    title="Via Instagram DM"
                    className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    DM
                  </span>
                ) : null}
              </div>
              <div className="text-xs text-muted-foreground">
                {proposal.subtitle}
              </div>
            </Table.Cell>
            <Table.Cell className="tabular-nums text-end text-foreground">
              {formatCompactNumber(proposal.followerCount)}
            </Table.Cell>
            <Table.Cell
              className={
                clipOnMobile
                  ? "tabular-nums text-end text-foreground"
                  : "tabular-nums hidden text-end text-foreground sm:table-cell"
              }
            >
              {formatEngagementRate(proposal.engagementRate)}
            </Table.Cell>
            <Table.Cell
              className={
                clipOnMobile
                  ? "tabular-nums text-center text-muted-foreground"
                  : "tabular-nums hidden text-center text-muted-foreground md:table-cell"
              }
            >
              {proposal.reelsCount}R · {proposal.storiesCount}S
            </Table.Cell>
            <Table.Cell className="tabular-nums text-end font-medium text-foreground">
              {formatCents(proposal.calculatedPayoutCents)}
            </Table.Cell>
            <Table.Cell>
              <StatusBadge status={proposal.workflowStatus} />
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Content>
  );

  return (
    <Table className="rounded-none shadow-none ring-0">
      {clipOnMobile ? (
        tableContent
      ) : (
        <Table.ScrollContainer className="rounded-none">
          {tableContent}
        </Table.ScrollContainer>
      )}
    </Table>
  );
}

function InstagramChatCard({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const chips = compact ? REEL_CHIPS.slice(0, 4) : REEL_CHIPS;

  return (
    <div
      className={`rounded-2xl bg-surface ring-1 ring-zinc-950/5 shadow-xl shadow-zinc-950/10 select-none ${
        compact ? "p-3" : "p-4"
      } ${className}`}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className={`rounded-full bg-[conic-gradient(at_top_left,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)] ${
            compact ? "h-5 w-5" : "h-6 w-6"
          }`}
        />
        <span className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
          Instagram DM
        </span>
      </div>

      <div className={`space-y-2 ${compact ? "mt-2" : "mt-3"}`}>
        <p
          className={`ml-auto max-w-[92%] rounded-2xl rounded-br-sm bg-[#6344F9] px-3 py-2 leading-snug text-white ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {compact
            ? "Any chance we could collab?"
            : "Obsessed with your drop 💚 any chance we could collab?"}
        </p>

        <p
          className={`mr-auto max-w-[92%] rounded-2xl rounded-bl-sm bg-[#EFEFEF] px-3 py-2 leading-snug text-zinc-900 ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {compact
            ? "How many Reels (0–5)?"
            : "Hey @maya! How many Reels (0–5)? Tap a number or reply with a number."}
        </p>
      </div>

      <div
        className={`flex flex-wrap justify-start gap-1 ${compact ? "pt-1.5" : "gap-1.5 pt-2"}`}
        aria-hidden
      >
        {chips.map((chip) => (
          <span
            key={chip}
            className={
              chip === "2"
                ? `inline-flex items-center justify-center rounded-full bg-[#6344F9] font-medium text-white ${
                    compact
                      ? "min-w-7 px-2 py-0.5 text-[11px]"
                      : "min-w-8 px-2.5 py-1 text-xs"
                  }`
                : `inline-flex items-center justify-center rounded-full bg-[#EFEFEF] font-medium text-zinc-900 ${
                    compact
                      ? "min-w-7 px-2 py-0.5 text-[11px]"
                      : "min-w-8 px-2.5 py-1 text-xs"
                  }`
            }
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

function EstimateCard({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl bg-surface ring-1 ring-zinc-950/5 shadow-xl shadow-zinc-950/10 select-none ${
        compact ? "p-3" : "p-4"
      } ${className}`}
    >
      <p className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
        Auto-priced estimate
      </p>
      <p
        className={`mt-2 font-display font-extrabold tracking-tighter text-foreground tabular-nums ${
          compact ? "text-2xl" : "text-3xl"
        }`}
      >
        $1,450
      </p>
      <p className={`text-muted-foreground ${compact ? "text-xs" : "text-sm"}`}>
        2 reels · 3 stories
      </p>
      {!compact ? (
        <p className="mt-0.5 text-sm text-muted-foreground">30-day paid ads</p>
      ) : null}
      <span
        className={`mt-2 inline-flex items-center gap-1.5 rounded-full bg-tier-green-soft font-medium text-tier-green ${
          compact
            ? "px-2 py-0.5 text-[10px]"
            : "mt-3 px-2.5 py-1 text-[11px]"
        }`}
      >
        <span aria-hidden className="size-1.5 rounded-full bg-tier-green" />
        Green match
      </span>
    </div>
  );
}

export function HeroVisual({ className = "" }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Collab pipeline preview: a creator submits scope via Instagram DM quick replies, receives an auto-priced estimate, and appears in the proposals table."
      className={`relative mx-auto w-full max-w-4xl ${className}`}
    >
      <div className="relative pb-24 sm:pb-28 lg:min-h-0 lg:pb-0">
        <InstagramChatCard
          compact
          className="absolute bottom-0 left-0 z-20 w-[48%] max-w-44 -rotate-2 sm:max-w-48 md:w-52 lg:hidden"
        />
        <EstimateCard
          compact
          className="absolute bottom-0 right-0 z-20 w-[44%] max-w-36 rotate-2 sm:max-w-40 md:w-48 lg:hidden"
        />

        <EstimateCard className="absolute -top-6 -right-4 z-20 hidden w-52 rotate-2 lg:block" />
        <InstagramChatCard className="absolute -bottom-8 -left-6 z-20 hidden w-60 -rotate-2 lg:block" />

        {/* Mobile/tablet: clip table on the right (Linear-style peek). Desktop: full table + scroll if needed. */}
        <div className="relative z-10 lg:mt-0">
          <div className="relative -mr-5 overflow-hidden rounded-xl border shadow-2xl shadow-zinc-950/15 sm:-mr-6 lg:mr-0">
            <div className="lg:hidden">
              <ProposalTableMock clipOnMobile />
            </div>
            <div className="hidden lg:block">
              <ProposalTableMock />
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-surface via-surface/80 to-transparent lg:hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
