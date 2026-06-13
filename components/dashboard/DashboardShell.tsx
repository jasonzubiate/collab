import { DashboardAccountMenu } from "./DashboardAccountMenu";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardThemeProvider } from "./DashboardThemeProvider";
import type { DashboardNavLink, DashboardUser } from "./types";

type DashboardShellProps = {
  homeHref: string;
  identityLabel: string;
  links: DashboardNavLink[];
  user: DashboardUser;
  children: React.ReactNode;
};

export function DashboardShell({
  children,
  homeHref,
  identityLabel,
  links,
  user,
}: DashboardShellProps) {
  return (
    <DashboardThemeProvider>
      <DashboardSidebar
        homeHref={homeHref}
        identityLabel={identityLabel}
        links={links}
      />
      <DashboardAccountMenu
        user={user}
        className="fixed top-3.5 right-4 z-40 md:top-6 md:right-8"
      />
      <div className="pt-14 md:pt-0 md:pl-[220px]">
        <main className="mx-auto max-w-6xl px-6 pt-20 pb-40 sm:px-8">
          {children}
        </main>
      </div>
    </DashboardThemeProvider>
  );
}
