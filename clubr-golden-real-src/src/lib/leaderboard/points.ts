// =====================================================================
// Leaderboard points algorithm (pure). One formula across all game types:
//   points = round(base × √N ÷ √rank × weight)
// awarded to the top 1/depthDivisor of the field; games below minField score 0.
// Each game reduces to (your rank, field size N); the caller supplies the
// per-type weight. Tied finishers split the points of the positions they
// jointly occupy, evenly. See SPEC §20.
// =====================================================================

import type { LeaderboardConfig } from '@/types/leaderboard'

export interface RankInput { userId: string; key: number } // higher key = better finish
export interface RankedResult { userId: string; rank: number }
export interface GamePoints { userId: string; rank: number; points: number }

/** Competition ranking (1, 2, 2, 4…) by key descending. Equal keys tie. */
export function rankWithTies(entries: RankInput[]): RankedResult[] {
  const sorted = [...entries].sort((a, b) => b.key - a.key)
  const out: RankedResult[] = []
  let rank = 0
  let prev = Number.NaN
  sorted.forEach((e, i) => {
    if (e.key !== prev) { rank = i + 1; prev = e.key }
    out.push({ userId: e.userId, rank })
  })
  return out
}

/**
 * Points for a single finishing position. 0 if the field is too small or the
 * position is outside the scoring depth (top 1/depthDivisor of the field).
 */
export function positionPoints(rank: number, fieldSize: number, cfg: LeaderboardConfig, weight = 1): number {
  if (fieldSize < cfg.minField || rank < 1) return 0
  const depth = Math.ceil(fieldSize / Math.max(1, cfg.depthDivisor))
  if (rank > depth) return 0
  return Math.round((cfg.base * Math.sqrt(fieldSize) / Math.sqrt(rank)) * weight)
}

/**
 * Per-user points for one game. Tied finishers (same rank) split the points of
 * the positions they jointly occupy, evenly — so total points are conserved and
 * a tie is never worth more than finishing those places outright.
 */
export function gamePoints(ranked: RankedResult[], fieldSize: number, cfg: LeaderboardConfig, weight = 1): GamePoints[] {
  const byRank = new Map<number, string[]>()
  for (const r of ranked) {
    const arr = byRank.get(r.rank)
    if (arr) arr.push(r.userId)
    else byRank.set(r.rank, [r.userId])
  }
  const out: GamePoints[] = []
  for (const [rank, users] of byRank) {
    let sum = 0
    for (let pos = rank; pos < rank + users.length; pos++) sum += positionPoints(pos, fieldSize, cfg, weight)
    const each = Math.round(sum / users.length)
    for (const userId of users) out.push({ userId, rank, points: each })
  }
  return out
}
