import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { dashboardPath } from "@/lib/auth/dashboardPath";
import { BrandSigninForm } from "./BrandSigninForm";

export default async function BrandSigninPage() {
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
          Brand signin
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage campaigns and review creator proposals.
        </p>
      </div>
      <BrandSigninForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Are you a creator?{" "}
        <Link href="/creator/signin" className="font-medium text-primary">
          Creator signin
        </Link>
      </p>
    </main>
  );
}
