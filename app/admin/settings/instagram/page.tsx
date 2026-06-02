import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getStatus } from "@/lib/services/instagramConnectionService";
import { InstagramConnectionPanel } from "@/components/admin/InstagramConnectionPanel";

export default async function InstagramSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.brandId) redirect("/login");

  const status = await getStatus(session.user.brandId);
  const { connected, error } = await searchParams;

  const notice = error
    ? { type: "error" as const, message: error }
    : connected
      ? { type: "connected" as const, message: "Instagram connected." }
      : null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage integrations for your brand.
        </p>
      </div>
      <InstagramConnectionPanel initialStatus={status} notice={notice} />
    </div>
  );
}
