import type { UnifiedGame } from './useUnifiedGames'

// The viewer's relationship to a game — a partition of the games a user can act on:
//   hosting   — you actually run it (host/co-host)
//   playing   — you're an APPROVED player and DON'T run it ("playing in other clubs")
//   available — registration Open and you can still act on it: not yours, and either
//               not joined OR your join request is still PENDING approval (you're not
//               playing yet — it shows here with the "Waiting for approval" badge).
// A Running game you neither host nor play returns null (can't join → shown nowhere;
// there is no "All"). Closed games are handled separately (Completed, Games tab only).
//
// Hosting keys off `iHost` — the viewer's REAL HOST role (host only, NOT co-host,
// NOT `canManage` which also includes App Admins). A co-host (`iCoHost`) helps run
// the game but buckets into Playing with a "Co-host" badge. Mirrors the card chip
// (`lib/gameRelationship.ts`); the two must agree.
export type Relationship = 'available' | 'playing' | 'hosting'

export function relationshipOf(g: UnifiedGame): Relationship | null {
  if (g.iHost) return 'hosting' // the HOST only — co-hosts go to Playing
  // Co-hosts live under Playing (the card shows a "Co-host" badge), as do approved players.
  if (g.iCoHost || (g.mine && !g.pending)) return 'playing'
  // A cancelled game is terminal (`finished`, phase 'closed' — see useUnifiedGames),
  // so it never reaches 'reg' here and is correctly excluded from the active buckets.
  if (g.phase === 'reg') return 'available' // Open: not joined, OR your pending request (waiting)
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
