// =====================================================================
// FT Fantasy (Stack Draft) types.
// =====================================================================

export interface FTPlayer {
  seat: string // 'A'..'I'
  name: string
  bbStack: number
  icmPrice: number
}

/** Approval to PLAY in this contest (host must admit) — separate from `paid`. */
export type EntryStatus = 'pending' | 'approved'

export interface ContestEntry {
  userId: string
  name: string
  avatarColor: string
  status: EntryStatus
  /** Subtle green/grey toggle — host/co-host only; player sees it read-only. */
  paid: boolean
  picks: string[] // up to 4 seat ids; empty until drafted
  spend: number
  score?: number // present when settled
  rank?: number
}

export interface ChatMsg {
  id: string
  userId: string
  name: string
  avatarColor: string
  text: string
  ts: string
  kind?: 'user' | 'system'
}

export type ContestStatusFull = 'open' | 'locked' | 'settled'

export interface FTContest {
  id: string
  clubId: string
  clubName: string
  clubEmoji: string
  ftName: string
  status: ContestStatusFull
  stake: number
  budget: number
  locksAt: string
  hostId: string
  coHostIds: string[] // per-game co-hosts (scoped to this contest only)
  players: FTPlayer[]
  finishingOrder?: string[] // seat ids 1st..9th, present when settled
  entries: ContestEntry[]
  chat: ChatMsg[]
}

/** A contest enriched with the current user's relationship to it. */
export interface FTContestView extends FTContest {
  myEntry: ContestEntry | null
  canManage: boolean // host / co-host / app admin
  isMemberOfClub: boolean
}

/** Points awarded per finishing position (1st..9th). */
export const FINISH_POINTS = [100, 70, 50, 35, 25, 18, 12, 6, 3]

/** An upcoming, operator-priced final table a host can choose to run in their club. */
export interface AvailableFT {
  id: string
  name: string
  room: string
  startsIn: string // display, e.g. 'in 2h 10m'
  hoursLeft: number
  players: FTPlayer[] // ICM-priced by the operator, ready to use
}
