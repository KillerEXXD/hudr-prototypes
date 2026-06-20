import type { UnifiedGame } from './useUnifiedGames'

// The viewer's relationship to a game — a partition of the games a user can act on:
//   hosting   — you run it (owner/host/co-host)
//   playing   — you've joined it and DON'T run it ("playing in other clubs")
//   available — you can join it: registration Open, not yours, not joined
// A Running game you neither host nor play returns null (can't join → shown nowhere;
// there is no "All"). Closed games are handled separately (Completed, Games tab only).
export type Relationship = 'available' | 'playing' | 'hosting'

export function relationshipOf(g: UnifiedGame): Relationship | null {
  if (g.iHost) return 'hosting' // REAL host/co-host — NOT canManage (which includes App Admins)
  if (g.mine) return 'playing'
  if (g.phase === 'reg') return 'available' // Open & joinable, not yours, not joined
  return null
}

/** Display order for the pill row: Available · Playing · Hosting. Players don't see
 *  Hosting (they host nothing). */
export function relationshipPills(isHost: boolean): Relationship[] {
  return isHost ? ['available', 'playing', 'hosting'] : ['available', 'playing']
}

/** Default selected pill: a host lands on their own games; a player on what they play. */
export function defaultRelationship(isHost: boolean): Relationship {
  return isHost ? 'hosting' : 'playing'
}
