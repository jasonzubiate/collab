import Image from "next/image";
import Link from "next/link";

export function LandingNav({
  dashboardHref,
}: {
  dashboardHref: string | null;
}) {
  return (
    <header className="fixed top-4 right-4 left-4 z-50 md:top-6">
      <div className="mx-auto flex w-full max-w-xl items-center justify-between rounded-3xl bg-white/70 p-3 backdrop-blur-md sm:px-5">
        <Link href="/" aria-label="Collab home" className="shrink-0">
          <Image
            src="/collab-full-logo.png"
            alt="Collab"
            width={484}
            height={120}
            className="h-7 w-auto"
            style={{ width: "auto", height: "1.75rem" }}
            priority
          />
        </Link>

        {dashboardHref ? (
          <Link
            href={dashboardHref}
            className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 font-mono text-xs font-medium tracking-wide text-primary-foreground uppercase transition-colors hover:bg-primary-hover"
          >
            Go to dashboard
          </Link>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/creator/signin"
              aria-label="Creator sign in"
              className="inline-flex h-11 items-center justify-center rounded-full bg-surface px-5 font-mono text-xs font-medium tracking-wide text-foreground uppercase ring-1 ring-border-strong transition-colors hover:bg-surface-muted"
            >
              <span className="sm:hidden">Creator</span>
              <span className="hidden sm:inline">Creator sign in</span>
            </Link>
            <Link
              href="/brand/signin"
              aria-label="Brand sign in"
              className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 font-mono text-xs font-medium tracking-wide text-primary-foreground uppercase transition-colors hover:bg-primary-hover"
            >
              <span className="sm:hidden">Brand</span>
              <span className="hidden sm:inline">Brand sign in</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
