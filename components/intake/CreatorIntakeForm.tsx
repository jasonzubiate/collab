"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Input, InputGroup } from "@heroui/react";
import { Button } from "@/components/ui/Button";
import { DeliverableSlider } from "./DeliverableSlider";
import { UsageRightsSelector } from "./UsageRightsSelector";
import { EstimatedPayoutPanel } from "./EstimatedPayoutPanel";
import type { PublicCampaign } from "@/lib/services/campaignService";
import { formatCompactNumber } from "@/lib/money";

type Step = "handle" | "evaluating" | "ineligible" | "scope" | "done";
type UsageDays = 0 | 30 | 90;

type Gatekeeper = {
  matchTier: "GREEN" | "YELLOW" | "ARCHIVED";
  passedThresholds: boolean;
  failedFollowerThreshold: boolean;
  failedEngagementThreshold: boolean;
};

type StartResponse = {
  draftId: string;
  metrics: { followerCount: number; engagementRate: number };
  gatekeeper: Gatekeeper;
};

const stepVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export function CreatorIntakeForm({
  brandSlug,
  campaign,
}: {
  brandSlug: string;
  campaign: PublicCampaign;
}) {
  const [step, setStep] = useState<Step>("handle");

  const [handle, setHandle] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [startError, setStartError] = useState<string | null>(null);

  const [draftId, setDraftId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<StartResponse["metrics"] | null>(null);
  const [gatekeeper, setGatekeeper] = useState<Gatekeeper | null>(null);

  const [reelsCount, setReelsCount] = useState(1);
  const [storiesCount, setStoriesCount] = useState(0);
  const [adUsageDays, setAdUsageDays] = useState<UsageDays>(0);

  const [estimate, setEstimate] = useState<string | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [finalPayout, setFinalPayout] = useState<string | null>(null);

  const hasDeliverable = reelsCount + storiesCount >= 1;

  const validateHandleStep = () => {
    const errors: Record<string, string> = {};
    const cleanedHandle = handle.trim().replace(/^@+/, "");
    if (!cleanedHandle) {
      errors.handle = "Instagram handle is required.";
    } else if (!/^[A-Za-z0-9._]+$/.test(cleanedHandle)) {
      errors.handle = "Only letters, numbers, periods, and underscores.";
    }
    if (!email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Enter a valid email address.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStart = async () => {
    setStartError(null);
    if (!validateHandleStep()) return;

    setStep("evaluating");
    try {
      const res = await fetch("/api/public/proposals/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandSlug,
          creatorHandle: handle.trim().replace(/^@+/, ""),
          creatorName: name.trim() || undefined,
          creatorEmail: email.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStartError(data.error ?? "Something went wrong. Try again.");
        setStep("handle");
        return;
      }
      const start = data as StartResponse;
      setDraftId(start.draftId);
      setMetrics(start.metrics);
      setGatekeeper(start.gatekeeper);
      // Brief beat on the evaluating screen for perceived diligence.
      window.setTimeout(() => {
        setStep(start.gatekeeper.passedThresholds ? "scope" : "ineligible");
      }, 650);
    } catch {
      setStartError("Network error. Please try again.");
      setStep("handle");
    }
  };

  const abortRef = useRef<AbortController | null>(null);

  const fetchEstimate = useCallback(async () => {
    if (!draftId || !hasDeliverable) {
      setEstimate(null);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setEstimateLoading(true);
    try {
      const res = await fetch("/api/public/proposals/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId,
          scope: { reelsCount, storiesCount, adUsageDays },
        }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (res.ok) setEstimate(data.formattedPayout);
    } catch (err) {
      if ((err as Error).name !== "AbortError") setEstimate(null);
    } finally {
      if (abortRef.current === controller) setEstimateLoading(false);
    }
  }, [draftId, hasDeliverable, reelsCount, storiesCount, adUsageDays]);

  useEffect(() => {
    if (step !== "scope") return;
    const timer = window.setTimeout(fetchEstimate, 250);
    return () => window.clearTimeout(timer);
  }, [step, fetchEstimate]);

  const handleSubmit = async () => {
    if (!draftId || !hasDeliverable || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/proposals/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId,
          scope: { reelsCount, storiesCount, adUsageDays },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFinalPayout(data.formattedPayout);
        setStep("done");
      } else {
        setStartError(data.error ?? "Could not submit. Please try again.");
      }
    } catch {
      setStartError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8">
        <header className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {campaign.brand.companyName}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {campaign.name}
          </h1>
        </header>

        <StepProgress step={step} />

        <div className="relative mt-6 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
              {step === "handle" && (
                <HandleStep
                  handle={handle}
                  name={name}
                  email={email}
                  errors={fieldErrors}
                  startError={startError}
                  onHandle={setHandle}
                  onName={setName}
                  onEmail={setEmail}
                  onContinue={handleStart}
                />
              )}

              {step === "evaluating" && <EvaluatingStep />}

              {step === "ineligible" && gatekeeper && (
                <IneligibleStep
                  gatekeeper={gatekeeper}
                  campaign={campaign}
                  onContinue={() => setStep("scope")}
                  onRestart={() => setStep("handle")}
                />
              )}

              {step === "scope" && (
                <section className="space-y-4">
                  {metrics && (
                    <div className="flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3">
                      <Metric
                        label="Followers"
                        value={formatCompactNumber(metrics.followerCount)}
                      />
                      <div className="h-8 w-px bg-border" />
                      <Metric
                        label="Engagement"
                        value={`${metrics.engagementRate.toFixed(1)}%`}
                      />
                    </div>
                  )}

                  <DeliverableSlider
                    label="Reels"
                    value={reelsCount}
                    onChange={setReelsCount}
                    hint="Short-form video posts"
                  />
                  <DeliverableSlider
                    label="Stories"
                    value={storiesCount}
                    onChange={setStoriesCount}
                    hint="24-hour story frames"
                  />

                  <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="mb-3 text-sm font-medium text-foreground">
                      Usage rights
                    </p>
                    <UsageRightsSelector
                      value={adUsageDays}
                      onChange={setAdUsageDays}
                    />
                  </div>

                  <EstimatedPayoutPanel
                    formattedPayout={estimate}
                    loading={estimateLoading}
                    hasDeliverable={hasDeliverable}
                  />

                  {startError && (
                    <p className="text-sm text-danger" role="alert">
                      {startError}
                    </p>
                  )}

                  <Button
                    size="lg"
                    className="w-full"
                    disabled={!hasDeliverable || estimateLoading || submitting}
                    onClick={handleSubmit}
                  >
                    {submitting ? "Submitting…" : "Submit proposal"}
                  </Button>
                </section>
              )}

              {step === "done" && (
                <DoneStep
                  payout={finalPayout}
                  eligible={gatekeeper?.passedThresholds ?? false}
                  creatorName={name.trim() || handle}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </MotionConfig>
  );
}

function StepProgress({ step }: { step: Step }) {
  const index =
    step === "handle"
      ? 0
      : step === "evaluating" || step === "ineligible"
        ? 1
        : step === "scope"
          ? 2
          : 3;
  return (
    <div className="flex gap-1.5" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
            i <= index ? "bg-primary" : "bg-border"
          }`}
        />
      ))}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function HandleStep({
  handle,
  name,
  email,
  errors,
  startError,
  onHandle,
  onName,
  onEmail,
  onContinue,
}: {
  handle: string;
  name: string;
  email: string;
  errors: Record<string, string>;
  startError: string | null;
  onHandle: (v: string) => void;
  onName: (v: string) => void;
  onEmail: (v: string) => void;
  onContinue: () => void;
}) {
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onContinue();
      }}
    >
      <p className="text-sm text-muted-foreground">
        Tell us who you are and we&apos;ll estimate your collab rate instantly.
      </p>

      <Field label="Instagram handle" error={errors.handle}>
        <InputGroup fullWidth>
          <InputGroup.Prefix>@</InputGroup.Prefix>
          <InputGroup.Input
            value={handle}
            onChange={(e) => onHandle(e.target.value)}
            placeholder="yourhandle"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </InputGroup>
      </Field>

      <Field label="Name" error={errors.name}>
        <Input
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="Optional"
          fullWidth
        />
      </Field>

      <Field label="Email" error={errors.email}>
        <Input
          value={email}
          onChange={(e) => onEmail(e.target.value)}
          type="email"
          inputMode="email"
          autoCapitalize="none"
          placeholder="you@example.com"
          fullWidth
        />
      </Field>

      {startError ? (
        <p className="text-sm text-danger" role="alert">
          {startError}
        </p>
      ) : null}

      <Button size="lg" type="submit" className="w-full">
        Continue
      </Button>
    </form>
  );
}

function EvaluatingStep() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <motion.div
        className="h-12 w-12 rounded-full border-2 border-border border-t-primary"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
      />
      <p className="mt-6 text-sm font-medium text-foreground">
        Checking your profile…
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Pulling public reach and engagement.
      </p>
    </div>
  );
}

function IneligibleStep({
  gatekeeper,
  campaign,
  onContinue,
  onRestart,
}: {
  gatekeeper: Gatekeeper;
  campaign: PublicCampaign;
  onContinue: () => void;
  onRestart: () => void;
}) {
  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-border bg-surface p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-2xl">
          🌱
        </div>
        <h2 className="mt-4 text-lg font-semibold text-foreground">
          Not a fit right now
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {gatekeeper.failedFollowerThreshold
            ? `This campaign is looking for creators with at least ${campaign.minFollowers.toLocaleString()} followers.`
            : `This campaign is looking for an engagement rate of at least ${campaign.minEngagementRate.toFixed(1)}%.`}{" "}
          You can still send your details for the brand to keep on file.
        </p>
      </div>
      <Button size="lg" variant="secondary" className="w-full" onClick={onContinue}>
        Submit my details anyway
      </Button>
      <Button variant="ghost" className="w-full" onClick={onRestart}>
        Use a different handle
      </Button>
    </section>
  );
}

function DoneStep({
  payout,
  eligible,
  creatorName,
}: {
  payout: string | null;
  eligible: boolean;
  creatorName: string;
}) {
  return (
    <section className="flex flex-col items-center py-10 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-tier-green-soft text-3xl text-tier-green"
      >
        ✓
      </motion.div>
      <h2 className="mt-5 text-xl font-semibold text-foreground">
        Proposal submitted
      </h2>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Thanks, {creatorName}. {eligible
          ? "The brand will review your request and reach out by email."
          : "Your details are on file with the brand."}
      </p>
      {eligible && payout ? (
        <div className="mt-6 w-full rounded-2xl bg-foreground p-5 text-white">
          <span className="text-xs uppercase tracking-wide text-white/60">
            Suggested rate
          </span>
          <p className="tabular-nums mt-1 text-3xl font-semibold">{payout}</p>
        </div>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="tabular-nums text-base font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}
