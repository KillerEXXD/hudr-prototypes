import type { UnifiedGame } from '@/games/useUnifiedGames'

// The two predicates that decide the "Live" tab / page buckets. Kept in their own
// pure module (type-only import above — no runtime dependency on the data hook) so
// the bottom nav, the page, and tests can all share them without dragging the
// Supabase-backed query hook into a test environment.

/**
 * A game is "live" for you if it hasn't ended and you're involved — playing,
 * waiting on approval (a pending join), or hosting/co-hosting. Games you could join
 * but haven't (`available`) are intentionally excluded — those live inside a club.
 */
export function isLiveForMe(g: UnifiedGame): boolean {
  return g.phase !== 'closed' && (g.iHost || g.iCoHost || g.mine)
}

/** Your ended games — completed/settled or cancelled — that you played in or ran. */
export function isFinishedForMe(g: UnifiedGame): boolean {
  return g.finished && (g.mine || g.canManage)
}

/**
 * In progress for you RIGHT NOW — a game you're in/hosting whose phase is 'live'
 * (the puck is rolling). Drives the pulsing-red "Live" dot on the nav + page; when
 * nothing matches, the dot rests grey.
 */
export function isInProgressForMe(g: UnifiedGame): boolean {
  return g.phase === 'live' && (g.iHost || g.iCoHost || g.mine)
}
