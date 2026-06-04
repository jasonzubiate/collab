type Tier = "GREEN" | "YELLOW" | "ARCHIVED";

type Row = {
  handle: string;
  followers: string;
  engagement: string;
  payout: string;
  tier: Tier;
};

const ROWS: Row[] = [
  {
    handle: "@maya.makes",
    followers: "84.2K",
    engagement: "5.1%",
    payout: "$1,450",
    tier: "GREEN",
  },
  {
    handle: "@thefitkitchen",
    followers: "41.8K",
    engagement: "4.7%",
    payout: "$820",
    tier: "GREEN",
  },
  {
    handle: "@danielonfilm",
    followers: "22.4K",
    engagement: "2.9%",
    payout: "$390",
    tier: "YELLOW",
  },
  {
    handle: "@weekendwander",
    followers: "6.1K",
    engagement: "1.8%",
    payout: "—",
    tier: "ARCHIVED",
  },
];

const TIER_STYLES: Record<Tier, { label: string; className: string }> = {
  GREEN: {
    label: "Green match",
    className: "bg-primary/15 text-primary ring-1 ring-primary/30",
  },
  YELLOW: {
    label: "Review",
    className: "bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/30",
  },
  ARCHIVED: {
    label: "Archived",
    className: "bg-zinc-700/30 text-zinc-400 ring-1 ring-zinc-600/40",
  },
};

export function DashboardMock({ className = "" }: { className?: string }) {
  return (
    <div
      role="img"
      aria-label="Collab dashboard showing incoming creator proposals automatically sorted into green, review, and archived match tiers with estimated payouts."
      className={`overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-white/10 select-none ${className}`}
    >
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
            <span className="h-3 w-3 rounded-full bg-zinc-700" />
            <span className="h-3 w-3 rounded-full bg-zinc-700" />
            <span className="h-3 w-3 rounded-full bg-zinc-700" />
            <span className="ml-3 font-mono text-xs tracking-wide text-zinc-500 uppercase">
              Incoming proposals
            </span>
          </div>

          <div className="hidden grid-cols-[1.4fr_1fr_1fr_0.9fr_auto] gap-4 px-5 py-3 font-mono text-[11px] tracking-wide text-zinc-500 uppercase sm:grid">
            <span>Creator</span>
            <span>Followers</span>
            <span>Engagement</span>
            <span>Payout</span>
            <span className="text-right">Match</span>
          </div>

          <ul className="divide-y divide-white/5">
            {ROWS.map((row) => {
              const tier = TIER_STYLES[row.tier];
              return (
                <li
                  key={row.handle}
                  className="grid grid-cols-2 items-center gap-3 px-5 py-4 sm:grid-cols-[1.4fr_1fr_1fr_0.9fr_auto] sm:gap-4"
                >
                  <span className="font-medium text-white">{row.handle}</span>
                  <span className="font-mono text-sm text-zinc-400 tabular-nums">
                    {row.followers}
                  </span>
                  <span className="hidden font-mono text-sm text-zinc-400 tabular-nums sm:block">
                    {row.engagement}
                  </span>
                  <span className="hidden font-mono text-sm text-zinc-300 tabular-nums sm:block">
                    {row.payout}
                  </span>
                  <span className="flex justify-end">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-medium tracking-wide uppercase ${tier.className}`}
                    >
                      {tier.label}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
  );
}
