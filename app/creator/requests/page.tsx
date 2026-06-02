import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { signinPath } from "@/lib/auth/dashboardPath";
import { listCreatorProposals } from "@/lib/services/creatorProposalService";
import { CreatorRequestsList } from "@/components/creator/CreatorRequestsList";

export default async function CreatorRequestsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect(signinPath("CREATOR"));

  const proposals = await listCreatorProposals(session.user.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Your requests
        </h1>
        <p className="text-sm text-muted-foreground">
          Collaboration proposals you&apos;ve submitted and brand responses.
        </p>
      </div>
      <CreatorRequestsList proposals={proposals} />
    </div>
  );
}
