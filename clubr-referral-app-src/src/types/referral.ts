// =====================================================================
// ClubrGo Referral / revenue-share program — domain types.
//
// Rules modelled:
//  • Direct: 50 / 30 / 20% by the referred player's tier-year (1/2/3+),
//    20% for life. Clock starts at their first real paid purchase.
//  • Residual: flat 10% on EVERY purchase by ALL of a direct referral's
//    referrals (fanout). Depth = 2 only.
//  • No cap by default; cap is a configurable app setting (+ amount).
//  • Payout = real cash → withdrawal request → admin approves.
//  • Refunds reverse (claw back) the matching earnings.
//  • Rates are snapshotted/locked onto each relationship at activation.
// =====================================================================

/** The rate schedule locked onto a relationship (or the global default). */
export interface RateSchedule {
  y1: number          // 0.50
  y2: number          // 0.30
  y3plus: number      // 0.20
  residual: number    // 0.10
  capUsd: number | null // per-branch cap when the cap is enabled; null = no cap
}

/** A referrer → referred attribution edge. */
export interface Referral {
  id: string
  referrerId: string
  referredId: string
  code: string
  createdAt: string      // signup / attribution lock (ISO date)
  activatedAt: string    // referred's first paid purchase — the tier clock start (ISO date)
  locked: RateSchedule   // snapshot of the referrer's effective rates at activation
  status: 'active'
}

/** A real, paid coin purchase (only these accrue). */
export interface Purchase {
  id: string
  userId: string
  amountUsd: number
  coins: number
  date: string           // ISO date
  status: 'paid' | 'refunded'
}

/** One append-only earning row. Never mutated except `reversed`. */
export interface Earning {
  id: string
  purchaseId: string
  beneficiaryId: string  // who earns
  sourceId: string       // whose purchase generated it
  branchId: string       // the referral edge this counts against (for the cap)
  level: 'direct' | 'residual'
  tierYear: number       // 1 | 2 | 3
  rate: number           // rate applied (0.50, 0.10, …)
  grossUsd: number       // the purchase amount
  amountUsd: number      // raw earning before any cap clamp
  reversed: boolean
}

/** Global, admin-editable program settings. */
export interface RefConfig {
  y1: number
  y2: number
  y3plus: number
  residual: number
  capEnabled: boolean
  capUsd: number
  minWithdrawalUsd: number
}

export type WithdrawalStatus = 'pending' | 'approved' | 'rejected'

export interface WithdrawalRequest {
  id: string
  userId: string
  amountUsd: number
  status: WithdrawalStatus
  requestedAt: string    // ISO
  processedAt: string | null
  note?: string
}

// ---- Read-model shapes returned by the service layer ----

export interface ReferralRow {
  referral: Referral
  name: string
  avatarColor?: string
  avatarUrl?: string | null
  tierYearNow: number
  directEarned: number   // beneficiary's direct earnings from this person
  residualFromThem: number // beneficiary's residual from this person's referrals
  subCount: number       // how many people this person has referred
  lastActivity: string | null
}

export interface PlayerSummary {
  userId: string
  name: string
  avatarColor?: string
  avatarUrl?: string | null
  code: string
  lifetimeEarned: number
  withdrawn: number
  pending: number
  available: number
  directCount: number
  residualCount: number
  directReferrals: ReferralRow[]
}

export interface EarningDetail extends Earning {
  purchaseDate: string
  purchaseStatus: 'paid' | 'refunded'
  sourceName: string
}

export interface AdminPlayerRow {
  userId: string
  name: string
  avatarColor?: string
  avatarUrl?: string | null
  scheduleLabel: string  // e.g. "50 / 30 / 20 · 10%"
  hasOverride: boolean
  directCount: number
  residualCount: number
  earned: number
  appShare: number       // revenue their subtree generated − what they + upline earned
}

export interface AdminKpis {
  coinRevenue: number
  paidToReferrers: number
  outstanding: number
  pendingWithdrawals: number
  activeReferrers: number
  totalReferrals: number
  topReferrers: { userId: string; name: string; avatarColor?: string; avatarUrl?: string | null; earned: number }[]
}
