import Link from "next/link";

export function FinalCta({
  primaryHref,
  primaryLabel,
}: {
  primaryHref: string;
  primaryLabel: string;
}) {
  return (
    <section className="px-5 pb-20 sm:px-6 sm:pb-28">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-primary px-8 py-16 text-zinc-950 sm:px-12 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 select-none bg-[linear-gradient(to_right,rgba(9,9,11,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(9,9,11,0.06)_1px,transparent_1px)] bg-size-[48px_48px]"
        />
        <div className="relative">
          <h2 className="max-w-2xl font-display text-4xl leading-[0.95] font-extrabold tracking-tighter text-balance sm:text-6xl">
            Stop chasing creators. Start closing collabs.
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-tight text-zinc-800">
            Set your rules once and let vetted, ready-to-sign deals come to you.
          </p>
          <Link
            href={primaryHref}
            className="mt-9 inline-flex h-13 items-center justify-center rounded-full bg-zinc-950 px-8 font-mono text-sm font-medium tracking-wide text-white uppercase transition-colors hover:bg-zinc-800"
          >
            {primaryLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
