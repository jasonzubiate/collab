"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";

type EstimatedPayoutPanelProps = {
  formattedPayout: string | null;
  loading: boolean;
  hasDeliverable: boolean;
};

export function EstimatedPayoutPanel({
  formattedPayout,
  loading,
  hasDeliverable,
}: EstimatedPayoutPanelProps) {
  return (
    <div className="rounded-2xl bg-foreground p-5 text-white">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-white/60">
          Estimated payout
        </span>
        <span
          className={cn(
            "h-2 w-2 rounded-full transition-colors",
            loading ? "animate-pulse bg-amber-400" : "bg-emerald-400",
          )}
          aria-hidden
        />
      </div>
      <div className="mt-1 flex h-12 items-center">
        {!hasDeliverable ? (
          <p className="text-sm text-white/60">
            Select at least one reel or story.
          </p>
        ) : (
          <motion.span
            key={formattedPayout ?? "loading"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="tabular-nums text-4xl font-semibold"
          >
            {formattedPayout ?? "—"}
          </motion.span>
        )}
      </div>
      <p className="mt-1 text-xs text-white/50">
        A suggested rate based on your reach and selected deliverables.
      </p>
    </div>
  );
}
