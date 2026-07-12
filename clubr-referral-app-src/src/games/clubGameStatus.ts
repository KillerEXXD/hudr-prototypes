import type { UnifiedGame } from './useUnifiedGames'

/**
 * Club-detail Games sub-filter — a 4-way partition of a club's games, IDENTICAL for every
 * viewer (member, host, app-admin). Since a host can also join, a game classifies purely by
 * the viewer's participation + the game's phase, so the same four pills (with the same rule)
 * work for everyone. This is club-detail-only; the cross-page relationship pills
 * (`relationshipOf`) are unchanged.
 *
 *   New (available) — registration open, you're NOT playing (not joined, or pending approval)
 *   Playing         — you joined & are still active (any phase: reg-open or running)
 *   Running         — live, you're NOT playing (eliminated/"out", or never participated)
 *   Finished        — settled / cancelled (terminal)
 */
export type ClubStatus = 'available' | 'playing' | 'running' | 'finished'

/** Pill display order. The 'available' pill is labelled "New". */
export const CLUB_STATUSES: ClubStatus[] = ['available', 'playing', 'running', 'finished']

/**
 * "I'm an active participant" — joined AND approved AND not eliminated. An eliminated Last
 * Longer player (participant status 'out') is NOT playing, so their still-live game falls to
 * Running, not Playing. FT/Squares have no mid-game elimination, so joined-&-approved = playing.
 */
export function amPlaying(g: UnifiedGame): boolean {
  if (!g.mine || g.pending) return false
  if (g.type === 'last_longer') return g.ll.me?.status !== 'out'
  return true
}

/** The single bucket a game belongs to. Priority: finished → playing → running → new. */
export function clubStatusOf(g: UnifiedGame): ClubStatus {
  if (g.finished) return 'finished'
  if (amPlaying(g)) return 'playing'
  if (g.phase === 'live') return 'running'
  return 'available'
}
