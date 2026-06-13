"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, Megaphone, Menu, Settings, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DashboardNavIcon, DashboardNavLink } from "./types";

const navIcons: Record<DashboardNavIcon, LucideIcon> = {
  inbox: Inbox,
  megaphone: Megaphone,
  settings: Settings,
};

type DashboardSidebarProps = {
  homeHref: string;
  identityLabel: string;
  links: DashboardNavLink[];
};

function NavLinks({
  links,
  pathname,
  onNavigate,
}: {
  links: DashboardNavLink[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {links.map((link) => {
        const active = pathname.startsWith(link.href);
        const Icon = navIcons[link.icon];
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-2 py-2.5 text-base font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon size={20} strokeWidth={2} aria-hidden />
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

function SidebarLogo({
  homeHref,
  identityLabel,
}: Pick<DashboardSidebarProps, "homeHref" | "identityLabel">) {
  return (
    <Link
      href={homeHref}
      className="ml-2 inline-flex shrink-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Image
        src="/collab-icon.svg"
        alt={identityLabel}
        width={32}
        height={32}
        className="h-8 w-8"
      />
    </Link>
  );
}

export function DashboardSidebar({
  homeHref,
  identityLabel,
  links,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center bg-background px-4 md:hidden">
        <SidebarLogo homeHref={homeHref} identityLabel={identityLabel} />
        <div className="flex-1" />
        <button
          type="button"
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
          className="mr-11 rounded-md p-2 text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {mobileOpen ? (
            <X size={20} strokeWidth={1.5} />
          ) : (
            <Menu size={20} strokeWidth={1.5} />
          )}
        </button>
      </header>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 md:hidden"
          onClick={closeMobile}
          aria-hidden
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col bg-background px-4 py-6 transition-transform duration-200 motion-reduce:transition-none md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarLogo homeHref={homeHref} identityLabel={identityLabel} />
        <nav aria-label="Dashboard" className="mt-8 flex flex-col gap-0.5">
          <NavLinks
            links={links}
            pathname={pathname}
            onNavigate={closeMobile}
          />
        </nav>
      </aside>

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[220px] flex-col bg-background px-4 py-6 md:flex">
        <SidebarLogo homeHref={homeHref} identityLabel={identityLabel} />
        <nav aria-label="Dashboard" className="mt-8 flex flex-col gap-0.5">
          <NavLinks links={links} pathname={pathname} />
        </nav>
      </aside>
    </>
  );
}
