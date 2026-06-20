// Shared domain types for the Nocturne prototype (mirrors the shape of the
// ClubR app's types, scoped to what the 6 screens render).

export type GameType = 'ft' | 'll' | 'sq'
export type GameStatus = 'open' | 'running' | 'completed'
export type Relationship = 'available' | 'playing' | 'hosting'

export interface Game {
  id: string
  type: GameType
  club: string
  clubEmoji: string
  title: string
  stake: string
  pool: string
  joined: number
  closesIn: string
  status: GameStatus
  sub: string
  relationship: Relationship
  private?: boolean
}

export interface Finalist {
  seat: string
  name: string
  flag: string
  bb: number
  price: number
}

export type NotifType = 'club_req' | 'club_ok' | 'game_req' | 'game_ok'
export interface AppNotification {
  id: string
  type: NotifType
  body: string
  ago: string
  unread: boolean
}

export interface Member { name: string; color: string; role?: string }
export interface Standing { rank: number; name: string; team: string; pts: number; you?: boolean }
