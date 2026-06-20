// App-Admin-configurable leaderboard formula (mutated by leaderboardServices).
// One global config, platform-wide — mirrors the credit ECONOMY pattern. SPEC §20.
import { DEFAULT_LEADERBOARD, type LeaderboardConfig } from '@/types/leaderboard'

export const LEADERBOARD: LeaderboardConfig = { ...DEFAULT_LEADERBOARD }
