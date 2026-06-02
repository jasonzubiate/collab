"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

type DeliverableSliderProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
  hint?: string;
};

export function DeliverableSlider({
  label,
  value,
  onChange,
  max = 5,
  hint,
}: DeliverableSliderProps) {
  const id = useId();
  const ticks = Array.from({ length: max + 1 }, (_, i) => i);

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        <span className="tabular-nums text-2xl font-semibold text-foreground">
          {value}
        </span>
      </div>
      {hint ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
      <input
        id={id}
        type="range"
        min={0}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={`${value} ${label}`}
        className="mt-3 h-11 w-full cursor-pointer accent-primary"
      />
      <div className="mt-1 flex justify-between px-1">
        {ticks.map((tick) => (
          <button
            key={tick}
            type="button"
            onClick={() => onChange(tick)}
            aria-label={`Set ${label} to ${tick}`}
            className={cn(
              "tabular-nums text-xs transition-colors",
              tick === value
                ? "font-semibold text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tick}
          </button>
        ))}
      </div>
    </div>
  );
}
