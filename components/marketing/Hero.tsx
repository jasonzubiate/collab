import Link from "next/link";

import { HeroVisual } from "@/components/marketing/HeroVisual";

export function Hero({
  primaryHref,
  primaryLabel,
}: {
  primaryHref: string;
  primaryLabel: string;
}) {
  return (
    <section className="relative overflow-x-clip bg-primary text-zinc-950">
      <div className="relative mx-auto max-w-5xl px-5 pt-40 pb-28 sm:px-6 sm:pt-44 sm:pb-32 lg:overflow-visible lg:pb-36">
        <div className="text-center">
          <h1 className="mx-auto max-w-4xl font-display text-4xl leading-[0.92] font-extrabold tracking-tighter text-balance sm:text-8xl">
            Your creator collabs just got smarter
          </h1>

          <p className="mx-auto mt-6 max-w-xs text-lg leading-tight text-zinc-800 sm:max-w-xl sm:text-xl">
            Inbound DMs. Auto-vetted matches. Upfront pricing. Collab turns
            Instagram into your creator pipeline.
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

        <HeroVisual className="mt-14 lg:mt-16" />
      </div>
    </section>
  );
}
