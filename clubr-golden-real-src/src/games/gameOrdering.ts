import type { GamePhase, UnifiedGame } from './useUnifiedGames'
import type { Relationship } from './gameRelationship'

// Pure ordering for the home feed — kept hook-free so it's unit-testable without
// pulling the React Query / auth chain. The home feed's order: drop CLOSED games,
// then Registration-Open before Live, each group in urgency order (`sort`).
const PHASE_RANK: Record<GamePhase, number> = { reg: 0, live: 1, closed: 2 }

export function orderActiveGames(items: UnifiedGame[]): UnifiedGame[] {
  return items
    .filter((g) => g.phase !== 'closed')
    .sort((a, b) => PHASE_RANK[a.phase] - PHASE_RANK[b.phase] || a.sort - b.sort)
}

// Newest-first by an ISO timestamp accessor. Games missing the timestamp sort to
// the end (so they never jump above dated ones). ISO strings parse cleanly.
function byNewest(get: (g: UnifiedGame) => string | undefined) {
  return (a: UnifiedGame, b: UnifiedGame) => {
    const ta = get(a), tb = get(b)
    if (!ta && !tb) return 0
    if (!ta) return 1
    if (!tb) return -1
    return Date.parse(tb) - Date.parse(ta)
  }
}

/**
 * Per-tab ordering for the Games page relationship buckets:
 *  - Available → latest CREATED first
 *  - Playing / Hosting → latest JOINED first (a host who never self-joined has no
 *    joinedAt, so falls back to the game's createdAt)
 * Does NOT filter — caller passes the already-bucketed, non-closed slice.
 */
export function orderActiveTab(games: UnifiedGame[], rel: Relationship): UnifiedGame[] {
  const get = rel === 'available' ? (g: UnifiedGame) => g.createdAt : (g: UnifiedGame) => g.joinedAt ?? g.createdAt
  return [...games].sort(byNewest(get))
}

/** Completed/history tab → latest COMPLETED first (settledAt, falling back to createdAt). */
export function orderCompleted(games: UnifiedGame[]): UnifiedGame[] {
  return [...games].sort(byNewest((g) => g.settledAt ?? g.createdAt))
}
