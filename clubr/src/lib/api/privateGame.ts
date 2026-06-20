// When a game read resolves to a PRIVATE gate (the game exists but the viewer
// isn't allowed in), services return `{ private: PrivateGameInfo }` instead of the
// game — so the page can show "private game in <club>, hosted by <owner>, ask to
// join" rather than a dead "Game not found".
export interface PrivateGameInfo {
  clubId: string
  clubName: string
  ownerName: string
}

export interface PrivateGate { private: PrivateGameInfo }

/** Narrow a game read result to the private-gate case. */
export function isPrivateGate<T>(x: T | PrivateGate | null): x is PrivateGate {
  return !!x && typeof x === 'object' && 'private' in x
}
