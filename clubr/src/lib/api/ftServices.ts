// FT Fantasy services — swap seam (mock store today, API later).

import { AVAILABLE_FTS, FT_CONTESTS, spendOf } from '@/data/ftStore'
import { CLUBS, USERS } from '@/data/store'
import { MOCK_LATENCY_MS } from '@/config/api'
import { ECONOMY, refund } from '@/data/creditsStore'
import { FINISH_POINTS, type AvailableFT, type ContestEntry, type FTContest, type FTContestView, type FTPlayer } from '@/types/ft'
import { formatClose } from '@/lib/gameSetup'

const delay = (ms = MOCK_LATENCY_MS) => new Promise((r) => setTimeout(r, ms))

function isMember(clubId: string, userId: string): boolean {
  return !!CLUBS.find((c) => c.id === clubId)?.members.some((m) => m.userId === userId && m.status === 'member')
}

// Private contests are only visible to the host, co-hosts, the chosen access
// list, and app admins. Public (default) is visible to all club members.
function canView(c: FTContest, userId: string, isAdmin: boolean): boolean {
  if (c.visibility !== 'private') return true
  return isAdmin || c.hostId === userId || c.coHostIds.includes(userId) || (c.accessUserIds ?? []).includes(userId)
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

export async function getContest(id: string, userId: string, isAdmin = false): Promise<FTContestView | null> {
  await delay()
  const c = FT_CONTESTS.find((x) => x.id === id)
  if (!c || !canView(c, userId, isAdmin)) return null
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

export async function listAvailableFTs(): Promise<AvailableFT[]> {
  await delay()
  return [...AVAILABLE_FTS].sort((a, b) => a.hoursLeft - b.hoursLeft)
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
  name: string; room: string; date: string; startsIn: string; hoursLeft: number; prizePool: string; buyIn: string
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
  AVAILABLE_FTS.unshift({
    id, name: input.name.trim() || 'New final table', room: input.room.trim() || 'Operator',
    startsIn: input.startsIn.trim() || 'soon', hoursLeft: input.hoursLeft, date: input.date.trim() || 'Today',
    prizePool: input.prizePool.trim() || '—', buyIn: input.buyIn.trim() || '—', players,
  })
  return id
}

export async function createContest(clubId: string, hostId: string, input: { ftId: string; stake: number; budget: number; visibility: 'public' | 'private'; accessUserIds: string[]; closesAt: string; timezone: string; payouts: number[] }): Promise<string | null> {
  await delay()
  const ft = AVAILABLE_FTS.find((f) => f.id === input.ftId)
  const club = CLUBS.find((c) => c.id === clubId)
  if (!ft) return null
  const u = USERS[hostId]
  const id = `ct_${Date.now()}`
  FT_CONTESTS.unshift({
    id, clubId, clubName: club?.name ?? 'Club', clubEmoji: club?.emoji ?? '🃏',
    ftName: ft.name,
    visibility: input.visibility,
    accessUserIds: input.visibility === 'private' ? Array.from(new Set([hostId, ...input.accessUserIds])) : [],
    status: 'open', stake: input.stake, budget: input.budget,
    locksAt: input.closesAt ? `Closes ${formatClose(input.closesAt, input.timezone)}` : `${ft.startsIn} · locks 10m before`,
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
