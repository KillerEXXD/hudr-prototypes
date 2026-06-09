export interface Tournament {
  id: string
  name: string
  event: string
  venue: string
  date: string
  players: number
  hands: number
  prize: number
  live: boolean
  status: 'completed' | 'live' | 'upcoming'
  aiReports: string[]
  exploitable: number
  leaks: number
  rivalries: number
  topPlayers: string[]
  winner: string | null
  duration: string | null
}

export interface TournamentDetail {
  name: string
  event: string
  venue: string
  date: string
  playerCount: number
  handCount: number
  prizePool: number
  gradient: string
}

export interface StoryChapter {
  id: string
  title: string
  handRange: string
  mood: 'calm' | 'tense' | 'dramatic'
  color: string
  summary: string
  keyHand: {
    hand: number
    desc: string
    board: string[]
  }
}

export interface Elimination {
  hand: number
  playerId: string
  eliminatedBy: string
  desc: string
}

export interface StoryArc {
  chapters: StoryChapter[]
  eliminations: Elimination[]
}
