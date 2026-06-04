import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { dashboardPath } from "@/lib/auth/dashboardPath";
import {
  CreatorEmailSigninForm,
  CreatorInstagramButton,
} from "../signin/CreatorSigninForm";

export default async function CreatorSignupPage() {
  const session = await auth();
  if (session?.user?.userType === "CREATOR") {
    redirect(dashboardPath("CREATOR"));
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
          Create your creator account
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect Instagram or use email to track your collab requests.
        </p>
      </div>

      <CreatorInstagramButton />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-zinc-100 px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <CreatorEmailSigninForm />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/creator/signin" className="font-medium text-primary">
          Signin
        </Link>
      </p>
    </main>
  );
}
