"use client";

import { useActionState } from "react";
import { Input } from "@heroui/react";
import { completeBrandOnboarding, type AuthFormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";

const initialState: AuthFormState = {};

export function BrandOnboardingForm() {
  const [state, formAction, pending] = useActionState(
    completeBrandOnboarding,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="companyName"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Brand / company name
        </label>
        <Input
          id="companyName"
          name="companyName"
          type="text"
          required
          autoFocus
          placeholder="Example Studio"
          fullWidth
        />
      </div>

      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Setting up…" : "Continue"}
      </Button>
    </form>
  );
}
