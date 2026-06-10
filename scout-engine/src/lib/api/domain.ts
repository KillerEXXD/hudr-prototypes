// Domain (camelCase) models the UI consumes. Transforms map Api* → these.

export interface Tournament {
  id: string
  name: string
  event: string
  venue: string
  date: string
  playerCount: number
  handCount: number
  prizePool: number
  status: 'completed' | 'live' | 'upcoming'
  isLive: boolean
  winnerId: string | null
  duration: string | null
  topPlayerIds: string[]
  exploitableCount: number
}

export interface Player {
  id: string
  name: string
  flag: string
  initials: string
  color: string
  finish: number | null
  status: string
  handsPlayed: number
}

export interface Highlight {
  id: string
  handNumber: number
  type: string
  tier: string
  board: string
  preview: string
  pot: number
  playerIds: string[]
  videoSeconds: number
  videoUrl: string
}

export interface HandSummary {
  handNumber: number
  board: string[]
  pot: number
  playerIds: string[]
  result: string
  videoSeconds: number
  videoUrl: string | null   // YouTube view option
  hasReplay: boolean        // replayer view option
}
