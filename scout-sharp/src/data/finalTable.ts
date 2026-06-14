import type { Player, Tournament } from '@/lib/api/domain'
import { STORY_ARC } from '@/data/tournaments'

// =====================================================================
// Final-table results model — merges Final Standings + Elimination
// Timeline into one ordered list, adds modeled $ won per place, and the
// elimination hand (real, from STORY_ARC, for the WSOP demo event; modeled
// for others) so each bust can be watched in the clip / replayer.
// =====================================================================

// Standard 9-handed final-table payout curve (fractions of the prize pool).
const PAYOUT_PCT = [0.30, 0.195, 0.135, 0.10, 0.078, 0.06, 0.048, 0.04, 0.034]

export interface FinalTableRow {
  finish: number
  player: Player
  isWinner: boolean
  payout: number
  eliminationHand: number | null   // null only if no hand could be resolved
  eliminationDesc: string | null
  eliminatedById: string | null
  videoSeconds: number
}

const ELIM_BY_PLAYER: Record<string, { hand: number; desc: string; by: string }> = (() => {
  const m: Record<string, { hand: number; desc: string; by: string }> = {}
  for (const e of STORY_ARC.eliminations) m[e.playerId] = { hand: e.hand, desc: e.desc, by: e.eliminatedBy }
  return m
})()

// Deterministic clip offset from the hand number so the YouTube clip + replayer
// links work for every row (no Math.random — stable across renders).
const vSeconds = (hand: number) => 120 + hand * 41

export function buildFinalTable(t: Tournament, players: Player[]): FinalTableRow[] {
  // STORY_ARC eliminations are real only for the WSOP demo tournament.
  const useArc = t.id === 't1'
  const ranked = players.filter((p) => p.finish != null).sort((a, b) => (a.finish as number) - (b.finish as number))
  const hc = t.handCount || 100

  return ranked.map((p) => {
    const finish = p.finish as number
    const isWinner = finish === 1
    const payout = Math.round(t.prizePool * (PAYOUT_PCT[finish - 1] ?? 0))
    const known = useArc ? ELIM_BY_PLAYER[p.id] : undefined

    let hand: number
    let desc: string | null
    let by: string | null
    if (isWinner) {
      hand = hc
      desc = 'Closed out the tournament on the final hand.'
      by = null
    } else if (known) {
      hand = known.hand
      desc = known.desc
      by = known.by
    } else {
      // Model the bust hand: earlier finishers (higher place number) bust sooner.
      hand = Math.max(1, Math.round(hc * (1 - (finish - 1) / Math.max(1, ranked.length))))
      desc = null
      by = null
    }

    return {
      finish, player: p, isWinner, payout,
      eliminationHand: hand, eliminationDesc: desc, eliminatedById: by,
      videoSeconds: vSeconds(hand),
    }
  })
}
