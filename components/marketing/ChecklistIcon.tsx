export function ChecklistIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className={className}
    >
      <rect width="20" height="20" rx="6" fill="currentColor" />
      <path
        d="M6 10.5l2.5 2.5L14 7.5"
        stroke="var(--check-mark, #ffffff)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
