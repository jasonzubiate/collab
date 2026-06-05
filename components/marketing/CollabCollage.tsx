import Image from "next/image";

function PhotoCard({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-3xl bg-surface-muted ring-1 ring-zinc-950/5 shadow-xl shadow-zinc-950/10 select-none ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 45vw, 16rem"
        className="object-cover"
      />
    </div>
  );
}

function ProfileCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-3xl bg-surface p-4 ring-1 ring-zinc-950/5 shadow-xl shadow-zinc-950/10 ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-extrabold text-primary-foreground">
          S
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            @sienna.studios
          </p>
          <p className="font-mono text-[11px] tracking-wide text-muted-foreground tabular-nums">
            28.5K followers · 5.1%
          </p>
        </div>
      </div>
      <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 font-mono text-[10px] font-medium tracking-wide text-zinc-700 uppercase ring-1 ring-primary/40">
        <span className="h-1.5 w-1.5 rounded-full bg-tier-green" />
        Green match
      </span>
    </div>
  );
}

function PayoutCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-3xl bg-zinc-950 p-5 text-white shadow-xl shadow-zinc-950/20 ${className}`}
    >
      <p className="font-mono text-[10px] tracking-wide text-primary uppercase">
        Auto-priced payout
      </p>
      <p className="mt-2 font-display text-3xl font-extrabold tracking-tight tabular-nums">
        $1,450
      </p>
      <p className="mt-1 font-mono text-[11px] tracking-wide text-zinc-400 uppercase">
        1 reel · 3 stories
      </p>
    </div>
  );
}

function DmCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-3xl bg-surface p-4 ring-1 ring-zinc-950/5 shadow-xl shadow-zinc-950/10 ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="h-6 w-6 rounded-full bg-[conic-gradient(at_top_left,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)]" />
        <span className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
          Instagram DM
        </span>
      </div>
      <p className="mt-3 rounded-2xl rounded-tl-sm bg-surface-muted px-3 py-2 text-sm leading-snug text-foreground">
        Obsessed with your drop 💚 any chance we could collab?
      </p>
    </div>
  );
}

function SignedCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-3xl bg-surface p-5 ring-1 ring-zinc-950/5 shadow-xl shadow-zinc-950/10 ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-tier-green text-white">
          <svg viewBox="0 0 20 20" fill="none" aria-hidden className="h-3 w-3">
            <path
              d="M5 10.5l3 3L15 6.5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="font-mono text-[11px] font-medium tracking-wide text-foreground uppercase">
          Contract signed
        </span>
      </div>
      <svg
        viewBox="0 0 160 28"
        fill="none"
        aria-hidden
        className="mt-3 h-7 w-full text-zinc-300"
      >
        <path
          d="M2 20c10-12 16 8 24-2s10-14 17-4 9 12 16 2 11-10 18-2 14 6 22-6 16 4 23 0 12-6 17-2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function CollabCollage() {
  return (
    <section className="relative overflow-hidden bg-background px-5 pt-40 pb-20 sm:px-6 sm:pt-52 sm:pb-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 mx-auto h-112 max-w-3xl -translate-y-1/2 rounded-full bg-primary/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl lg:flex lg:min-h-136 lg:items-center lg:justify-center">
        {/* Center copy */}
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h2 className="font-display text-5xl leading-[0.95] font-extrabold tracking-tight text-zinc-950 text-balance sm:text-7xl">
            Where brands and creators{" "}
            <span className="inline-block rounded-2xl bg-primary px-3 pb-1 text-primary-foreground [box-decoration-break:clone]">
              click
            </span>
          </h2>
        </div>

        {/* Floating collage — desktop */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden lg:block"
        >
          <ProfileCard className="absolute top-0 left-0 w-60 -rotate-2" />
          <PhotoCard
            src="/marketing/collage-creator.png"
            alt=""
            className="absolute top-1/2 left-0 aspect-4/3 w-52 -translate-y-1/2 -rotate-3"
          />
          <DmCard className="absolute bottom-0 left-2 w-56 rotate-2" />
          <PhotoCard
            src="/marketing/collage-flatlay.png"
            alt=""
            className="absolute top-0 right-0 aspect-4/3 w-52 rotate-3"
          />
          <PayoutCard className="absolute top-1/2 right-0 w-44 -translate-y-1/2 rotate-2" />
          <SignedCard className="absolute right-2 bottom-0 w-60 -rotate-3" />
        </div>

        {/* Collage — mobile / tablet */}
        <div aria-hidden className="mt-12 grid grid-cols-2 gap-4 lg:hidden">
          <ProfileCard className="" />
          <PayoutCard className="" />
          <PhotoCard
            src="/marketing/collage-flatlay.png"
            alt=""
            className="relative aspect-4/3"
          />
          <PhotoCard
            src="/marketing/collage-creator.png"
            alt=""
            className="relative aspect-4/3"
          />
          <DmCard className="col-span-2" />
        </div>
      </div>
    </section>
  );
}
