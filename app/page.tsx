import Link from "next/link";
import { auth } from "@/auth";
import { dashboardPath } from "@/lib/auth/dashboardPath";
import { cn } from "@/lib/cn";

function PrimaryLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-base font-medium text-primary-foreground transition-colors hover:bg-primary-hover",
        className,
      )}
    >
      {children}
    </Link>
  );
}

function SecondaryLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-12 items-center justify-center rounded-lg bg-surface px-6 text-base font-medium text-foreground ring-1 ring-border-strong transition-colors hover:bg-surface-muted",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export default async function HomePage() {
  const session = await auth();
  const dashboardHref = session?.user?.userType
    ? dashboardPath(session.user.userType)
    : null;

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Collab
          </span>
          <nav className="flex items-center gap-4 text-sm">
            {dashboardHref ? (
              <Link
                href={dashboardHref}
                className="font-medium text-primary hover:text-primary-hover"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/brand/signin"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Brand signin
                </Link>
                <Link
                  href="/creator/signin"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Creator signin
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Collaboration intake that works for brands and creators
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Brands automate creator requests, pricing, and triage. Creators
            submit collab requests and track responses in one place.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <section className="rounded-xl border border-border bg-surface p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              For brands
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
              Manage campaigns and review proposals
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Set pricing rules, connect Instagram, and triage incoming creator
              requests from web intake and DMs.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {dashboardHref && session?.user?.userType === "BRAND" ? (
                <PrimaryLink href={dashboardHref}>Open dashboard</PrimaryLink>
              ) : (
                <>
                  <PrimaryLink href="/brand/signup">Signup</PrimaryLink>
                  <SecondaryLink href="/brand/signin">Signin</SecondaryLink>
                </>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              For creators
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
              Track your collaboration requests
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Signin to see proposal status, estimated payouts, and brand
              replies from Instagram and web submissions.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {dashboardHref && session?.user?.userType === "CREATOR" ? (
                <PrimaryLink href={dashboardHref}>View requests</PrimaryLink>
              ) : (
                <>
                  <PrimaryLink href="/creator/signin">Signin</PrimaryLink>
                  <SecondaryLink href="/creator/signup">Signup</SecondaryLink>
                </>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
