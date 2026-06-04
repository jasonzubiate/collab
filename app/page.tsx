import { auth } from "@/auth";
import { BeforeAfter } from "@/components/marketing/BeforeAfter";
import { CreatorCallout } from "@/components/marketing/CreatorCallout";
import { FinalCta } from "@/components/marketing/FinalCta";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { LandingNav } from "@/components/marketing/LandingNav";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { dashboardPath } from "@/lib/auth/dashboardPath";

export default async function HomePage() {
  const session = await auth();
  const dashboardHref = session?.user?.userType
    ? dashboardPath(session.user.userType)
    : null;

  const primaryHref = dashboardHref ?? "/brand/signup";
  const primaryLabel = dashboardHref ? "Go to dashboard" : "Get started";

  return (
    <div className="min-h-dvh bg-background">
      <LandingNav dashboardHref={dashboardHref} />

      <main>
        <Hero primaryHref={primaryHref} primaryLabel={primaryLabel} />
        <BeforeAfter primaryHref={primaryHref} />
        <HowItWorks />
        <CreatorCallout />
        <FinalCta primaryHref={primaryHref} primaryLabel={primaryLabel} />
      </main>

      <SiteFooter />
    </div>
  );
}
