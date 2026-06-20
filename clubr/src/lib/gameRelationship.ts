/**
 * The signed-in user's relationship to a game (FT Fantasy, Last Longer or
 * Squares), used for the status chip on every game card.
 *
 * Priority (highest wins): hosting → cohost → playing → waiting → join.
 *
 * HOST and CO-HOST are split: the "Hosting" badge + the Hosting filter are for
 * the game's actual host only. A co-host helps run the game but it lives under
 * Playing with a "Co-host" badge (you can also be playing it — see `alsoPlaying`
 * on the chip). Neither keys off `canManage` (which is true for App Admins on
 * every game they can see — that would mislabel admins as hosting everything).
 */
export type GameRelationship = 'hosting' | 'cohost' | 'playing' | 'waiting' | 'join' | 'none'

/** True when `me` is the game's HOST (not a co-host) — drives the host-only
 *  "Hosting" badge + Hosting filter. */
export function isGameHost(game: { hostId: string }, me: string): boolean {
  return !!me && game.hostId === me
}

/** True when `me` is a CO-host (and not the host). Co-hosts show under Playing
 *  with a "Co-host" badge, never under Hosting. */
export function isGameCoHost(game: { hostId: string; coHostIds?: string[] }, me: string): boolean {
  return !!me && game.hostId !== me && (game.coHostIds ?? []).includes(me)
}

/** Host OR co-host — for callers that just need "do I help run this game". */
export function hostedByMe(game: { hostId: string; coHostIds?: string[] }, me: string): boolean {
  return isGameHost(game, me) || isGameCoHost(game, me)
}

export function gameRelationship(x: {
  /** Am I this game's HOST? (not a co-host, not admin override) */
  isHost: boolean
  /** Am I a CO-host of this game (and not the host)? */
  isCoHost: boolean
  /** Do I have an entry/participant record in this game? */
  hasEntry: boolean
  /** Is that entry still awaiting host approval? */
  entryPending: boolean
  /** Am I a member of the club that owns this game? */
  isMemberOfClub: boolean
  /** Is registration / claiming still open? */
  registrationOpen: boolean
}): GameRelationship {
  if (x.isHost) return 'hosting'
  if (x.isCoHost) return 'cohost'
  if (x.hasEntry) return x.entryPending ? 'waiting' : 'playing'
  if (x.isMemberOfClub && x.registrationOpen) return 'join'
  return 'none'
}
