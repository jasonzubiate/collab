import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { signinPath } from "@/lib/auth/dashboardPath";
import { prisma } from "@/lib/prisma";
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

  const brand = await prisma.brand.findUnique({
    where: { id: session.user.brandId },
    select: { companyName: true },
  });

  return (
    <div className="min-h-dvh bg-background">
      <AdminNav
        brandName={brand?.companyName ?? "Collab"}
        email={session.user.email ?? ""}
      />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
