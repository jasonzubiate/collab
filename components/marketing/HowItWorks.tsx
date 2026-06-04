const STEPS = [
  {
    step: "01",
    title: "Set your pricing and match rules",
    body: "Define minimum followers, engagement, and per-deliverable rates once. Collab uses them to score every creator who applies.",
  },
  {
    step: "02",
    title: "Share your link and connect Instagram",
    body: "Drop your branded intake link anywhere, and route inbound DMs straight into the same pipeline — no manual triage.",
  },
  {
    step: "03",
    title: "Auto-triage applicants and lock the contract",
    body: "Vetted matches arrive pre-priced with clear deliverables and payouts. Approve, counter, or pass in a click.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-background px-5 pb-20 sm:px-6 sm:pb-28">
      <div className="mx-auto max-w-5xl">
        <h2 className="max-w-2xl font-display text-3xl leading-[0.95] font-extrabold tracking-tight text-zinc-950 text-balance sm:text-5xl">
          From first DM to signed deal
        </h2>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Three steps replace the spreadsheets, the back-and-forth, and the
          guesswork.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.step}
              className="rounded-2xl border border-border bg-surface p-7"
            >
              <span className="font-mono text-sm font-medium tracking-wide text-muted-foreground">
                {s.step}
              </span>
              <div className="mt-6 h-px w-full bg-border" />
              <h3 className="mt-6 text-xl font-semibold text-foreground">
                {s.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
