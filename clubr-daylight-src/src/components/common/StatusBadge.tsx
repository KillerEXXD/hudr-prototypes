import { Badge } from './ui'
import { lifecycleBadge, type GamePhase } from '@/lib/gameStatus'

/**
 * Unified game-status badge shared by all three games (FT Fantasy, Last Longer,
 * Squares) so their lifecycle wording + styling stay identical. Pass the
 * canonical phase; FT callers normalize via `ftPhase` first.
 *
 * The in-play phase shows a pulsing red "live now" dot in front of "Live".
 */
export function StatusBadge({ phase, className }: { phase: GamePhase; className?: string }) {
  const b = lifecycleBadge(phase)
  return (
    <Badge tone={b.tone} className={className}>
      {b.live && <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-red animate-pulse" aria-hidden="true" />}
      {b.label}
    </Badge>
  )
}
