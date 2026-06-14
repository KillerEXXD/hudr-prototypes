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
  youtubeId: string | null
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
  photoUrl: string | null
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

export interface SuggestedQuestion {
  text: string
  askedCount: number   // times other users asked this (social proof)
}

export interface PlayerTournament {
  tournamentId: string
  name: string
  event: string
  date: string
  hands: number
}

export interface CurrentUser {
  id: string
  name: string
  email: string
  initials: string
  color: string
  memberSince: string
  planId: string
  savedPlayerIds: string[]
  savedTournamentIds: string[]
}

export interface TrendingQuery {
  id: string
  kind: 'player' | 'tournament'
  targetId: string
  question: string
  votes: number
}

export interface SubscriptionPlan {
  id: string
  name: string
  priceMonthly: number
  tagline: string
  features: string[]
  highlight: boolean       // featured / current tier
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
