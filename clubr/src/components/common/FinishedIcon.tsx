import { type SVGProps } from 'react'

/**
 * The Finished icon — a short checklist with a circled check, signalling a wrapped-up
 * game history. It mirrors {@link LiveIcon}'s visual language (24-grid, `currentColor`
 * stroke, 1.6 weight) so the Live/Finished pills read as a matched pair, but it is
 * ALWAYS static — "Finished" is never in progress, so there is nothing to animate.
 * Decorative — pair with a visible "Finished" label for the accessible name.
 */
export function FinishedIcon({ size = 20, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
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
      <path d="M13 6H4" />
      <path d="M13 12H4" />
      <path d="M9 18H4" />
      <circle cx="16.5" cy="16.5" r="4.5" />
      <path d="M14.6 16.6l1.3 1.3 2.2-2.4" />
    </svg>
  )
}
