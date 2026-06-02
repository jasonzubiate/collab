"use client";

import { useActionState } from "react";
import { Input } from "@heroui/react";
import { requestCreatorMagicLink, type AuthFormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";

const initialState: AuthFormState = {};

export function CreatorEmailSigninForm() {
  const [state, formAction, pending] = useActionState(
    requestCreatorMagicLink,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          required
          placeholder="you@example.com"
          fullWidth
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          We&apos;ll email you a signin link. Matches proposals you submitted
          with this email.
        </p>
      </div>

      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="text-sm text-tier-green" role="status">
          {state.success}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Sending link…" : "Email me a signin link"}
      </Button>
    </form>
  );
}

export function CreatorInstagramButton() {
  return (
    <a
      href="/api/auth/creator/instagram"
      className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-surface font-medium text-foreground ring-1 ring-border-strong transition-colors hover:bg-surface-muted"
    >
      Continue with Instagram
    </a>
  );
}
