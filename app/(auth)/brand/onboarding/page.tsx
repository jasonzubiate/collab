import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { dashboardPath, signinPath } from "@/lib/auth/dashboardPath";
import { BrandOnboardingForm } from "./BrandOnboardingForm";

export default async function BrandOnboardingPage() {
  const session = await auth();

  if (!session?.user || session.user.userType !== "BRAND") {
    redirect(signinPath("BRAND"));
  }
  if (session.user.brandId) {
    redirect(dashboardPath("BRAND"));
  }

  return (
    <main className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-zinc-100 p-8 shadow-xl shadow-zinc-950/10">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          Collab
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
          Name your brand
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You&apos;re signed in as {session.user.email}. Add your company name to
          finish setting up your workspace.
        </p>
      </div>
      <BrandOnboardingForm />
    </main>
  );
}
