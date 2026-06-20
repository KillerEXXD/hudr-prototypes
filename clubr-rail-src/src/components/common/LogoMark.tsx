import { useId } from 'react'

// ClubrGO brand mark — a club suit set in a premium gradient "chip". Pure SVG so it
// stays crisp at any size (header → hero). The accent gradient reads modern/premium
// and is theme-neutral. Use alongside the "Clubr<GO>" wordmark.
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  const id = useId()
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF7A59" />
          <stop offset="1" stopColor="#E0613F" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="42" height="42" rx="13" fill={`url(#${id})`} />
      <g fill="#17120F">
        <circle cx="24" cy="16.5" r="6.4" />
        <circle cx="16.4" cy="25" r="6.4" />
        <circle cx="31.6" cy="25" r="6.4" />
        <path d="M24 22.5 C 24 31, 25.6 35.6, 29 39 L 19 39 C 22.4 35.6, 24 31, 24 22.5 Z" />
      </g>
    </svg>
  )
}

// The full lockup: mark + "Clubr GO" wordmark (GO accented). `size` drives the mark;
// style the wordmark via `wordClass` to match the surrounding type scale.
export function LogoLockup({ size = 22, wordClass = 'text-lg', className }: { size?: number; wordClass?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <LogoMark size={size} />
      <span className={`font-extrabold tracking-tight text-text-primary ${wordClass}`}>Clubr<span className="text-accent-gold">GO</span></span>
    </span>
  )
}
