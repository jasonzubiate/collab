import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { dashboardPath } from "@/lib/auth/dashboardPath";
import { CreatorSessionComplete } from "./CreatorSessionComplete";

export default async function CreatorSigninCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const session = await auth();
  if (session?.user?.userType === "CREATOR") {
    redirect(dashboardPath("CREATOR"));
  }

  const params = await searchParams;
  if (!params.token) {
    redirect("/creator/signin?error=missing_token");
  }

  return (
    <main className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-zinc-100 p-8 shadow-xl shadow-zinc-950/10">
      <Link
        href="/"
        className="mb-8 text-sm font-semibold tracking-tight text-foreground"
      >
        Collab
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Signing you in
      </h1>
      <div className="mt-4">
        <CreatorSessionComplete token={params.token} />
      </div>
    </main>
  );
}
