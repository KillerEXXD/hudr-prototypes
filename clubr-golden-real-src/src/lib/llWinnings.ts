import type { LLGameView, LLParticipant } from '@/types/ll'

// Resolve a Last Longer game's payouts for display.
//
// - Normal finish: each finisher is paid by their place per the host's `payouts` split
//   (percent of the pool), e.g. 60/30/10. Places outside the split win 0.
// - Chop (equal split): when players agree to a chop, the survivors split the pool
//   EQUALLY and rank as joint 1st. We detect a chop by ≥2 joint winners (or the legacy
//   winnerName === 'Chopped').
//
// We also normalize a quirk in completed games: a chop used to leave survivors as
// `status: 'active'` (so a *completed* game showed "N in"). Here, anyone still active on
// a completed game is treated as a joint winner (finishPos 1) — so legacy chopped games
// render correctly without a data migration.

export interface LLResult {
  completed: boolean
  isChop: boolean
  pool: number
  winnerCount: number
  /** Finishers ranked by place (joint winners first). Empty until the game is completed. */
  finishers: LLParticipant[]
  /** Stakes a finisher won from the pool. */
  amountWon: (p: LLParticipant) => number
  /** Per-winner share of a chop (0 when not a chop). */
  chopShare: number
}

const placeOf = (p: LLParticipant) => p.finishPos ?? 99

/** Treat survivors of a completed game (chop) as joint winners (finishPos 1). */
export function normalizeCompleted(g: LLGameView): LLGameView {
  if (g.status !== 'completed') return g
  return {
    ...g,
    participants: g.participants.map((p) =>
      p.status === 'active' ? { ...p, status: 'out' as const, finishPos: p.finishPos ?? 1 } : p,
    ),
  }
}

export function llResult(g: LLGameView): LLResult {
  const completed = g.status === 'completed'
  const joined = g.participants.filter((p) => p.status !== 'pending').length
  const pool = g.stake * joined

  const finishers = completed
    ? normalizeCompleted(g).participants
        .filter((p) => p.status === 'out')
        .sort((a, b) => placeOf(a) - placeOf(b))
    : []

  const winnerCount = finishers.filter((p) => placeOf(p) === 1).length
  const isChop = completed && (winnerCount > 1 || g.winnerName === 'Chopped')
  const chopShare = isChop && winnerCount > 0 ? Math.round(pool / winnerCount) : 0

  const amountWon = (p: LLParticipant) => {
    const place = placeOf(p)
    if (isChop && place === 1) return chopShare
    const pct = g.payouts?.[place - 1] ?? 0
    return Math.round((pool * pct) / 100)
  }

  return { completed, isChop, pool, winnerCount, finishers, amountWon, chopShare }
}
