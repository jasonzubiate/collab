"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@heroui/react";
import { registerBrandAction, type AuthFormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";

const initialState: AuthFormState = {};

export function BrandSignupForm() {
  const [state, formAction, pending] = useActionState(
    registerBrandAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="name"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Your name
        </label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          placeholder="Alex Rivera"
          fullWidth
        />
      </div>

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
          placeholder="Example Studio"
          fullWidth
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Work email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          required
          placeholder="you@brand.com"
          fullWidth
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="At least 8 characters"
          fullWidth
        />
      </div>

      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create brand account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/brand/signin" className="font-medium text-primary">
          Signin
        </Link>
      </p>
    </form>
  );
}
