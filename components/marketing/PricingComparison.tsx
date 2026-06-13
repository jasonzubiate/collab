import { Check, Minus } from "lucide-react";

import { COMPARISON_ROWS, PLANS } from "@/lib/marketing/plans";

function ComparisonCell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <span className="inline-flex items-center justify-center">
        <Check
          aria-label="Included"
          className="size-4 text-primary"
          strokeWidth={2.5}
        />
      </span>
    ) : (
      <span className="inline-flex items-center justify-center">
        <Minus
          aria-label="Not included"
          className="size-4 text-muted-foreground"
          strokeWidth={2}
        />
      </span>
    );
  }

  return <span className="tabular-nums">{value}</span>;
}

export function PricingComparison() {
  return (
    <section
      aria-labelledby="pricing-comparison-heading"
      className="px-4 pb-16 sm:px-6 sm:pb-20"
    >
      <div className="mx-auto max-w-5xl">
        <h2
          id="pricing-comparison-heading"
          className="font-display text-3xl leading-[0.95] font-extrabold tracking-tighter text-balance text-foreground sm:text-4xl"
        >
          Compare plans
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-tight text-muted-foreground">
          A quick look at limits and collaboration features across Pro and Team.
        </p>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-md text-left text-sm">
            <caption className="sr-only">
              Feature comparison between Collab Pro and Team plans
            </caption>
            <thead>
              <tr className="border-b border-border">
                <th
                  scope="col"
                  className="px-5 py-4 font-mono text-xs font-medium tracking-wide text-muted-foreground uppercase"
                >
                  Feature
                </th>
                {PLANS.map((plan) => (
                  <th
                    key={plan.id}
                    scope="col"
                    className="px-5 py-4 text-center font-semibold text-foreground"
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, index) => (
                <tr
                  key={row.label}
                  className={
                    index < COMPARISON_ROWS.length - 1
                      ? "border-b border-border"
                      : undefined
                  }
                >
                  <th
                    scope="row"
                    className="px-5 py-4 font-medium text-foreground"
                  >
                    {row.label}
                  </th>
                  <td className="px-5 py-4 text-center text-muted-foreground">
                    <ComparisonCell value={row.pro} />
                  </td>
                  <td className="px-5 py-4 text-center text-muted-foreground">
                    <ComparisonCell value={row.team} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
