import Image from "next/image";
import Link from "next/link";

const BRAND_LINKS = [
  { href: "/brand/signup", label: "Brand sign up" },
  { href: "/brand/signin", label: "Brand sign in" },
];

const CREATOR_LINKS = [
  { href: "/creator/signup", label: "Creator sign up" },
  { href: "/creator/signin", label: "Creator sign in" },
];

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="font-mono text-xs font-medium tracking-wide text-zinc-500 uppercase">
        {heading}
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-zinc-300 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-zinc-950 px-5 py-14 text-white sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col justify-between gap-10 sm:flex-row">
        <div className="max-w-xs">
          <Image
            src="/collab-full-logo.png"
            alt="Collab"
            width={484}
            height={120}
            className="h-7 w-auto brightness-0 invert"
            style={{ width: "auto", height: "1.75rem" }}
          />
          <p className="mt-4 text-sm text-zinc-400">
            Vetted, priced, ready-to-sign creator collaborations — on autopilot.
          </p>
        </div>

        <div className="flex gap-16">
          <FooterColumn heading="For brands" links={BRAND_LINKS} />
          <FooterColumn heading="For creators" links={CREATOR_LINKS} />
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-5xl border-t border-white/10 pt-6">
        <p className="font-mono text-xs tracking-wide text-zinc-500 uppercase">
          &copy; {new Date().getFullYear()} Collab
        </p>
      </div>
    </footer>
  );
}
