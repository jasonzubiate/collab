import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type { DashboardNavLink } from "@/components/dashboard/types";
import { getCreatorProfile } from "@/lib/services/creatorProposalService";

const links: DashboardNavLink[] = [
  { href: "/creator/requests", label: "Requests", icon: "inbox" },
  { href: "/creator/settings", label: "Settings", icon: "settings" },
];

export async function CreatorNav({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const profile = session?.user?.id
    ? await getCreatorProfile(session.user.id)
    : null;

  return (
    <DashboardShell
      homeHref="/creator/requests"
      identityLabel="Collab"
      links={links}
      user={{
        name: session?.user?.name,
        email: session?.user?.email,
        image: session?.user?.image,
        avatarUrl: profile?.instagramAvatarUrl,
        profileHref: "/creator/profile",
      }}
    >
      {children}
    </DashboardShell>
  );
}
