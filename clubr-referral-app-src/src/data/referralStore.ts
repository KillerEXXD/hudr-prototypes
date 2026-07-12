// =====================================================================
// In-memory referral store + earnings ENGINE + demo seed.
//
// This is the single source of truth: every player and admin screen reads
// derived numbers from here, so the player's view and the admin drill-down
// always reconcile. Services (referralServices.ts) are the only writers.
// =====================================================================

import { USERS } from '@/data/store'
import type {
  Earning, Purchase, RateSchedule, RefConfig, Referral, WithdrawalRequest,
} from '@/types/referral'

// ---- 1. Demo users (injected into the shared USERS map so auth can log in as them) ----
const REF_USERS: Record<string, { name: string; color: string }> = {
  u_alice: { name: 'Alice Nguyen', color: '#d946ef' },
  u_ben: { name: 'Ben Carter', color: '#3b82f6' },
  u_cara: { name: 'Cara Diaz', color: '#06b6d4' },
  u_dylan: { name: 'Dylan Wu', color: '#14b8a6' },
  u_eve: { name: 'Eve Larsen', color: '#f97316' },
  u_dana: { name: 'Dana Cole', color: '#a855f7' },
  u_eli: { name: 'Eli Barnes', color: '#eab308' },
  u_fresh: { name: 'Riley Fox', color: '#22c55e' },
}
for (const [id, u] of Object.entries(REF_USERS)) {
  if (!USERS[id]) {
    USERS[id] = { id, name: u.name, handle: id.slice(2), email: `${id.slice(2)}@clubrgo.app`, role: 'member', avatarColor: u.color, emailVerified: true }
  }
}
export const userName = (id: string): string => USERS[id]?.name ?? 'Unknown'
export const userColor = (id: string): string | undefined => USERS[id]?.avatarColor
export const userPic = (id: string): string | null | undefined => USERS[id]?.avatarUrl

// ---- 2. Config + per-player overrides ----
export const CONFIG: RefConfig = {
  y1: 0.5, y2: 0.3, y3plus: 0.2, residual: 0.1,
  capEnabled: false, capUsd: 1000, minWithdrawalUsd: 50,
}
/** Per-player rate overrides (partial). Apply to the referrer's NEW activations. */
export const OVERRIDES: Record<string, Partial<Pick<RateSchedule, 'y1' | 'y2' | 'y3plus' | 'residual'>>> = {
  u_alice: { y1: 0.7 }, // Alice is a key partner — 70% year-1 on any NEW referral she makes
}
export function effectiveSchedule(userId: string): RateSchedule {
  const o = OVERRIDES[userId] ?? {}
  return {
    y1: o.y1 ?? CONFIG.y1, y2: o.y2 ?? CONFIG.y2, y3plus: o.y3plus ?? CONFIG.y3plus,
    residual: o.residual ?? CONFIG.residual,
    capUsd: CONFIG.capEnabled ? CONFIG.capUsd : null,
  }
}

// ---- 3. Data tables ----
export const REFERRALS: Referral[] = []
export const PURCHASES: Purchase[] = []
export const EARNINGS: Earning[] = []
export const WITHDRAWALS: WithdrawalRequest[] = []

let _seq = 0
const nid = (p: string) => `${p}_${++_seq}`

const edgeByReferred = (referredId: string) => REFERRALS.find((r) => r.referredId === referredId)
export const referralsBy = (referrerId: string) => REFERRALS.filter((r) => r.referrerId === referrerId)
export const purchaseById = (id: string) => PURCHASES.find((p) => p.id === id)
export const purchasesOf = (userId: string) => PURCHASES.filter((p) => p.userId === userId)

// ---- 4. Tier-year math ----
const DAY = 86400000
export function tierYear(activatedAt: string, at: string | Date = new Date()): number {
  const a = new Date(activatedAt).getTime()
  const t = (typeof at === 'string' ? new Date(at) : at).getTime()
  const years = Math.floor((t - a) / (365 * DAY))
  return Math.min(3, Math.max(1, years + 1))
}
export function directRate(sched: RateSchedule, ty: number): number {
  return ty <= 1 ? sched.y1 : ty === 2 ? sched.y2 : sched.y3plus
}

// ---- 5. The accrual engine ----
/** Walk up 2 levels from a paid purchase and append the earning rows. */
export function accrue(purchaseId: string) {
  const p = purchaseById(purchaseId)
  if (!p || p.status !== 'paid') return
  const buyer = p.userId
  const e1 = edgeByReferred(buyer)
  if (!e1) return // buyer wasn't referred by anyone
  // Direct → the buyer's referrer, at the tier rate locked on the edge.
  const ty = tierYear(e1.activatedAt, p.date)
  const rate = directRate(e1.locked, ty)
  EARNINGS.push({
    id: nid('e'), purchaseId: p.id, beneficiaryId: e1.referrerId, sourceId: buyer,
    branchId: e1.id, level: 'direct', tierYear: ty, rate, grossUsd: p.amountUsd,
    amountUsd: round2(p.amountUsd * rate), reversed: false,
  })
  // Residual → the referrer's referrer (grand), flat rate on the grand→referrer edge.
  const e2 = edgeByReferred(e1.referrerId)
  if (e2) {
    EARNINGS.push({
      id: nid('e'), purchaseId: p.id, beneficiaryId: e2.referrerId, sourceId: buyer,
      branchId: e2.id, level: 'residual', tierYear: tierYear(e2.activatedAt, p.date),
      rate: e2.locked.residual, grossUsd: p.amountUsd,
      amountUsd: round2(p.amountUsd * e2.locked.residual), reversed: false,
    })
  }
  // Depth stops here — no 3rd level.
}

/** Refund a purchase: mark it and reverse (claw back) its earnings. */
export function reversePurchase(purchaseId: string) {
  const p = purchaseById(purchaseId)
  if (!p) return
  p.status = 'refunded'
  for (const e of EARNINGS) if (e.purchaseId === purchaseId) e.reversed = true
}

/** Simulate a new real purchase and accrue it (demo tool). */
export function simulatePurchase(userId: string, amountUsd: number): Purchase {
  const p: Purchase = {
    id: nid('p'), userId, amountUsd: round2(amountUsd),
    coins: Math.round(amountUsd), date: new Date().toISOString().slice(0, 10), status: 'paid',
  }
  PURCHASES.push(p)
  accrue(p.id)
  return p
}

// ---- 6. Cap-aware aggregation (cap only bites when CONFIG.capEnabled) ----
export interface EffEarning { e: Earning; eff: number }
export function effEarningsFor(beneficiaryId: string): EffEarning[] {
  const live = EARNINGS.filter((e) => e.beneficiaryId === beneficiaryId && !e.reversed)
  if (!CONFIG.capEnabled) return live.map((e) => ({ e, eff: e.amountUsd }))
  // Clamp cumulative earnings per branch to the cap, in purchase-date order.
  const byBranch = new Map<string, Earning[]>()
  for (const e of live) { const a = byBranch.get(e.branchId) ?? []; a.push(e); byBranch.set(e.branchId, a) }
  const out: EffEarning[] = []
  for (const rows of byBranch.values()) {
    rows.sort((a, b) => (purchaseById(a.purchaseId)?.date ?? '').localeCompare(purchaseById(b.purchaseId)?.date ?? ''))
    let cum = 0
    for (const e of rows) { const room = Math.max(0, CONFIG.capUsd - cum); const eff = Math.min(e.amountUsd, room); cum += eff; out.push({ e, eff: round2(eff) }) }
  }
  return out
}
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
export function lifetimeEarned(userId: string): number { return round2(sum(effEarningsFor(userId).map((x) => x.eff))) }
export function withdrawnTotal(userId: string): number {
  return round2(sum(WITHDRAWALS.filter((w) => w.userId === userId && w.status === 'approved').map((w) => w.amountUsd)))
}
export function pendingTotal(userId: string): number {
  return round2(sum(WITHDRAWALS.filter((w) => w.userId === userId && w.status === 'pending').map((w) => w.amountUsd)))
}
export function available(userId: string): number {
  return round2(Math.max(0, lifetimeEarned(userId) - withdrawnTotal(userId) - pendingTotal(userId)))
}

export function round2(n: number): number { return Math.round(n * 100) / 100 }

// =====================================================================
// 7. DEMO SEED — chains, multi-year purchases, one override, withdrawals.
// =====================================================================
function edge(referrerId: string, referredId: string, code: string, createdAt: string, activatedAt: string): Referral {
  const r: Referral = { id: nid('ref'), referrerId, referredId, code, createdAt, activatedAt, locked: effectiveScheduleFrozen(referrerId), status: 'active' }
  REFERRALS.push(r)
  return r
}
// Freeze the DEFAULT schedule (no override) for pre-seeded edges so existing
// relationships demonstrate "rates locked at activation" independent of overrides.
function effectiveScheduleFrozen(_userId: string): RateSchedule {
  return { y1: 0.5, y2: 0.3, y3plus: 0.2, residual: 0.1, capUsd: null }
}
function buy(userId: string, date: string, amountUsd: number) {
  PURCHASES.push({ id: nid('p'), userId, amountUsd, coins: Math.round(amountUsd), date, status: 'paid' })
}

// Chains: Alice → Ben → {Cara, Dylan, Eve};  Alice → Dana → Eli;  Riley = fresh.
edge('u_alice', 'u_ben', 'ALICE24', '2025-02-01', '2025-02-15')
edge('u_ben', 'u_cara', 'BEN88', '2025-05-20', '2025-06-01')
edge('u_ben', 'u_dylan', 'BEN88', '2025-12-30', '2026-01-10')
edge('u_ben', 'u_eve', 'BEN88', '2026-03-05', '2026-03-20')
edge('u_alice', 'u_dana', 'ALICE24', '2024-11-10', '2024-12-01')
edge('u_dana', 'u_eli', 'DANA5', '2026-01-20', '2026-02-01')

// Ben's purchases (Alice earns direct 50→30 by year)
buy('u_ben', '2025-03-10', 100); buy('u_ben', '2025-07-22', 250); buy('u_ben', '2026-01-05', 200); buy('u_ben', '2026-04-18', 300)
// Cara / Dylan / Eve (Ben earns direct, Alice earns 10% residual)
buy('u_cara', '2025-06-20', 100); buy('u_cara', '2025-11-11', 150); buy('u_cara', '2026-05-02', 120)
buy('u_dylan', '2026-02-01', 80); buy('u_dylan', '2026-06-15', 200)
buy('u_eve', '2026-04-05', 60)
// Dana (Alice earns direct 50→30) + Eli (Dana earns direct, Alice earns 10% residual)
buy('u_dana', '2025-10-01', 500); buy('u_dana', '2026-06-01', 300)
buy('u_eli', '2026-03-01', 150); buy('u_eli', '2026-06-20', 100)

// Accrue every seeded purchase.
for (const p of PURCHASES) accrue(p.id)

// A prior approved withdrawal (Alice) + a pending one (Ben) for the admin queue.
WITHDRAWALS.push(
  { id: nid('w'), userId: 'u_alice', amountUsd: 200, status: 'approved', requestedAt: '2026-05-10', processedAt: '2026-05-12', note: 'To bank ••4291' },
  { id: nid('w'), userId: 'u_ben', amountUsd: 120, status: 'pending', requestedAt: '2026-06-28', processedAt: null, note: 'To bank ••7730' },
)

// Ids exported for the login switcher.
export const PLAYER_IDS = ['u_alice', 'u_ben', 'u_dana', 'u_fresh'] as const

export function newWithdrawal(userId: string, amountUsd: number, note?: string): WithdrawalRequest {
  const w: WithdrawalRequest = { id: nid('w'), userId, amountUsd: round2(amountUsd), status: 'pending', requestedAt: new Date().toISOString().slice(0, 10), processedAt: null, note }
  WITHDRAWALS.push(w)
  return w
}
export function setWithdrawalStatus(id: string, status: 'approved' | 'rejected') {
  const w = WITHDRAWALS.find((x) => x.id === id)
  if (w && w.status === 'pending') { w.status = status; w.processedAt = new Date().toISOString().slice(0, 10) }
}
