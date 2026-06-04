import Link from "next/link";

const BEFORE_ITEMS = [
  "Digging through hashtags and DMs to find creators who actually fit your brand.",
  "Manually checking follower counts and engagement before every outreach.",
  "Guessing at fair rates and negotiating deliverables one message at a time.",
  "Chasing contracts over email while the creators you want go cold.",
];

const AFTER_ITEMS = [
  "Creators come to you through a branded intake link and Instagram DMs.",
  "Every applicant is auto-vetted against your follower and engagement rules.",
  "Deliverables and payouts are priced instantly, so terms are clear up front.",
  "Approve, counter, or pass in one click — contracts move at the speed of DMs.",
];

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className={className}
    >
      <rect width="20" height="20" rx="6" fill="currentColor" />
      <path
        d="M6 10.5l2.5 2.5L14 7.5"
        stroke="var(--check-mark, #ffffff)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChecklistRow({
  children,
  iconClassName,
  rowClassName,
}: {
  children: React.ReactNode;
  iconClassName: string;
  rowClassName: string;
}) {
  return (
    <li
      className={`flex items-start gap-4 border-t py-4 first:border-t-0 ${rowClassName}`}
    >
      <CheckIcon className={`mt-0.5 h-5 w-5 shrink-0 ${iconClassName}`} />
      <span className="max-w-md font-mono text-xs leading-relaxed tracking-wide uppercase">
        {children}
      </span>
    </li>
  );
}

export function BeforeAfter({ primaryHref }: { primaryHref: string }) {
  return (
    <section className="bg-background px-5 pt-36 pb-20 sm:px-6 sm:pt-48 sm:pb-28">
      <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
        <h2 className="font-display text-3xl leading-[0.95] font-extrabold tracking-tight text-zinc-950 text-balance sm:text-5xl">
          Working with creators should be as easy as a DM
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground text-balance">
          Collab turns the messy hunt for the right creators into a single,
          streamlined pipeline — from first hello to signed contract.
        </p>
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
        {/* Before */}
        <div className="flex flex-col rounded-3xl bg-surface-muted p-8 sm:p-10">
          <p className="font-mono text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Before Collab
          </p>
          <h3 className="mt-4 font-display text-3xl leading-[0.95] font-extrabold tracking-tight text-zinc-950 text-balance sm:text-4xl">
            Finding creators the hard way
          </h3>

          <ul
            className="mt-auto flex flex-col pt-10 text-zinc-700"
            style={{ ["--check-mark" as string]: "#ffffff" }}
          >
            {BEFORE_ITEMS.map((item) => (
              <ChecklistRow
                key={item}
                rowClassName="border-zinc-300"
                iconClassName="text-zinc-900"
              >
                {item}
              </ChecklistRow>
            ))}
          </ul>

          <Link
            href={primaryHref}
            className="mt-8 inline-flex h-13 items-center justify-center rounded-full bg-zinc-950 px-6 font-mono text-sm font-medium tracking-wide text-white uppercase transition-colors hover:bg-zinc-800"
          >
            Get started
          </Link>
        </div>

        {/* After */}
        <div
          className="flex flex-col rounded-3xl bg-zinc-950 p-8 text-white sm:p-10"
          style={{ ["--check-mark" as string]: "#09090b" }}
        >
          <p className="font-mono text-xs font-medium tracking-wide text-primary uppercase">
            After Collab
          </p>
          <h3 className="mt-4 font-display text-3xl leading-[0.95] font-extrabold tracking-tight text-balance sm:text-4xl">
            Vetted, priced, and ready to sign
          </h3>

          <ul className="mt-auto flex flex-col pt-10 text-zinc-200">
            {AFTER_ITEMS.map((item) => (
              <ChecklistRow
                key={item}
                rowClassName="border-white/10"
                iconClassName="text-primary"
              >
                {item}
              </ChecklistRow>
            ))}
          </ul>

          <Link
            href={primaryHref}
            className="mt-8 inline-flex h-13 items-center justify-center rounded-full bg-white px-6 font-mono text-sm font-medium tracking-wide text-zinc-950 uppercase transition-colors hover:bg-zinc-200"
          >
            Get started
          </Link>
        </div>
      </div>
    </section>
  );
}
