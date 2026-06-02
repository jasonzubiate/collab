"use client";

import { cn } from "@/lib/cn";

type UsageDays = 0 | 30 | 90;

const OPTIONS: { value: UsageDays; title: string; sub: string }[] = [
  { value: 0, title: "No ad usage", sub: "Organic only" },
  { value: 30, title: "30 days", sub: "Paid ads" },
  { value: 90, title: "90 days", sub: "Paid ads" },
];

export function UsageRightsSelector({
  value,
  onChange,
}: {
  value: UsageDays;
  onChange: (value: UsageDays) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Usage rights"
      className="grid grid-cols-3 gap-2"
    >
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex min-h-[64px] flex-col items-center justify-center rounded-xl border px-2 py-3 text-center transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border bg-surface hover:bg-surface-muted",
            )}
          >
            <span
              className={cn(
                "text-sm font-semibold",
                selected ? "text-primary" : "text-foreground",
              )}
            >
              {option.title}
            </span>
            <span className="mt-0.5 text-[11px] text-muted-foreground">
              {option.sub}
            </span>
          </button>
        );
      })}
    </div>
  );
}
