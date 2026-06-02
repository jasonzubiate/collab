import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { signinPath } from "@/lib/auth/dashboardPath";
import { getCreatorProfile } from "@/lib/services/creatorProposalService";

export default async function CreatorSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect(signinPath("CREATOR"));

  const profile = await getCreatorProfile(session.user.id);
  const isPlaceholderEmail = session.user.email?.endsWith(
    "@creators.collab.local",
  );

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage how Collab identifies your proposals.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-medium text-foreground">Instagram</h2>
        {profile?.instagramHandle ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Connected as @{profile.instagramHandle}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Link Instagram to match DM submissions and web proposals by handle.
          </p>
        )}
        <Link
          href="/api/auth/creator/instagram"
          className="mt-4 inline-flex text-sm font-medium text-primary hover:text-primary-hover"
        >
          {profile?.instagramHandle ? "Reconnect Instagram" : "Connect Instagram"}
        </Link>
      </section>

      <section className="mt-4 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-medium text-foreground">Email</h2>
        {isPlaceholderEmail ? (
          <p className="mt-2 text-sm text-muted-foreground">
            You signed in with Instagram. Use email signin to add an address
            for notifications (coming soon).
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Signed in as {session.user.email}. Proposals with this email are
            linked to your account.
          </p>
        )}
      </section>
    </div>
  );
}
