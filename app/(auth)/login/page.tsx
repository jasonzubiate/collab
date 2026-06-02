import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/admin/proposals");

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <div className="mb-8">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          Collab
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
          Admin sign in
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage campaigns and review creator proposals.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
