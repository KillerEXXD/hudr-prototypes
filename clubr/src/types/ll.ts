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
  bustedAgo?: string // when they busted, e.g. '10m ago', '2h ago'
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
  visibility?: 'public' | 'private' // undefined = public (all club members can view)
  accessUserIds?: string[] // for private: the members who can see it (host always included)
  location?: string
  mode?: 'in-person' | 'online'
  status: LLStatus
  /** ISO timestamp — when registration closes (drives the ticking countdown). */
  registrationClosesAt?: string
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
