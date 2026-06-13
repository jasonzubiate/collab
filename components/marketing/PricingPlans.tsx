import Link from "next/link";

import { ChecklistIcon } from "@/components/marketing/ChecklistIcon";
import {
  PLANS,
  PRICING_FOOTNOTES,
  SHARED_FEATURES,
  formatPlanPrice,
  type PlanId,
  type PricingCta,
} from "@/lib/marketing/plans";
import { cn } from "@/lib/cn";

const PLAN_THEMES: Record<
  PlanId,
  {
    card: string;
    badge: string;
    title: string;
    tagline: string;
    price: string;
    priceSuffix: string;
    featureText: string;
    iconClassName: string;
    checkMark: string;
    cta: string;
  }
> = {
  pro: {
    card: "bg-surface-muted text-zinc-950",
    badge:
      "inline-flex w-fit rounded-full bg-primary px-3 py-1 text-primary-foreground",
    title: "text-zinc-950",
    tagline: "text-muted-foreground",
    price: "text-zinc-950",
    priceSuffix: "text-muted-foreground",
    featureText: "text-zinc-700",
    iconClassName: "text-zinc-900",
    checkMark: "#ffffff",
    cta: "bg-zinc-950 text-white hover:bg-zinc-800",
  },
  team: {
    card: "bg-zinc-950 text-white",
    badge: "text-primary",
    title: "text-white",
    tagline: "text-zinc-400",
    price: "text-white",
    priceSuffix: "text-zinc-400",
    featureText: "text-zinc-200",
    iconClassName: "text-primary",
    checkMark: "#09090b",
    cta: "bg-white text-zinc-950 hover:bg-zinc-200",
  },
};

export function PricingPlans({ cta }: { cta: PricingCta }) {
  return (
    <section
      aria-labelledby="pricing-plans-heading"
      className="px-4 pb-16 sm:px-6 sm:pb-20"
    >
      <div className="mx-auto max-w-5xl">
        <h2 id="pricing-plans-heading" className="sr-only">
          Subscription plans
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {PLANS.map((plan) => {
            const headingId = `plan-${plan.id}`;
            const theme = PLAN_THEMES[plan.id];

            return (
              <section
                key={plan.id}
                aria-labelledby={headingId}
                className={cn(
                  "flex flex-col rounded-3xl p-8 sm:p-10",
                  theme.card,
                )}
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3
                    id={headingId}
                    className={cn(
                      "font-display text-3xl leading-[0.95] font-extrabold tracking-tighter text-balance sm:text-4xl",
                      theme.title,
                    )}
                  >
                    {plan.name}
                  </h3>
                  {plan.badge ? (
                    <span
                      className={cn(
                        "shrink-0 font-mono text-xs font-medium tracking-wide uppercase",
                        theme.badge,
                      )}
                    >
                      {plan.badge}
                    </span>
                  ) : null}
                </div>
                <p
                  className={cn(
                    "mt-2 text-sm leading-tight",
                    theme.tagline,
                  )}
                >
                  {plan.tagline}
                </p>

                <p className="mt-6 flex items-baseline gap-1 tabular-nums">
                  <span
                    className={cn(
                      "font-display text-5xl font-extrabold tracking-tighter",
                      theme.price,
                    )}
                  >
                    {formatPlanPrice(plan.priceMonthlyCents)}
                  </span>
                  <span className={cn("text-sm", theme.priceSuffix)}>/mo</span>
                </p>

                <ul
                  className={cn("mt-6 space-y-3", theme.featureText)}
                  style={{ ["--check-mark" as string]: theme.checkMark }}
                >
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm leading-tight"
                    >
                      <ChecklistIcon
                        className={cn(
                          "mt-0.5 h-5 w-5 shrink-0",
                          theme.iconClassName,
                        )}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={cta.href}
                  className={cn(
                    "mt-8 inline-flex h-13 w-full items-center justify-center rounded-full px-8 font-mono text-sm font-medium tracking-wide uppercase transition-colors",
                    theme.cta,
                  )}
                >
                  {cta.label}
                </Link>
              </section>
            );
          })}
        </div>

        <div
          className="mt-10 rounded-3xl bg-surface-muted p-7 sm:p-8"
          style={{ ["--check-mark" as string]: "#ffffff" }}
        >
          <p className="font-mono text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Included in every plan
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {SHARED_FEATURES.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-3 text-sm leading-tight text-zinc-700"
              >
                <ChecklistIcon className="mt-0.5 h-5 w-5 shrink-0 text-zinc-900" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <ul className="mt-6 flex flex-col gap-1 text-center text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-6">
          {PRICING_FOOTNOTES.map((note) => (
            <li key={note}>{note}</li>
          ))}
          <li>
            <span className="text-muted-foreground">
              *Team proposal volume subject to fair use
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}
