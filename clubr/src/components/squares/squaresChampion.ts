import type { SquaresGameView } from '@/types/squares'

/**
 * "Whoever wins Q4 (Final) is the game's overall champion." Helper shared
 * by SquaresQuarterCards AND the parent Squares pages (which render the
 * shared ChampionCard above the grid). Returns `null` when the Final
 * hasn't been scored yet.
 *
 * Lives in its own module so React Fast Refresh doesn't trip over a mixed
 * component + utility export (react-refresh/only-export-components).
 */
export function squaresChampion(g: SquaresGameView): {
  winner: SquaresGameView['participants'][number]
  prize: number
} | null {
  const finalPeriod = g.periods.find((p) => p.label === 'Final')
  const winner = finalPeriod?.winnerUserId ? g.participants.find((p) => p.userId === finalPeriod.winnerUserId) : undefined
  if (!winner || !finalPeriod) return null
  const pot = g.stake * g.claimedCount
  const prize = Math.round(pot * (finalPeriod.pct / 100))
  return { winner, prize }
}
