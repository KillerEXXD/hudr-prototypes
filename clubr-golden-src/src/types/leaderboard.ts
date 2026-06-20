// =====================================================================
// Per-club Leaderboards — see SPEC §20. Members earn points by how they
// finish in the club's settled games (FT Fantasy, Last Longer, Football
// Squares), awarded by a field-scaled, top-heavy platform formula. Points
// accumulate per calendar-month season, per club. App-Admin-configurable.
// =====================================================================

export type SeasonKey = string // 'YYYY-MM'

/**
 * App-Admin-configurable points formula:
 *   points = round(base × √N ÷ √rank × weight)
 * awarded to the top 1/depthDivisor of the field; a game with fewer than
 * `minField` participants awards nothing.
 */
export interface LeaderboardConfig {
  base: number          // scale constant B (default 10)
  minField: number      // min participants for a game to count (default 4)
  depthDivisor: number  // top 1/divisor of the field scores (default 3 → top third)
  ftWeight: number      // FT Fantasy weight (default 1)
  llWeight: number      // Last Longer weight (default 1)
  squaresWeight: number // Squares weight (default 0.5 — chance-discounted)
}

export const DEFAULT_LEADERBOARD: LeaderboardConfig = {
  base: 10, minField: 4, depthDivisor: 3, ftWeight: 1, llWeight: 1, squaresWeight: 0.5,
}

export interface LeaderboardEntry {
  userId: string
  name: string
  avatarColor: string
  points: number
  wins: number     // 1st-place finishes
  podiums: number  // top-3 finishes
  games: number    // counted games played
  rank: number     // position on the board
}

export interface ClubLeaderboard {
  season: SeasonKey
  seasons: SeasonKey[] // all seasons with counted games, newest first
  entries: LeaderboardEntry[]
}
