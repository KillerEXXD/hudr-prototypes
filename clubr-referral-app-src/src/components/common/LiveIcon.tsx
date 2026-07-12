import { type SVGProps } from 'react'

/**
 * The Live nav icon — a red centre dot with concentric "broadcast" waves (provided
 * design). The waves inherit `currentColor` so the icon matches sibling nav icons
 * (Home), while the dot is always `accent-red`. When `animate` is true (a game is
 * actually in progress) the dot pulses and the waves ripple outward; otherwise it
 * sits passive/static. Decorative — pair with a visible "Live" label for the
 * accessible name. Respects `prefers-reduced-motion`.
 */
export function LiveIcon({ size = 20, animate = false, ...props }: SVGProps<SVGSVGElement> & { size?: number; animate?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {animate && (
        <style>{`
          .lc { transform-origin: 12px 12px; animation: lc 1.6s ease-in-out infinite; }
          .lw { transform-origin: 12px 12px; animation: lw 1.6s ease-out infinite; }
          .lw2 { animation-delay: .2s; }
          @keyframes lc { 0%,100% { opacity: 1; } 50% { opacity: .45; } }
          @keyframes lw { 0% { opacity: .9; } 70% { opacity: .15; } 100% { opacity: .9; } }
          @media (prefers-reduced-motion: reduce) { .lc, .lw { animation: none; } }
        `}</style>
      )}
      <circle className={animate ? 'lc' : undefined} cx="12" cy="12" r="2.4" fill="var(--color-accent-red)" stroke="none" />
      <path className={animate ? 'lw' : undefined} d="M7.7 7.7a6 6 0 0 0 0 8.6" />
      <path className={animate ? 'lw' : undefined} d="M16.3 16.3a6 6 0 0 0 0 -8.6" />
      <path className={animate ? 'lw lw2' : undefined} d="M5.2 5.2a9.5 9.5 0 0 0 0 13.6" />
      <path className={animate ? 'lw lw2' : undefined} d="M18.8 18.8a9.5 9.5 0 0 0 0 -13.6" />
    </svg>
  )
}
