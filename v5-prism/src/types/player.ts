export interface Player {
  id: string
  name: string
  flag: string
  initials: string
  color: string
  finish: number
  status: 'winner' | 'runner-up' | 'eliminated'
  hands: number
  startStack: number
  endStack: number
}

export interface PlayerDimensions {
  aggression: number
  risk: number
  icm: number
  precision: number
  adaptability: number
  clutch: number
}

export interface PlayerIdentity {
  [playerId: string]: string
}

export interface PlayerStyle {
  label: string
  emoji: string
  desc: string
}

export interface SkillRating {
  grade: string
  color: string
}

export interface Rivalry {
  opponentId: string
  score: number
  label: string
  color: string
}

export interface PlayerStrength {
  title: string
  stat: string
  desc: string
}

export interface PlayerLeak {
  title: string
  severity: 'minor' | 'moderate' | 'critical'
  stat: string
  desc: string
}

export interface PlayerTrend {
  vpip: 'stable' | 'increasing' | 'decreasing'
  pfr: 'stable' | 'increasing' | 'decreasing'
  af: 'stable' | 'increasing' | 'decreasing'
  overall: 'stable' | 'tightening' | 'loosening'
  note: string
}

export interface CareerSparkline {
  vpip: number[]
  pfr: number[]
  af: number[]
}
