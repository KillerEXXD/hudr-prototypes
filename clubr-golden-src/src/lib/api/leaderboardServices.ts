// Leaderboard services — swap seam (mock store today, API later). SPEC §20.
// Computes per-club, per-month standings from settled FT contests, completed
// Last Longer games, and completed Squares boards, using the shared
// per-game award (lib/leaderboard/award) so the board always matches the
// "+N LP" shown on each game result. App-Admin tunes the formula globally.

import { FT_CONTESTS } from '@/data/ftStore'
import { LL_GAMES } from '@/data/llStore'
import { SQUARES_GAMES } from '@/data/squaresStore'
import { USERS } from '@/data/store'
import { LEADERBOARD } from '@/data/leaderboardStore'
import { MOCK_LATENCY_MS } from '@/config/api'
import { ftAward, llAward, squaresAward, type GameAward } from '@/lib/leaderboard/award'
import type { ClubLeaderboard, LeaderboardConfig, LeaderboardEntry, SeasonKey } from '@/types/leaderboard'

const delay = (ms = MOCK_LATENCY_MS) => new Promise((r) => setTimeout(r, ms))

const monthOf = (date: string): SeasonKey => date.slice(0, 7) // 'YYYY-MM'
const currentMonth = (): SeasonKey => new Date().toISOString().slice(0, 7)

interface CountedGame { season: SeasonKey; award: GameAward }

/** Every settled/completed game in the club, scored, that meets the min-field bar. */
function countedGames(clubId: string, cfg: LeaderboardConfig): CountedGame[] {
  const ft = FT_CONTESTS
    .filter((c) => c.clubId === clubId && c.status === 'settled' && c.finishingOrder && c.settledAt)
    .map((c) => ({ season: monthOf(c.settledAt!), award: ftAward(c, cfg) }))
  const ll = LL_GAMES
    .filter((g) => g.clubId === clubId && g.status === 'completed' && g.settledAt)
    .map((g) => ({ season: monthOf(g.settledAt!), award: llAward(g, cfg) }))
  const sq = SQUARES_GAMES
    .filter((g) => g.clubId === clubId && g.status === 'completed' && g.settledAt)
    .map((g) => ({ season: monthOf(g.settledAt!), award: squaresAward(g, cfg) }))
  return [...ft, ...ll, ...sq].filter((x) => x.award.fieldSize >= cfg.minField)
}

// ---- App Admin: configure the formula ----
export async function getLeaderboardConfig(): Promise<LeaderboardConfig> {
  await delay(40)
  return { ...LEADERBOARD }
}
export async function updateLeaderboardConfig(cfg: LeaderboardConfig): Promise<void> {
  await delay(80)
  LEADERBOARD.base = Math.max(1, cfg.base)
  LEADERBOARD.minField = Math.max(2, Math.round(cfg.minField))
  LEADERBOARD.depthDivisor = Math.max(1, cfg.depthDivisor)
  LEADERBOARD.ftWeight = Math.max(0, cfg.ftWeight)
  LEADERBOARD.llWeight = Math.max(0, cfg.llWeight)
  LEADERBOARD.squaresWeight = Math.max(0, cfg.squaresWeight)
}

/** The club's standings for one month (defaults to the current month, else the latest). */
export async function getClubLeaderboard(clubId: string, seasonKey?: SeasonKey): Promise<ClubLeaderboard> {
  await delay()
  const cfg = LEADERBOARD
  const games = countedGames(clubId, cfg)
  const seasons = [...new Set(games.map((g) => g.season))].sort().reverse()
  const cur = currentMonth()
  const season = (seasonKey && seasons.includes(seasonKey)) ? seasonKey
    : seasons.includes(cur) ? cur
      : (seasons[0] ?? cur)

  const acc = new Map<string, { points: number; wins: number; podiums: number; games: number }>()
  const bump = (id: string) => {
    let a = acc.get(id)
    if (!a) { a = { points: 0, wins: 0, podiums: 0, games: 0 }; acc.set(id, a) }
    return a
  }
  for (const { award } of games.filter((x) => x.season === season)) {
    for (const id of award.players) bump(id).games++
    for (const r of award.results) {
      const a = bump(r.userId)
      a.points += r.points
      if (r.rank === 1) a.wins++
      if (r.rank <= 3) a.podiums++
    }
  }

  const entries: LeaderboardEntry[] = [...acc.entries()]
    .map(([userId, a]) => {
      const u = USERS[userId]
      return { userId, name: u?.name ?? 'Player', avatarColor: u?.avatarColor ?? '#6b7280', points: a.points, wins: a.wins, podiums: a.podiums, games: a.games, rank: 0 }
    })
    .sort((a, b) => b.points - a.points || b.wins - a.wins || b.podiums - a.podiums || a.name.localeCompare(b.name))
  entries.forEach((e, i) => { e.rank = i + 1 })

  return { season, seasons, entries }
}
