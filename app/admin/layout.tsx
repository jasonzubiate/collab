import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { signinPath } from "@/lib/auth/dashboardPath";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.userType !== "BRAND") {
    redirect(signinPath("BRAND"));
  }
  if (!session.user.brandId) {
    redirect("/brand/onboarding");
  }

  return <AdminNav>{children}</AdminNav>;
}
