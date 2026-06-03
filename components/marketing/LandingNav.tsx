"use client";

import { buttonVariants } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

const ctaClassName =
  "!bg-[#17F99A] text-xs font-medium font-mono tracking-wide !text-zinc-900 uppercase hover:!bg-[#14e08c]";

function NavCta({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ size: "lg", variant: "primary" }),
        ctaClassName,
      )}
    >
      {children}
    </Link>
  );
}

export function LandingNav({
  dashboardHref,
}: {
  dashboardHref: string | null;
}) {
  return (
    <header className="fixed top-4 md:top-6 right-4 left-4 z-50">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between rounded-3xl bg-white/70 p-4 backdrop-blur-md sm:px-5">
        <Link href="/" aria-label="Collab home" className="shrink-0">
          <Image
            src="/collab-full-logo.png"
            alt=""
            width={484}
            height={120}
            className="h-7"
            style={{ width: "auto", height: "1.75rem" }}
            priority
          />
        </Link>

        {dashboardHref ? (
          <NavCta href={dashboardHref}>GO TO DASHBOARD</NavCta>
        ) : (
          <div className="flex items-center gap-2">
            <NavCta href="/brand/signin">BRAND SIGN IN</NavCta>
            <NavCta href="/creator/signin">CREATOR SIGN IN</NavCta>
          </div>
        )}
      </div>
    </header>
  );
}
