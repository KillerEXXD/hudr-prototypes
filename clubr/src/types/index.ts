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
  phone?: string
  /** City the user is based in (e.g. "Houston, TX") — used to surface nearby clubs. */
  location?: string
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
  /** City the club is based in (e.g. "Dallas, TX"). */
  location: string
  /** 'public' (default) = discoverable (Discover, search, by location, URL).
   *  'private' = fully hidden: not listed/searchable, a direct URL reveals nothing
   *  to non-members (existence not disclosed), invite-code only. */
  visibility?: 'public' | 'private'
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

// (Discover surfaces real clubs/contests/games via the FT + LL services —
//  no separate preview seed/types.)
