"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@heroui/react";
import { authenticateBrand, type AuthFormState } from "@/app/actions/auth";
import { Button } from "@/components/ui/Button";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

const initialState: AuthFormState = {};

export function BrandSigninForm() {
  const [state, formAction, pending] = useActionState(
    authenticateBrand,
    initialState,
  );

  return (
    <>
      <GoogleAuthButton intent="brand" />
      <AuthDivider label="or sign in with email" />
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
            autoComplete="current-password"
            required
            placeholder="••••••••"
            fullWidth
          />
        </div>

        {state.error ? (
          <p className="text-sm text-danger" role="alert">
            {state.error}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          variant="secondary"
          className="w-full"
          disabled={pending}
        >
          {pending ? "Signing in…" : "Signin"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          New brand?{" "}
          <Link href="/brand/signup" className="font-medium text-primary">
            Signup
          </Link>
        </p>
      </form>
    </>
  );
}
