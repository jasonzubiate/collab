import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { dashboardPath, signinPath } from "@/lib/auth/dashboardPath";
import { CreatorNav } from "@/components/creator/CreatorNav";

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

  return <CreatorNav>{children}</CreatorNav>;
}
