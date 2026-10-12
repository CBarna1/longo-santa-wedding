/** Decorative line-art leaves. Stroke uses currentColor, so set colour with a text-* class. */

export function LeafArch({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 60" className={className} fill="none" stroke="currentColor" strokeWidth={1.2} aria-hidden>
      <path d="M10 50 Q60 0 110 50" />
      <path d="M30 34 q-8 -10 -2 -16 q8 4 2 16z" />
      <path d="M50 22 q-4 -12 4 -16 q6 8 -4 16z" />
      <path d="M70 22 q4 -12 -4 -16 q-6 8 4 16z" />
      <path d="M90 34 q8 -10 2 -16 q-8 4 -2 16z" />
    </svg>
  );
}

export function Sprig({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 16" className={className} fill="none" stroke="currentColor" strokeWidth={1} aria-hidden>
      <path d="M4 8 H30" />
      <path d="M50 8 H76" />
      <path d="M40 8 q-5 -7 -10 -4 q4 5 10 4z" />
      <path d="M40 8 q5 -7 10 -4 q-4 5 -10 4z" />
      <path d="M40 8 q-5 7 -10 4 q4 -5 10 -4z" />
      <path d="M40 8 q5 7 10 4 q-4 -5 -10 -4z" />
    </svg>
  );
}
