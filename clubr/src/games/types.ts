import type { LucideIcon } from 'lucide-react'
import { Target, Timer, Grid3x3 } from 'lucide-react'

// =====================================================================
// Game-type registry — the ONE place a game type is declared. The Games
// feed, the "+ New game" chooser, filter chips and badges all iterate this
// list, so adding a game type (e.g. Football Squares) is a registry entry
// plus a card variant + create flow — no nav/feed plumbing changes.
//
// Tailwind note: class names are stored as LITERAL strings (not built from
// the accent name) so the JIT scanner keeps them.
// =====================================================================

export type GameType = 'ft_fantasy' | 'last_longer' | 'football_squares'

export interface GameTypeDef {
  id: GameType
  label: string
  sub: string            // one-line description for the chooser
  icon: LucideIcon
  iconBg: string         // chooser icon chip background (literal class)
  ring: string           // chooser card border + bg (literal classes)
  create: { kind: 'route'; to: string } | { kind: 'sheet' }
}

export const GAME_TYPES: GameTypeDef[] = [
  {
    id: 'ft_fantasy', label: 'FT Fantasy', sub: 'Draft a streamed final table (Stack Draft)',
    icon: Target, iconBg: 'bg-accent-purple', ring: 'border-accent-purple/30 bg-accent-purple/10',
    create: { kind: 'route', to: '/host-ft' },
  },
  {
    id: 'last_longer', label: 'Last Longer', sub: "Your club's own live tournament",
    icon: Timer, iconBg: 'bg-accent-amber', ring: 'border-accent-amber/30 bg-accent-amber/10',
    create: { kind: 'sheet' },
  },
  {
    id: 'football_squares', label: 'Football Squares', sub: 'A 10×10 squares board on a live game',
    icon: Grid3x3, iconBg: 'bg-accent-emerald', ring: 'border-accent-emerald/30 bg-accent-emerald/10',
    create: { kind: 'sheet' },
  },
]

export const gameTypeDef = (id: GameType) => GAME_TYPES.find((t) => t.id === id)
