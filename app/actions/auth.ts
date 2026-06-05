"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn, signOut, unstable_update } from "@/auth";
import { dashboardPath } from "@/lib/auth/dashboardPath";
import {
  GOOGLE_INTENT_COOKIE,
  type GoogleIntent,
} from "@/lib/auth/googleIntent";
import {
  createBrandForUser,
  registerBrand,
} from "@/lib/services/brandAuthService";
import { createCreatorMagicLinkToken } from "@/lib/services/creatorAuthService";
import {
  brandOnboardingSchema,
  brandSignupSchema,
  creatorEmailSchema,
  signinSchema,
} from "@/lib/validation/authSchemas";

export type AuthFormState = { error?: string; success?: string };

export async function startGoogleAuth(intent: GoogleIntent): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(GOOGLE_INTENT_COOKIE, intent, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  await signIn("google", {
    redirectTo:
      intent === "brand" ? "/brand/onboarding" : dashboardPath("CREATOR"),
  });
}

export async function completeBrandOnboarding(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const session = await auth();
  if (!session?.user || session.user.userType !== "BRAND") {
    return { error: "Sign in as a brand to continue." };
  }
  if (session.user.brandId) {
    redirect(dashboardPath("BRAND"));
  }

  const parsed = brandOnboardingSchema.safeParse({
    companyName: formData.get("companyName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await createBrandForUser(
    session.user.id,
    parsed.data.companyName,
  );
  if (!result.ok) {
    return { error: result.error };
  }

  await unstable_update({ user: { brandId: result.brandId } });

  redirect("/admin/campaigns?onboarding=1");
}

/** @deprecated Use AuthFormState */
export type LoginState = AuthFormState;

export async function authenticateBrand(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signinSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "Invalid email or password." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: dashboardPath("BRAND"),
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }
}

export async function registerBrandAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = brandSignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    companyName: formData.get("companyName"),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid input.";
    return { error: first };
  }

  const result = await registerBrand(parsed.data);
  if (!result.ok) {
    return { error: result.error };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/admin/campaigns?onboarding=1",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created but signin failed. Try again." };
    }
    throw error;
  }
}

export async function requestCreatorMagicLink(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = creatorEmailSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email address." };
  }

  const { verifyUrl } = await createCreatorMagicLinkToken(parsed.data.email);

  if (process.env.NODE_ENV !== "production") {
    console.info("[creator magic link]", verifyUrl);
  }

  return {
    success: `Check your email for a signin link. ${
      process.env.NODE_ENV !== "production"
        ? `(Dev: ${verifyUrl})`
        : ""
    }`.trim(),
  };
}

export async function completeCreatorSession(
  token: string,
): Promise<AuthFormState> {
  try {
    await signIn("creator-session", {
      token,
      redirectTo: dashboardPath("CREATOR"),
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "This signin link has expired. Request a new one." };
    }
    throw error;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

/** @deprecated Use authenticateBrand */
export const authenticate = authenticateBrand;
