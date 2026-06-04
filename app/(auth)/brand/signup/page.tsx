import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { dashboardPath } from "@/lib/auth/dashboardPath";
import { BrandSignupForm } from "./BrandSignupForm";

export default async function BrandSignupPage() {
  const session = await auth();
  if (session?.user?.userType === "BRAND") {
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
          Create your brand account
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set up campaigns, pricing rules, and your creator intake link.
        </p>
      </div>
      <BrandSignupForm />
    </main>
  );
}
