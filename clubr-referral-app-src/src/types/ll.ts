// =====================================================================
// Last Longer types.
// =====================================================================
import type { ChatMsg } from './ft'

export type LLStatus = 'registration' | 'live' | 'completed' | 'cancelled'
export type LLParticipantStatus = 'pending' | 'active' | 'out'

export interface LLParticipant {
  userId: string
  name: string
  avatarColor: string
  avatarUrl?: string | null
  status: LLParticipantStatus
  paid: boolean
  chips: number
  chipsUpdatedAgo: string // e.g. 'now', '4m', '24m'
  stale: boolean // chips not updated recently → pulse
  finishPos?: number // set when out (1 = winner)
  bustedAgo?: string // when they busted, e.g. '10m ago', '2h ago'
  joinedAt?: string // ISO; when they joined — Playing/Hosting "latest joined" sort
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
  /** Host-selected timezone label for the close time (e.g. 'ET'). */
  timezone?: string
  /** True when a host closed registration BEFORE the scheduled deadline. */
  regClosedEarly?: boolean
  /** Prize split percentages by place, summing to 100. Length 1 = winner-takes-all. */
  payouts?: number[]
  stake: number
  hostId: string
  coHostIds: string[]
  participants: LLParticipant[]
  chat: ChatMsg[]
  chop?: ChopProposal
  winnerName?: string
  /** Completion date 'YYYY-MM-DD' — buckets the result into a leaderboard month (completed only). */
  settledAt?: string
  /** ISO timestamp when created — for the Available tab's "latest created first" sort. */
  createdAt?: string
  /** Host-supplied reason, present when status === 'cancelled'. */
  cancelReason?: string
  /** ISO timestamp when the host cancelled. */
  cancelledAt?: string
}

export interface LLGameView extends LLGame {
  me: LLParticipant | null
  canManage: boolean
  isMemberOfClub: boolean
  activeCount: number
}
