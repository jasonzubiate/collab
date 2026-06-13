export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-primary text-zinc-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none bg-[linear-gradient(to_right,rgba(9,9,11,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(9,9,11,0.06)_1px,transparent_1px)] bg-size-[64px_64px]"
      />
      <div className="relative flex min-h-dvh items-center justify-center px-4 py-12 sm:px-6">
        {children}
      </div>
    </div>
  );
}
