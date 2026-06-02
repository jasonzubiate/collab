import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { dashboardPath } from "@/lib/auth/dashboardPath";
import {
  CreatorEmailSigninForm,
  CreatorInstagramButton,
} from "./CreatorSigninForm";

export default async function CreatorSigninPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user?.userType === "CREATOR") {
    redirect(dashboardPath("CREATOR"));
  }

  const params = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          Collab
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
          Creator signin
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View your collaboration requests and brand replies.
        </p>
      </div>

      {params.error ? (
        <p className="mb-4 text-sm text-danger" role="alert">
          {params.error}
        </p>
      ) : null}

      <CreatorInstagramButton />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <CreatorEmailSigninForm />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/creator/signup" className="font-medium text-primary">
          Signup
        </Link>
        {" · "}
        Are you a brand?{" "}
        <Link href="/brand/signin" className="font-medium text-primary">
          Brand signin
        </Link>
      </p>
    </main>
  );
}
