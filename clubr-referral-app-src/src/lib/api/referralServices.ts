// Referral services — the swap seam (mock store today, api.hudr.ai later).
// Components/hooks never touch the store directly; they call these.
import { MOCK_LATENCY_MS } from '@/config/api'
import * as s from '@/data/referralStore'
import { EARNINGS, REFERRALS, WITHDRAWALS, PURCHASES, CONFIG, OVERRIDES } from '@/data/referralStore'
import type {
  AdminKpis, AdminPlayerRow, EarningDetail, Earning, PlayerSummary, RefConfig,
  Referral, ReferralRow, WithdrawalRequest,
} from '@/types/referral'

const delay = (ms = MOCK_LATENCY_MS) => new Promise((r) => setTimeout(r, ms))
const codeOf = (userId: string) => REFERRALS.find((r) => r.referrerId === userId)?.code ?? `${userId.slice(2, 7).toUpperCase()}`

// Global effective-earning map (earningId → capped $), covers every beneficiary.
function buildEff(): Map<string, number> {
  const m = new Map<string, number>()
  const ids = new Set(EARNINGS.map((e) => e.beneficiaryId))
  for (const id of ids) for (const { e, eff } of s.effEarningsFor(id)) m.set(e.id, eff)
  return m
}
const detail = (e: Earning, eff: number): EarningDetail => {
  const p = s.purchaseById(e.purchaseId)
  return { ...e, amountUsd: eff, purchaseDate: p?.date ?? '', purchaseStatus: p?.status ?? 'paid', sourceName: s.userName(e.sourceId) }
}

function referralRow(edge: Referral, eff: Map<string, number>): ReferralRow {
  const mine = EARNINGS.filter((e) => e.beneficiaryId === edge.referrerId && e.branchId === edge.id && !e.reversed)
  const directEarned = mine.filter((e) => e.level === 'direct').reduce((a, e) => a + (eff.get(e.id) ?? 0), 0)
  const residualFromThem = mine.filter((e) => e.level === 'residual').reduce((a, e) => a + (eff.get(e.id) ?? 0), 0)
  const dates = mine.map((e) => s.purchaseById(e.purchaseId)?.date ?? '').filter(Boolean).sort()
  return {
    referral: edge, name: s.userName(edge.referredId), avatarColor: s.userColor(edge.referredId), avatarUrl: s.userPic(edge.referredId),
    tierYearNow: s.tierYear(edge.activatedAt), directEarned: s.round2(directEarned), residualFromThem: s.round2(residualFromThem),
    subCount: s.referralsBy(edge.referredId).length, lastActivity: dates.length ? dates[dates.length - 1] : null,
  }
}

// ---------- Player ----------
export async function getSummary(userId: string): Promise<PlayerSummary> {
  await delay(60)
  const eff = buildEff()
  const directReferrals = s.referralsBy(userId).map((edge) => referralRow(edge, eff))
  const residualCount = directReferrals.reduce((a, r) => a + r.subCount, 0)
  return {
    userId, name: s.userName(userId), avatarColor: s.userColor(userId), avatarUrl: s.userPic(userId), code: codeOf(userId),
    lifetimeEarned: s.lifetimeEarned(userId), withdrawn: s.withdrawnTotal(userId), pending: s.pendingTotal(userId), available: s.available(userId),
    directCount: directReferrals.length, residualCount, directReferrals,
  }
}

export async function getReferralDetail(referralId: string): Promise<{ row: ReferralRow; subs: ReferralRow[]; ledger: EarningDetail[] } | null> {
  await delay(60)
  const edge = REFERRALS.find((r) => r.id === referralId)
  if (!edge) return null
  const eff = buildEff()
  const row = referralRow(edge, eff)
  // Ben's own referrals — each shown with Alice's residual from that sub.
  const subs = s.referralsBy(edge.referredId).map((subEdge) => {
    const residualFromThem = EARNINGS.filter((e) => e.beneficiaryId === edge.referrerId && e.level === 'residual' && e.sourceId === subEdge.referredId && !e.reversed).reduce((a, e) => a + (eff.get(e.id) ?? 0), 0)
    return { ...referralRow(subEdge, eff), directEarned: 0, residualFromThem: s.round2(residualFromThem) }
  })
  const ledger = EARNINGS.filter((e) => e.beneficiaryId === edge.referrerId && e.branchId === edge.id && e.level === 'direct' && !e.reversed)
    .map((e) => detail(e, eff.get(e.id) ?? 0)).sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate))
  return { row, subs, ledger }
}

export async function getResidualDetail(beneficiaryId: string, sourceId: string): Promise<{ sourceName: string; ledger: EarningDetail[] }> {
  await delay(50)
  const eff = buildEff()
  const ledger = EARNINGS.filter((e) => e.beneficiaryId === beneficiaryId && e.level === 'residual' && e.sourceId === sourceId && !e.reversed)
    .map((e) => detail(e, eff.get(e.id) ?? 0)).sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate))
  return { sourceName: s.userName(sourceId), ledger }
}

export async function listWithdrawals(userId: string): Promise<WithdrawalRequest[]> {
  await delay(40)
  return WITHDRAWALS.filter((w) => w.userId === userId).slice().sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))
}
export async function requestWithdrawal(userId: string, amountUsd: number, note?: string): Promise<{ ok: boolean; error?: string }> {
  await delay(120)
  if (amountUsd < CONFIG.minWithdrawalUsd) return { ok: false, error: `Minimum withdrawal is $${CONFIG.minWithdrawalUsd}.` }
  if (amountUsd > s.available(userId)) return { ok: false, error: 'Amount exceeds your available balance.' }
  s.newWithdrawal(userId, amountUsd, note)
  return { ok: true }
}

// ---------- Admin ----------
function subtreeIds(userId: string): string[] {
  const l1 = s.referralsBy(userId).map((r) => r.referredId)
  const l2 = l1.flatMap((id) => s.referralsBy(id).map((r) => r.referredId))
  return [...new Set([...l1, ...l2])]
}
export async function listPlayers(): Promise<AdminPlayerRow[]> {
  await delay(70)
  const eff = buildEff()
  const referrerIds = [...new Set(REFERRALS.map((r) => r.referrerId))]
  return referrerIds.map((userId) => {
    const sub = subtreeIds(userId)
    const subRevenue = PURCHASES.filter((p) => p.status === 'paid' && sub.includes(p.userId)).reduce((a, p) => a + p.amountUsd, 0)
    const payouts = EARNINGS.filter((e) => !e.reversed && sub.includes(e.sourceId)).reduce((a, e) => a + (eff.get(e.id) ?? 0), 0)
    const o = OVERRIDES[userId]
    const sc = s.effectiveSchedule(userId)
    return {
      userId, name: s.userName(userId), avatarColor: s.userColor(userId), avatarUrl: s.userPic(userId),
      scheduleLabel: `${pct(sc.y1)} / ${pct(sc.y2)} / ${pct(sc.y3plus)} · ${pct(sc.residual)}`,
      hasOverride: !!o && Object.keys(o).length > 0,
      directCount: s.referralsBy(userId).length, residualCount: subtreeIds(userId).length - s.referralsBy(userId).length,
      earned: s.lifetimeEarned(userId), appShare: s.round2(subRevenue - payouts),
    }
  }).sort((a, b) => b.earned - a.earned)
}

export async function getPlayerAdmin(userId: string): Promise<{ summary: PlayerSummary; ledger: EarningDetail[]; override: Partial<RefConfig> | null; scheduleLabel: string }> {
  await delay(70)
  const summary = await getSummary(userId)
  const eff = buildEff()
  const ledger = EARNINGS.filter((e) => e.beneficiaryId === userId && !e.reversed).map((e) => detail(e, eff.get(e.id) ?? 0)).sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate))
  const sc = s.effectiveSchedule(userId)
  return { summary, ledger, override: OVERRIDES[userId] ?? null, scheduleLabel: `${pct(sc.y1)} / ${pct(sc.y2)} / ${pct(sc.y3plus)} · ${pct(sc.residual)}` }
}

export async function getKpis(): Promise<AdminKpis> {
  await delay(60)
  const eff = buildEff()
  const coinRevenue = PURCHASES.filter((p) => p.status === 'paid').reduce((a, p) => a + p.amountUsd, 0)
  const paidToReferrers = [...eff.values()].reduce((a, v) => a + v, 0)
  const withdrawn = WITHDRAWALS.filter((w) => w.status === 'approved').reduce((a, w) => a + w.amountUsd, 0)
  const pendingWithdrawals = WITHDRAWALS.filter((w) => w.status === 'pending').reduce((a, w) => a + w.amountUsd, 0)
  const beneficiaries = [...new Set(EARNINGS.filter((e) => !e.reversed).map((e) => e.beneficiaryId))]
  const topReferrers = beneficiaries.map((id) => ({ userId: id, name: s.userName(id), avatarColor: s.userColor(id), avatarUrl: s.userPic(id), earned: s.lifetimeEarned(id) }))
    .sort((a, b) => b.earned - a.earned).slice(0, 5)
  return {
    coinRevenue: s.round2(coinRevenue), paidToReferrers: s.round2(paidToReferrers), outstanding: s.round2(paidToReferrers - withdrawn),
    pendingWithdrawals: s.round2(pendingWithdrawals), activeReferrers: beneficiaries.length, totalReferrals: REFERRALS.length, topReferrers,
  }
}

export async function getConfig(): Promise<RefConfig> { await delay(40); return { ...CONFIG } }
export async function updateConfig(c: RefConfig): Promise<void> {
  await delay(90)
  CONFIG.y1 = c.y1; CONFIG.y2 = c.y2; CONFIG.y3plus = c.y3plus; CONFIG.residual = c.residual
  CONFIG.capEnabled = c.capEnabled; CONFIG.capUsd = Math.max(0, c.capUsd); CONFIG.minWithdrawalUsd = Math.max(0, c.minWithdrawalUsd)
}
export async function setOverride(userId: string, o: Partial<Pick<RefConfig, 'y1' | 'y2' | 'y3plus' | 'residual'>> | null): Promise<void> {
  await delay(80)
  if (!o || Object.keys(o).length === 0) delete OVERRIDES[userId]
  else OVERRIDES[userId] = o
}

export async function listWithdrawalQueue(): Promise<(WithdrawalRequest & { name: string; avatarColor?: string; avatarUrl?: string | null })[]> {
  await delay(50)
  return WITHDRAWALS.slice().sort((a, b) => (a.status === 'pending' ? -1 : 1) - (b.status === 'pending' ? -1 : 1) || b.requestedAt.localeCompare(a.requestedAt))
    .map((w) => ({ ...w, name: s.userName(w.userId), avatarColor: s.userColor(w.userId), avatarUrl: s.userPic(w.userId) }))
}
export async function decideWithdrawal(id: string, status: 'approved' | 'rejected'): Promise<void> { await delay(90); s.setWithdrawalStatus(id, status) }
export async function reverse(purchaseId: string): Promise<void> { await delay(90); s.reversePurchase(purchaseId) }
export async function simulate(userId: string, amountUsd: number): Promise<void> { await delay(120); s.simulatePurchase(userId, amountUsd) }

function pct(n: number): string { return `${Math.round(n * 100)}` }
