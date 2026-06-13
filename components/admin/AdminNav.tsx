import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type { DashboardNavLink } from "@/components/dashboard/types";

const links: DashboardNavLink[] = [
  { href: "/admin/proposals", label: "Proposals", icon: "inbox" },
  { href: "/admin/campaigns", label: "Campaigns", icon: "megaphone" },
  { href: "/admin/settings/instagram", label: "Settings", icon: "settings" },
];

export async function AdminNav({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <DashboardShell
      homeHref="/admin/proposals"
      identityLabel="Collab"
      links={links}
      user={{
        name: session?.user?.name,
        email: session?.user?.email,
        image: session?.user?.image,
        profileHref: "/admin/profile",
      }}
    >
      {children}
    </DashboardShell>
  );
}
