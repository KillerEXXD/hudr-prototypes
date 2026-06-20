// =====================================================================
// Per-game leaderboard award — turns one finished game into the LP each
// player earned toward the club board. The SAME math the standings use
// (lib/leaderboard/points), so the "+N LP" shown on a result always matches
// what lands on the leaderboard. Used by both leaderboardServices (to
// aggregate) and the game-result views (to show LP). See SPEC §20.
// =====================================================================

import { FINISH_POINTS, type FTContest } from '@/types/ft'
import type { LLGame } from '@/types/ll'
import type { SquaresGame } from '@/types/squares'
import type { LeaderboardConfig } from '@/types/leaderboard'
import { gamePoints, rankWithTies, type GamePoints, type RankInput } from './points'

export interface GameAward {
  fieldSize: number
  players: string[]        // everyone who played (drives games-played count)
  results: GamePoints[]    // { userId, rank, points } for finishers eligible for points
}

/** Settled FT contest → rank approved entrants by fantasy score, then award. */
export function ftAward(c: FTContest, cfg: LeaderboardConfig): GameAward {
  const approved = c.entries.filter((e) => e.status === 'approved')
  const players = approved.map((e) => e.userId)
  if (!c.finishingOrder) return { fieldSize: approved.length, players, results: [] }
  const fo = c.finishingOrder
  const inputs: RankInput[] = approved.map((e) => ({
    userId: e.userId,
    key: e.picks.reduce((s, seat) => { const i = fo.indexOf(seat); return s + (i >= 0 ? FINISH_POINTS[i] : 0) }, 0),
  }))
  return { fieldSize: approved.length, players, results: gamePoints(rankWithTies(inputs), approved.length, cfg, cfg.ftWeight) }
}

/** Completed Last Longer game → rank by finish position (1 = winner), then award. */
export function llAward(g: LLGame, cfg: LeaderboardConfig): GameAward {
  const played = g.participants.filter((p) => p.status !== 'pending')
  const players = played.map((p) => p.userId)
  const inputs: RankInput[] = played.map((p) => ({ userId: p.userId, key: -(p.finishPos ?? 999) }))
  return { fieldSize: played.length, players, results: gamePoints(rankWithTies(inputs), played.length, cfg, cfg.llWeight) }
}

/** Completed Squares board → rank period-winners by weighted winnings, then award (×½). */
export function squaresAward(g: SquaresGame, cfg: LeaderboardConfig): GameAward {
  const played = g.participants.filter((p) => p.status === 'active')
  const players = played.map((p) => p.userId)
  const won = new Map<string, number>()
  for (const period of g.periods) if (period.winnerUserId) won.set(period.winnerUserId, (won.get(period.winnerUserId) ?? 0) + period.pct)
  const inputs: RankInput[] = [...won.entries()].map(([userId, key]) => ({ userId, key }))
  return { fieldSize: played.length, players, results: gamePoints(rankWithTies(inputs), played.length, cfg, cfg.squaresWeight) }
}

/** userId → points (positive only), for quick lookups in result views. */
export function awardMap(a: GameAward): Map<string, number> {
  const m = new Map<string, number>()
  for (const r of a.results) if (r.points > 0) m.set(r.userId, r.points)
  return m
}
