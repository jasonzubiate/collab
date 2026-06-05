export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-zinc-200" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-zinc-100 px-2 text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
