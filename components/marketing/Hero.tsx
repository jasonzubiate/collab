import Link from "next/link";

import { DashboardMock } from "@/components/marketing/AppPreview";

const TRUST_ITEMS = [
  "Built for Instagram",
  "Auto-vetted matches",
  "Instant payout pricing",
];

export function Hero({
  primaryHref,
  primaryLabel,
}: {
  primaryHref: string;
  primaryLabel: string;
}) {
  return (
    <section className="relative overflow-x-clip bg-primary text-zinc-950">
      <div className="relative mx-auto max-w-5xl px-5 pt-32 pb-20 sm:px-6 sm:pt-40 sm:pb-24">
        <div className="text-center">
          <h1 className="mx-auto max-w-3xl font-display text-5xl leading-[0.92] font-extrabold tracking-tighter text-balance sm:text-7xl">
            Your creator collabs just got smarter
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-tight text-zinc-800 sm:text-xl">
            Collab turns every DM and intake form into vetted, priced,
            ready-to-sign creator deals — so you stop guessing on fit, rates, and
            contracts.
          </p>

          <div className="mt-9">
            <Link
              href={primaryHref}
              className="inline-flex h-13 items-center justify-center rounded-full bg-zinc-950 px-8 font-mono text-sm font-medium tracking-wide text-white uppercase transition-colors hover:bg-zinc-800"
            >
              {primaryLabel}
            </Link>
          </div>
        </div>

        <ul className="mt-10 mb-12 flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-xs tracking-wide text-zinc-700 uppercase">
          {TRUST_ITEMS.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-950"
              />
              {item}
            </li>
          ))}
        </ul>

        <DashboardMock className="shadow-2xl shadow-zinc-950/25" />
      </div>
    </section>
  );
}
