// FT Fantasy services — swap seam (mock store today, API later).

import { AVAILABLE_FTS, FT_CONTESTS, spendOf } from '@/data/ftStore'
import { CLUBS, USERS } from '@/data/store'
import { MOCK_LATENCY_MS } from '@/config/api'
import { ECONOMY, refund } from '@/data/creditsStore'
import { FINISH_POINTS, type AvailableFT, type ContestEntry, type FTContest, type FTContestView, type FTPlayer, type EligibleFT, type AdminSlateFT } from '@/types/ft'
import { type PrivateGate, type PrivateGameInfo } from '@/lib/api/privateGame'
import { formatCloseInZone } from '@/lib/gameSetup'

const delay = (ms = MOCK_LATENCY_MS) => new Promise((r) => setTimeout(r, ms))

function isMember(clubId: string, userId: string): boolean {
  return !!CLUBS.find((c) => c.id === clubId)?.members.some((m) => m.userId === userId && m.status === 'member')
}

// Private contests are only visible to the host, co-hosts, the chosen access
// list, and app admins. Public (default) is visible to all club members.
function canView(c: FTContest, userId: string, isAdmin: boolean): boolean {
  if (c.visibility !== 'private') return true
  // Entrants can always view a contest they're in (even private + off access list).
  return isAdmin || c.hostId === userId || c.coHostIds.includes(userId) || (c.accessUserIds ?? []).includes(userId) || c.entries.some((e) => e.userId === userId)
}

/** Compute scores + ranks for a settled contest (pure; doesn't mutate). */
function scored(contest: FTContest): ContestEntry[] {
  if (contest.status !== 'settled' || !contest.finishingOrder) return contest.entries
  const fo = contest.finishingOrder
  const withScore = contest.entries.map((e) => ({
    ...e,
    score: e.picks.reduce((s, seat) => { const i = fo.indexOf(seat); return s + (i >= 0 ? FINISH_POINTS[i] : 0) }, 0),
  }))
  withScore.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  withScore.forEach((e, i) => { e.rank = i + 1 })
  return withScore
}

function toView(contest: FTContest, userId: string, isAdmin: boolean): FTContestView {
  const entries = scored(contest)
  return {
    ...contest,
    entries,
    myEntry: entries.find((e) => e.userId === userId) ?? null,
    canManage: isAdmin || contest.hostId === userId || contest.coHostIds.includes(userId),
    isMemberOfClub: isMember(contest.clubId, userId),
  }
}

export async function listContests(userId: string, isAdmin = false): Promise<FTContestView[]> {
  await delay()
  return FT_CONTESTS
    .filter((c) => (isAdmin || isMember(c.clubId, userId) || c.hostId === userId || c.coHostIds.includes(userId) || c.entries.some((e) => e.userId === userId)) && canView(c, userId, isAdmin))
    .map((c) => toView(c, userId, isAdmin))
    .sort((a, b) => Number(a.status === 'settled') - Number(b.status === 'settled'))
}

export async function getContest(id: string, userId: string, isAdmin = false): Promise<FTContestView | PrivateGate | null> {
  await delay()
  const c = FT_CONTESTS.find((x) => x.id === id)
  if (!c) return null
  if (!canView(c, userId, isAdmin)) return { private: { clubId: c.clubId, clubName: c.clubName, ownerName: CLUBS.find((x) => x.id === c.clubId)?.ownerName ?? 'the club owner' } satisfies PrivateGameInfo }
  return toView(c, userId, isAdmin)
}

export async function requestEnter(contestId: string, userId: string): Promise<void> {
  await delay()
  const c = FT_CONTESTS.find((x) => x.id === contestId)
  if (!c || c.entries.some((e) => e.userId === userId)) return
  const u = USERS[userId]
  // A host/co-host joining their own contest is auto-approved (no self-approval dance).
  const isHost = c.hostId === userId || c.coHostIds.includes(userId)
  c.entries.push({ userId, name: u?.name ?? 'Guest', avatarColor: u?.avatarColor ?? '#6b7280', status: isHost ? 'approved' : 'pending', paid: false, picks: [], spend: 0 })
  c.chat.push({ id: `m_${Date.now()}`, userId, name: u?.name ?? '', avatarColor: u?.avatarColor ?? '#6b7280', text: isHost ? `${u?.name ?? 'The host'} joined as a player` : `${u?.name ?? 'A player'} requested to enter`, ts: 'now', kind: 'system' })
}

export async function approveEntry(contestId: string, targetUserId: string): Promise<void> {
  await delay(150)
  const e = FT_CONTESTS.find((x) => x.id === contestId)?.entries.find((x) => x.userId === targetUserId)
  if (e) e.status = 'approved'
}

export async function declineEntry(contestId: string, targetUserId: string): Promise<void> {
  await delay(150)
  const c = FT_CONTESTS.find((x) => x.id === contestId)
  if (c) {
    if (c.entries.some((e) => e.userId === targetUserId)) refund(targetUserId, `Refund — declined from ${c.ftName}`, ECONOMY.joinGameCost)
    c.entries = c.entries.filter((e) => e.userId !== targetUserId)
  }
}

export async function togglePaid(contestId: string, targetUserId: string): Promise<void> {
  await delay(120)
  const e = FT_CONTESTS.find((x) => x.id === contestId)?.entries.find((x) => x.userId === targetUserId)
  if (e) e.paid = !e.paid
}

export async function assignCoHost(contestId: string, targetUserId: string): Promise<void> {
  await delay(150)
  const c = FT_CONTESTS.find((x) => x.id === contestId)
  if (c && !c.coHostIds.includes(targetUserId)) c.coHostIds.push(targetUserId)
}

export async function savePicks(contestId: string, userId: string, picks: string[]): Promise<void> {
  await delay()
  const e = FT_CONTESTS.find((x) => x.id === contestId)?.entries.find((x) => x.userId === userId)
  if (e && e.status === 'approved') { e.picks = picks; e.spend = spendOf(picks) }
}

export async function postChat(contestId: string, userId: string, text: string): Promise<void> {
  await delay(80)
  const c = FT_CONTESTS.find((x) => x.id === contestId)
  const u = USERS[userId]
  if (c && text.trim()) c.chat.push({ id: `m_${Date.now()}`, userId, name: u?.name ?? '', avatarColor: u?.avatarColor ?? '#6b7280', text: text.trim(), ts: 'now' })
}

/** Host extends the registration deadline (absolute UTC ISO). Extend-only. */
export async function extendRegistration(contestId: string, closesAt: string): Promise<void> {
  await delay(120); const c = FT_CONTESTS.find((x) => x.id === contestId)
  if (c) { c.locksAtTs = closesAt; c.locksAt = `Closes ${formatCloseInZone(closesAt, c.timezone)}` }
}
/** Host closes registration NOW (early) — drafts lock. */
export async function closeRegistration(contestId: string): Promise<void> {
  await delay(120); const c = FT_CONTESTS.find((x) => x.id === contestId)
  if (c) { c.status = 'locked'; c.locksAtTs = new Date().toISOString(); c.regClosedEarly = true }
}

/**
 * Complete the contest: enter the public 1st..9th finishing order → scores +
 * winner. Only valid when locked (drafts final) and the order ranks all players.
 */
export async function setFinishingOrder(contestId: string, order: string[]): Promise<void> {
  await delay(150)
  const c = FT_CONTESTS.find((x) => x.id === contestId)
  if (c && c.status === 'locked') {
    c.finishingOrder = order; c.status = 'settled'; c.settledAt = new Date().toISOString()
    const winner = scored(c)[0]
    if (winner) {
      const wu = USERS[winner.userId]
      c.chat.push({ id: `m_${Date.now()}`, userId: '', name: 'ClubrGO', avatarColor: '#ef4444', text: `🏆 ${wu?.name ?? 'Winner'} won the contest — ${winner.score ?? 0} pts`, ts: 'now', kind: 'system' })
    }
  }
}
/** Host cancels the contest with a reason. Voids it (no winner). */
export async function cancelContest(contestId: string, reason: string): Promise<void> {
  await delay(150)
  const c = FT_CONTESTS.find((x) => x.id === contestId)
  if (!c) return
  const r = reason.trim()
  c.status = 'cancelled'; c.cancelReason = r || undefined; c.cancelledAt = new Date().toISOString()
  c.chat.push({ id: `m_${Date.now()}`, userId: '', name: 'ClubrGO', avatarColor: '#ef4444', text: `🚫 Contest cancelled${r ? ` — ${r}` : ''}`, ts: 'now', kind: 'system' })
}

export async function listAvailableFTs(): Promise<AvailableFT[]> {
  // Host slate shows only published FTs (pulled-but-unpublished hidden).
  await delay()
  return [...AVAILABLE_FTS].filter((f) => f.published !== false).sort((a, b) => a.hoursLeft - b.hoursLeft)
}

/** Concave (ICM-style) price from a chip stack — bigger stacks cost more, but
 *  the premium compresses at the top. Maps the shortest stack → 13k, the
 *  chip leader → 35k (the same ladder the seeded FTs use). */
function autoIcmPrice(bbStack: number, minBB: number, maxBB: number): number {
  if (maxBB <= minBB) return 24000
  const t = (Math.sqrt(bbStack) - Math.sqrt(minBB)) / (Math.sqrt(maxBB) - Math.sqrt(minBB))
  return Math.round((13000 + t * (35000 - 13000)) / 1000) * 1000
}

/** App Admin adds a final table to the operator slate. Finalists are seated A..I
 *  by stack (leader first) and ICM-priced automatically from their stacks. */
export async function addAvailableFT(input: {
  name: string; room: string; date: string; startsIn: string; hoursLeft: number; prizePool: string; buyIn: string; level?: string
  finalists: { name: string; bbStack: number }[]
}): Promise<string> {
  await delay()
  const fs = input.finalists.filter((f) => f.name.trim() && f.bbStack > 0).sort((a, b) => b.bbStack - a.bbStack)
  const minBB = Math.min(...fs.map((f) => f.bbStack))
  const maxBB = Math.max(...fs.map((f) => f.bbStack))
  const players: FTPlayer[] = fs.map((f, i) => ({
    seat: String.fromCharCode(65 + i),
    name: f.name.trim(),
    bbStack: f.bbStack,
    chips: f.bbStack * 100000,
    icmPrice: autoIcmPrice(f.bbStack, minBB, maxBB),
  }))
  const id = `aft_${Date.now()}`
  const level = input.level?.trim()
  AVAILABLE_FTS.unshift({
    id, name: input.name.trim() || 'New final table', room: input.room.trim() || 'Operator',
    startsIn: input.startsIn.trim() || 'soon', hoursLeft: input.hoursLeft, date: input.date.trim() || 'Today',
    prizePool: input.prizePool.trim() || '—', buyIn: input.buyIn.trim() || '—', ...(level ? { level } : {}), players,
  })
  return id
}

export async function createContest(clubId: string, hostId: string, input: { ftId: string; name?: string; stake: number; budget: number; visibility: 'public' | 'private'; accessUserIds: string[]; closesAt: string; timezone: string; payouts: number[] }): Promise<string | null> {
  await delay()
  const ft = AVAILABLE_FTS.find((f) => f.id === input.ftId)
  const club = CLUBS.find((c) => c.id === clubId)
  if (!ft) return null
  const u = USERS[hostId]
  const id = `ct_${Date.now()}`
  // Carry the real-event context (room / prize pool / buy-in / level) from the
  // slate FT onto the contest so the detail panel shows it. '—' placeholders are
  // treated as absent so the panel falls back cleanly.
  const real = (v: string | undefined) => (v && v !== '—' ? v : undefined)
  FT_CONTESTS.unshift({
    id, clubId, clubName: club?.name ?? 'Club', clubEmoji: club?.emoji ?? '🃏',
    ftName: input.name?.trim() || ft.name,
    visibility: input.visibility,
    accessUserIds: input.visibility === 'private' ? Array.from(new Set([hostId, ...input.accessUserIds])) : [],
    status: 'open', stake: input.stake, budget: input.budget,
    room: real(ft.room), prizePool: real(ft.prizePool), buyIn: real(ft.buyIn), level: ft.level,
    locksAt: input.closesAt ? `Closes ${formatCloseInZone(input.closesAt, input.timezone)}` : `${ft.startsIn} · locks 10m before`,
    locksAtTs: input.closesAt || undefined, timezone: input.timezone, payouts: input.payouts,
    hostId, coHostIds: [], players: ft.players,
    entries: [], // host is NOT auto-entered — they join as a player only if they want
    chat: [],
  })
  return id
}

// Invite members to a PRIVATE contest — grants them view access. They still
// request to join and the host admits (approval stays mandatory).
export async function inviteToContest(contestId: string, userIds: string[]): Promise<void> {
  await delay(150)
  const c = FT_CONTESTS.find((x) => x.id === contestId)
  if (!c) return
  c.accessUserIds = Array.from(new Set([...(c.accessUserIds ?? []), ...userIds]))
  userIds.forEach((uid, i) => {
    const u = USERS[uid]
    c.chat.push({ id: `m_inv_${Date.now()}_${i}`, userId: uid, name: u?.name ?? '', avatarColor: u?.avatarColor ?? '#6b7280', text: `${u?.name ?? 'A member'} was invited`, ts: 'now', kind: 'system' })
  })
}

// =====================
// ClubrGo admin — pull from TournamentPro + manage the slate (App Admin only)
// =====================

// A small fake "TournamentPro pool" for the mock so the admin dashboard is
// exercisable without a live HUDR API.
const MOCK_ELIGIBLE: Array<{ tournamentId: string; name: string; venue: string; prizePool: string; buyIn: string; level: string; finalists: { name: string; country: string | null; chips: number; bbStack: number }[] }> = [
  {
    tournamentId: 'tpro-texas-poker-open-2026', name: 'Texas Poker Open 2026 — $2.2K Main Event',
    venue: 'Champions Club, Houston', prizePool: '$1,000,000', buyIn: '$2,200', level: '50k / 100k · 100k ante',
    finalists: [
      { name: 'Phu Vo', country: 'United States', chips: 7_200_000, bbStack: 72 },
      { name: 'Bradley Rich', country: 'United States', chips: 5_800_000, bbStack: 58 },
      { name: 'Randall Brooks', country: 'United States', chips: 4_400_000, bbStack: 44 },
      { name: 'Adrian Curry', country: 'United States', chips: 3_500_000, bbStack: 35 },
      { name: 'Brant Jolly', country: 'United States', chips: 3_100_000, bbStack: 31 },
      { name: 'Vladyslav Shovkovyi', country: 'Ukraine', chips: 2_120_000, bbStack: 21 },
    ],
  },
]

export async function listEligibleFTs(): Promise<EligibleFT[]> {
  await delay()
  return MOCK_ELIGIBLE.map((e) => {
    const existing = AVAILABLE_FTS.find((f) => f.sourceTournamentId === e.tournamentId)
    return {
      tournamentId: e.tournamentId, name: e.name, venue: e.venue, finalistCount: e.finalists.length,
      prizePool: e.prizePool, buyIn: e.buyIn, level: e.level,
      pulled: !!existing, availableFtId: existing?.id ?? null, published: existing?.published ?? false,
    }
  })
}

export async function listAdminSlate(): Promise<AdminSlateFT[]> {
  await delay()
  return AVAILABLE_FTS.map((f) => ({
    id: f.id, name: f.name, room: f.room, prizePool: f.prizePool, buyIn: f.buyIn, level: f.level ?? null,
    source: f.source ?? 'manual', sourceTournamentId: f.sourceTournamentId ?? null, published: f.published !== false,
    players: f.players.map((p) => ({ seat: p.seat, name: p.name, country: p.country ?? null, chips: p.chips ?? 0, bbStack: p.bbStack, icmPrice: p.icmPrice })),
  }))
}

export async function pullFinalTable(tournamentId: string): Promise<string> {
  await delay()
  const e = MOCK_ELIGIBLE.find((x) => x.tournamentId === tournamentId)
  if (!e) throw new Error('NOT_FOUND: Not eligible')
  const seated = [...e.finalists].sort((a, b) => b.chips - a.chips).slice(0, 9)
  const minBB = Math.min(...seated.map((f) => f.bbStack || 1)), maxBB = Math.max(...seated.map((f) => f.bbStack || 1))
  const players: FTPlayer[] = seated.map((f, i) => ({ seat: String.fromCharCode(65 + i), name: f.name, country: f.country ?? undefined, chips: f.chips, bbStack: f.bbStack, icmPrice: autoIcmPrice(f.bbStack || 1, minBB, maxBB) }))
  const existing = AVAILABLE_FTS.find((f) => f.sourceTournamentId === tournamentId)
  if (existing) { existing.players = players; existing.prizePool = e.prizePool; existing.buyIn = e.buyIn; existing.level = e.level; return existing.id }
  const id = `aft_tpro_${Date.now()}`
  AVAILABLE_FTS.unshift({ id, name: e.name, room: e.venue, startsIn: 'soon', hoursLeft: 0, date: 'Final table', prizePool: e.prizePool, buyIn: e.buyIn, level: e.level, players, source: 'tpro', sourceTournamentId: tournamentId, published: false })
  return id
}

export async function setFTPublished(ftId: string, published: boolean): Promise<void> {
  await delay(); const f = AVAILABLE_FTS.find((x) => x.id === ftId); if (f) f.published = published
}

export async function updateFTIcm(ftId: string, prices: Array<{ seat: string; icmPrice: number }>): Promise<void> {
  await delay()
  const f = AVAILABLE_FTS.find((x) => x.id === ftId); if (!f) return
  for (const p of prices) { const pl = f.players.find((x) => x.seat === p.seat); if (pl && Number.isFinite(p.icmPrice)) pl.icmPrice = Math.max(0, Math.round(p.icmPrice)) }
}

export async function removeFT(ftId: string): Promise<void> {
  await delay()
  if (FT_CONTESTS.some((c) => c.players === AVAILABLE_FTS.find((f) => f.id === ftId)?.players)) throw new Error('CONFLICT: Cancel contests first')
  const i = AVAILABLE_FTS.findIndex((x) => x.id === ftId); if (i >= 0) AVAILABLE_FTS.splice(i, 1)
}
