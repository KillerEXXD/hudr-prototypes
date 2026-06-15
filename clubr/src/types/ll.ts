// =====================================================================
// Last Longer types.
// =====================================================================
import type { ChatMsg } from './ft'

export type LLStatus = 'registration' | 'live' | 'completed'
export type LLParticipantStatus = 'pending' | 'active' | 'out'

export interface LLParticipant {
  userId: string
  name: string
  avatarColor: string
  status: LLParticipantStatus
  paid: boolean
  chips: number
  chipsUpdatedAgo: string // e.g. 'now', '4m', '24m'
  stale: boolean // chips not updated recently → pulse
  finishPos?: number // set when out (1 = winner)
}

export interface ChopProposal {
  proposedByName: string
  agreements: { userId: string; name: string; agreed: boolean }[]
}

export interface LLGame {
  id: string
  clubId: string
  clubName: string
  clubEmoji: string
  title: string
  location?: string
  mode?: 'in-person' | 'online'
  status: LLStatus
  stake: number
  hostId: string
  coHostIds: string[]
  participants: LLParticipant[]
  chat: ChatMsg[]
  chop?: ChopProposal
  winnerName?: string
}

export interface LLGameView extends LLGame {
  me: LLParticipant | null
  canManage: boolean
  isMemberOfClub: boolean
  activeCount: number
}
