/**
 * Game-apps registry — single source of truth for the Apps shell.
 *
 * Adding a new game is one entry below; the Home grid, the Create-game
 * picker sheet, and the per-app route binding all read this list. The Home
 * icons compute their live + unread badges from the same mock store the
 * existing variants use (useUnifiedGames filtered by type) — NOT from any
 * counts here. So this file stays purely structural metadata: identity,
 * routing, and visual identity.
 */
export type GameAppId = 'fantasy' | 'last-longer' | 'squares'

export interface GameAppMeta {
  id: GameAppId
  label: string
  sub: string
  /** Tailwind gradient (from-X via-Y to-Z) for the icon background. */
  grad: string
  /** rgba glow used in the icon's drop-shadow. */
  glow: string
  /** Route the Home icon + Create-sheet pick navigates to. */
  route: string
}

export const APP_REGISTRY: GameAppMeta[] = [
  {
    id: 'fantasy',
    label: 'Fantasy',
    sub: 'Stack Draft',
    grad: 'from-purple-500 via-fuchsia-500 to-pink-500',
    glow: 'rgba(168,85,247,0.45)',
    route: '/fantasy',
  },
  {
    id: 'last-longer',
    label: 'Last Longer',
    sub: 'Live Tournament',
    grad: 'from-amber-400 via-orange-500 to-rose-500',
    glow: 'rgba(245,158,11,0.45)',
    route: '/lastlonger',
  },
  {
    id: 'squares',
    label: 'Squares',
    sub: '10×10 Board',
    grad: 'from-emerald-400 via-teal-500 to-cyan-500',
    glow: 'rgba(16,185,129,0.45)',
    route: '/squares',
  },
]
