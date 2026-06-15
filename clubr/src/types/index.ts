// =====================================================================
// ClubR domain types. These mirror the shapes the real API will return,
// so swapping the mock services (src/lib/api/services.ts) for live calls
// needs no component changes.
// =====================================================================

/** Account type chosen at login. */
export type AccountRole = 'admin' | 'host' | 'player'

/** A logged-in user (the demo seeds one account per role). */
export interface User {
  id: string
  name: string
  handle: string
  email: string
  role: AccountRole
  avatarColor: string
}

/** A member's standing inside one club. */
export type MemberStatus = 'pending' | 'member'
export type MemberRole = 'owner' | 'host' | 'member'

export interface ClubMember {
  userId: string
  name: string
  handle: string
  avatarColor: string
  role: MemberRole
  status: MemberStatus
  joinedAt: string
}

export interface Club {
  id: string
  name: string
  emoji: string
  color: string
  description: string
  ownerId: string
  ownerName: string
  inviteCode: string
  createdAt: string
  members: ClubMember[]
}

/** A club enriched with the current user's relationship to it. */
export interface ClubView extends Club {
  myStatus: 'none' | MemberStatus
  myRole: MemberRole | null
  /** I can manage (approve members, run games) — owner/host or app admin. */
  canManage: boolean
  pendingCount: number
}

// ---- Discover feed entities (read-only previews; full features land in later phases) ----

export type ContestFormat = 'stack-draft' | 'pickem'
export type ContestStatus = 'open' | 'locked' | 'settled'

export interface ContestSummary {
  id: string
  clubId: string
  clubName: string
  clubEmoji: string
  ftName: string
  format: ContestFormat
  status: ContestStatus
  stake: number
  entries: number
  locksAt: string
}

export type LastLongerStatus = 'registration' | 'live' | 'completed'

export interface LastLongerSummary {
  id: string
  clubId: string
  clubName: string
  clubEmoji: string
  title: string
  status: LastLongerStatus
  stake: number
  players: number
  remaining: number
}
