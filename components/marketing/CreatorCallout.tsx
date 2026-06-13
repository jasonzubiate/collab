import Link from "next/link";

const CREATOR_POINTS = [
  "Submit collab requests in seconds",
  "See your estimated payout instantly",
  "Track every brand reply in one place",
];

export function CreatorCallout() {
  return (
    <section className="bg-background px-5 pb-20 sm:px-6 sm:pb-28">
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-8 rounded-3xl border border-border bg-surface p-8 sm:p-10 lg:flex-row lg:items-center">
        <div className="max-w-xl">
          <p className="font-mono text-xs font-medium tracking-wide text-muted-foreground uppercase">
            For creators
          </p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tighter text-foreground sm:text-3xl">
            Pitch brands without the guesswork
          </h2>
          <ul className="mt-6 flex flex-col gap-3">
            {CREATOR_POINTS.map((point) => (
              <li
                key={point}
                className="flex items-center gap-3 text-sm text-muted-foreground"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden
                    className="h-3 w-3"
                  >
                    <path
                      d="M5 10.5l3 3L15 6.5"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
          <Link
            href="/creator/signup"
            className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 font-mono text-sm font-medium tracking-wide text-primary-foreground uppercase transition-colors hover:bg-primary-hover"
          >
            Creator sign up
          </Link>
          <Link
            href="/creator/signin"
            className="inline-flex h-12 items-center justify-center rounded-full bg-surface px-6 font-mono text-sm font-medium tracking-wide text-foreground uppercase ring-1 ring-border-strong transition-colors hover:bg-surface-muted"
          >
            Creator sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
