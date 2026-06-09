import type { Metadata } from "next";

import { auth } from "@/auth";
import { LandingNav } from "@/components/marketing/LandingNav";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { dashboardPath } from "@/lib/auth/dashboardPath";

export const metadata: Metadata = {
  title: "Privacy Policy | Collab",
  description:
    "How Collab collects, uses, stores, and protects your data, including data accessed through the Instagram Graph API.",
};

const LAST_UPDATED = "June 9, 2026";
const CONTACT_EMAIL = "privacy@collabwit.com";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="mt-3 space-y-4 text-sm leading-relaxed text-zinc-600">
        {children}
      </div>
    </section>
  );
}

export default async function PrivacyPolicyPage() {
  const session = await auth();
  const dashboardHref = session?.user?.userType
    ? dashboardPath(session.user.userType)
    : null;

  return (
    <div className="min-h-dvh bg-background">
      <LandingNav dashboardHref={dashboardHref} />

      <main className="mx-auto max-w-3xl px-5 pt-32 pb-24 sm:px-6">
        <p className="font-mono text-xs font-medium tracking-wide text-zinc-500 uppercase">
          Legal
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="mt-8 space-y-4 text-sm leading-relaxed text-zinc-600">
          <p>
            Collab (&ldquo;Collab,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
            &ldquo;our&rdquo;) operates the platform at collabwit.com, which
            helps brands automate creator collaboration intake, estimate
            payouts, and triage proposals. This Privacy Policy explains what
            information we collect, how we use it, and the choices you have. It
            includes specific disclosures about data we access through Meta
            Platforms&rsquo; Instagram Graph API.
          </p>
          <p>
            By using Collab, you agree to the collection and use of information
            in accordance with this policy.
          </p>
        </div>

        <Section title="1. Information We Collect">
          <p>We collect the following categories of information:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="font-medium text-foreground">
                Account information.
              </span>{" "}
              Information you provide when brands or creators sign up and use
              Collab, such as name, email address, and account preferences.
            </li>
            <li>
              <span className="font-medium text-foreground">
                Instagram account details.
              </span>{" "}
              When a brand connects its Instagram account, we collect the
              Instagram account&rsquo;s user ID and username.
            </li>
            <li>
              <span className="font-medium text-foreground">
                Instagram messages.
              </span>{" "}
              We receive Instagram direct messages and messaging events sent to
              a connected account through Instagram webhooks, and we may send
              direct messages on the connected account&rsquo;s behalf.
            </li>
            <li>
              <span className="font-medium text-foreground">
                Access tokens.
              </span>{" "}
              We store the access token issued by Meta when you connect an
              Instagram account, so we can act on the account&rsquo;s behalf
              while the connection is active.
            </li>
          </ul>
        </Section>

        <Section title="2. How We Use Information">
          <p>We use the information we collect to:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Automate creator collaboration intake and triage proposals.</li>
            <li>Estimate payouts and surface collaboration opportunities.</li>
            <li>
              Read and send Instagram direct messages on a connected
              account&rsquo;s behalf in order to manage collaboration
              conversations.
            </li>
            <li>Operate, maintain, secure, and improve the service.</li>
            <li>Communicate with you about your account and the service.</li>
          </ul>
        </Section>

        <Section title="3. Meta / Instagram Platform Data">
          <p>
            Collab integrates with the Instagram Graph API provided by Meta
            Platforms, Inc. When a brand connects an Instagram professional
            account, Collab requests only the permissions needed to provide the
            service, including:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Reading the connected account&rsquo;s basic profile (user ID and
              username).
            </li>
            <li>
              Subscribing to messaging webhooks (<code>messages</code> and{" "}
              <code>messaging_postbacks</code>) to receive incoming direct
              messages and messaging events.
            </li>
            <li>
              Sending direct messages from the connected account in response to
              collaboration conversations.
            </li>
          </ul>
          <p>
            Our use and transfer of information received from the Instagram
            Graph API adheres to the{" "}
            <a
              href="https://developers.facebook.com/terms/dfc_platform_terms/"
              className="text-foreground underline underline-offset-2 hover:text-zinc-500"
              target="_blank"
              rel="noreferrer noopener"
            >
              Meta Platform Terms
            </a>{" "}
            and{" "}
            <a
              href="https://developers.facebook.com/devpolicy/"
              className="text-foreground underline underline-offset-2 hover:text-zinc-500"
              target="_blank"
              rel="noreferrer noopener"
            >
              Developer Policies
            </a>
            . We do not use Instagram data for any purpose other than providing
            the features described in this policy.
          </p>
        </Section>

        <Section title="4. How We Store and Protect Data">
          <p>
            Access tokens are encrypted at rest before being stored, and access
            to stored data is restricted to the systems and personnel that
            require it to operate the service. We retain data only as long as it
            is needed for the purposes described in this policy. While no method
            of transmission or storage is completely secure, we use reasonable
            administrative and technical safeguards to protect your information.
          </p>
        </Section>

        <Section title="5. How We Share Information">
          <p>
            We do not sell your personal information or Instagram data. We may
            share information with service providers who process data on our
            behalf to operate the platform (for example, hosting and
            infrastructure providers), subject to obligations consistent with
            this policy. We may also disclose information where required by law
            or to protect the rights, safety, and security of Collab and its
            users.
          </p>
        </Section>

        <Section title="6. Data Retention and Deletion">
          <p>
            When a brand disconnects its Instagram account, we unsubscribe from
            the account&rsquo;s messaging webhooks and delete the stored
            connection, including the encrypted access token.
          </p>
          <p>
            You may request deletion of your data, including any data obtained
            through the Instagram Graph API, by emailing us at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-foreground underline underline-offset-2 hover:text-zinc-500"
            >
              {CONTACT_EMAIL}
            </a>
            . We will process verified deletion requests within a reasonable
            time.
          </p>
        </Section>

        <Section title="7. Your Rights and Revoking Access">
          <p>
            You can revoke Collab&rsquo;s access to your Instagram account at any
            time by disconnecting the account within Collab or by removing
            Collab from the &ldquo;Apps and Websites&rdquo; settings in your
            Instagram or Meta account. Depending on your location, you may also
            have rights to access, correct, or delete your personal information;
            contact us to exercise these rights.
          </p>
        </Section>

        <Section title="8. Children's Privacy">
          <p>
            Collab is not directed to children under 13 (or the minimum age
            required in your jurisdiction), and we do not knowingly collect
            personal information from them. If you believe a child has provided
            us with personal information, please contact us so we can remove it.
          </p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. When we do, we
            will revise the &ldquo;Last updated&rdquo; date above. Material
            changes will be communicated through the service or by other
            appropriate means.
          </p>
        </Section>

        <Section title="10. Contact Us">
          <p>
            If you have questions about this Privacy Policy or our data
            practices, contact us at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-foreground underline underline-offset-2 hover:text-zinc-500"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
