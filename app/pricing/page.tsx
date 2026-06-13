import type { Metadata } from "next";

import { auth } from "@/auth";
import { FinalCta } from "@/components/marketing/FinalCta";
import { LandingNav } from "@/components/marketing/LandingNav";
import { PricingComparison } from "@/components/marketing/PricingComparison";
import { PricingFaq } from "@/components/marketing/PricingFaq";
import { PricingHero } from "@/components/marketing/PricingHero";
import { PricingPlans } from "@/components/marketing/PricingPlans";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { dashboardPath } from "@/lib/auth/dashboardPath";
import { getPricingCta } from "@/lib/marketing/plans";

export const metadata: Metadata = {
  title: "Pricing | Collab",
  description:
    "Collab Pro and Team plans for Instagram brands. Automate creator intake, DM triage, and upfront payout estimates.",
  alternates: {
    canonical: "/pricing",
  },
};

export default async function PricingPage() {
  const session = await auth();
  const dashboardHref = session?.user?.userType
    ? dashboardPath(session.user.userType)
    : null;
  const cta = getPricingCta(session?.user?.userType);

  return (
    <div className="min-h-dvh bg-background">
      <LandingNav dashboardHref={dashboardHref} />

      <main>
        <PricingHero />
        <PricingPlans cta={cta} />
        <PricingComparison />
        <PricingFaq />
        <FinalCta primaryHref={cta.href} primaryLabel={cta.label} />
      </main>

      <SiteFooter />
    </div>
  );
}
