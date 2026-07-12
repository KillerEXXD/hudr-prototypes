// =====================================================================
// Squares — the club's 10×10 squares board on a real game.
// Same transparent-scorekeeper model: members claim squares, digits are
// sealed until lock, the host enters each period's score and the app
// highlights the winning square. App holds no cash — settled offline.
// =====================================================================
import type { ChatMsg } from './ft'

export type SquaresStatus = 'registration' | 'live' | 'completed' | 'cancelled'

/** One of the 100 grid cells (row-major: index = row*10 + col). Empty until claimed. */
export interface SquaresCell {
  userId?: string
  name?: string
  avatarColor?: string
  /** false/absent = claimed but PENDING host approval (player may withdraw);
   *  true = host-approved & locked in (player can no longer withdraw). */
  approved?: boolean
}

export interface SquaresPeriod {
  label: string          // 'Q1' | 'Q2' | 'Q3' | 'Final'
  pct: number            // payout share (sums to 100 across periods)
  homeScore?: number     // entered by host
  awayScore?: number
  winnerCell?: number    // 0..99, computed from digits when scores entered
  winnerUserId?: string
}

export interface SquaresParticipant {
  userId: string
  name: string
  avatarColor: string
  avatarUrl?: string | null
  status: 'pending' | 'active'   // approved to claim
  paid: boolean
  joinedAt?: string              // ISO; when they joined — Playing/Hosting "latest joined" sort
}

export interface SquaresGame {
  id: string
  clubId: string
  clubName: string
  clubEmoji: string
  title: string
  homeTeam: string
  awayTeam: string
  visibility?: 'public' | 'private'
  accessUserIds?: string[]
  status: SquaresStatus
  registrationClosesAt?: string
  timezone?: string
  /** True when a host closed registration BEFORE the scheduled deadline. */
  regClosedEarly?: boolean
  stake: number
  hostId: string
  coHostIds: string[]
  cells: SquaresCell[]           // length 100
  rowDigits: number[]            // length 10 — HOME digits down the side; empty until lock
  colDigits: number[]            // length 10 — AWAY digits across the top; empty until lock
  periods: SquaresPeriod[]
  participants: SquaresParticipant[]
  chat: ChatMsg[]
  /** Completion date 'YYYY-MM-DD' — buckets the result into a leaderboard month (completed only). */
  settledAt?: string
  /** ISO timestamp when created — for the Available tab's "latest created first" sort. */
  createdAt?: string
  /** Host-supplied reason, present when status === 'cancelled'. */
  cancelReason?: string
  /** ISO timestamp when the host cancelled. */
  cancelledAt?: string
  /** House rule for an unclaimed period's prize (a quarter's winning cell wasn't
   *  claimed). Defaults to 'rollover' (the prior implicit behavior). */
  noWinnerRule?: 'rollover' | 'split' | 'refund' | 'charity'
  /** Charity name, shown on the settled page (rule = 'charity' only). */
  charityName?: string
  /** Cross-game rollover (Rollover rule): finished same-club games whose unwon Q4
   *  pool was carried into THIS game's Q4. Consumed once. */
  rolledOverFrom?: { gameId: string; title: string; amount: number }[]
  /** Set on a SOURCE game once its unwon Q4 pool has been carried into another
   *  game's Q4 — excludes it from future carry-in pickers (consumed once). */
  rolledOverToGameId?: string
}

export interface SquaresGameView extends SquaresGame {
  me: SquaresParticipant | null
  canManage: boolean
  isMemberOfClub: boolean
  claimedCount: number           // cells claimed of 100 (pending + approved)
  pendingCount: number           // claimed but awaiting host approval
}

export const SQUARES_PERIODS = ['Q1', 'Q2', 'Q3', 'Final'] as const
export const DEFAULT_PERIOD_PAYOUTS = [10, 10, 10, 70]
export const emptyGrid = (): SquaresCell[] => Array.from({ length: 100 }, () => ({}))
