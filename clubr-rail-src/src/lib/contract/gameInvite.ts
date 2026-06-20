// Game-invite link helpers (mirror of the live app). The prototype is mock-only,
// so this carries just the type + route map the Share button / bell need.
export type GameInviteType = 'll' | 'sq' | 'ft'

/** Map a game type to its app route. */
export const GAME_ROUTE: Record<GameInviteType, (id: string) => string> = {
  ll: (id) => `/lastlonger/${id}`,
  sq: (id) => `/squares/${id}`,
  ft: (id) => `/fantasy/${id}`,
}
