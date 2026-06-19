import type { GamePhase, UnifiedGame } from './useUnifiedGames'

// Pure ordering for the home feed — kept hook-free so it's unit-testable without
// pulling the React Query / auth chain. The home feed's order: drop CLOSED games,
// then Registration-Open before Live, each group in urgency order (`sort`).
const PHASE_RANK: Record<GamePhase, number> = { reg: 0, live: 1, closed: 2 }

export function orderActiveGames(items: UnifiedGame[]): UnifiedGame[] {
  return items
    .filter((g) => g.phase !== 'closed')
    .sort((a, b) => PHASE_RANK[a.phase] - PHASE_RANK[b.phase] || a.sort - b.sort)
}
