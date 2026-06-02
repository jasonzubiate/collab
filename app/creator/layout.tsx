import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { dashboardPath, signinPath } from "@/lib/auth/dashboardPath";
import { CreatorNav } from "@/components/creator/CreatorNav";
import { getCreatorProfile } from "@/lib/services/creatorProposalService";

export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect(signinPath("CREATOR"));
  if (session.user.userType !== "CREATOR") {
    redirect(dashboardPath("BRAND"));
  }

  const profile = await getCreatorProfile(session.user.id);
  const displayName = profile?.instagramHandle
    ? `@${profile.instagramHandle.replace(/^@/, "")}`
    : (session.user.name ??
      session.user.email?.split("@")[0] ??
      "Creator");

  return (
    <div className="min-h-dvh bg-background">
      <CreatorNav displayName={displayName} email={session.user.email ?? ""} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
