/**
 * The signed-in user's relationship to a game (FT Fantasy, Last Longer or
 * Squares), used for the single status chip on every game card.
 *
 * Priority (highest wins, one chip only): hosting → playing → waiting → join.
 *
 * 'hosting' is the user's REAL host/co-host role — deliberately NOT `canManage`,
 * which is `isAdmin || host/co-host` and would mark an App Admin as "Hosting"
 * every game they can see. Admins still manage via the detail page; the card
 * reflects their actual participation. (Same lesson as the clubs page.)
 */
export type GameRelationship = 'hosting' | 'playing' | 'waiting' | 'join' | 'none'

/**
 * True when `me` is the game's host or co-host — the REAL hosting signal, NOT
 * `canManage` (which is true for App Admins on every game). Use this for the
 * "Hosting" chip and the "You're hosting" list grouping so admins aren't shown
 * as hosting games they merely oversee.
 */
export function hostedByMe(game: { hostId: string; coHostIds?: string[] }, me: string): boolean {
  return !!me && (game.hostId === me || (game.coHostIds ?? []).includes(me))
}

export function gameRelationship(x: {
  /** Am I this game's host or co-host? (NOT admin override.) */
  hostedByMe: boolean
  /** Do I have an entry/participant record in this game? */
  hasEntry: boolean
  /** Is that entry still awaiting host approval? */
  entryPending: boolean
  /** Am I a member of the club that owns this game? */
  isMemberOfClub: boolean
  /** Is registration / claiming still open? */
  registrationOpen: boolean
}): GameRelationship {
  if (x.hostedByMe) return 'hosting'
  if (x.hasEntry) return x.entryPending ? 'waiting' : 'playing'
  if (x.isMemberOfClub && x.registrationOpen) return 'join'
  return 'none'
}
