// FT Fantasy services — swap seam (mock store today, API later).

import { FT_CONTESTS, spendOf } from '@/data/ftStore'
import { CLUBS, USERS } from '@/data/store'
import { MOCK_LATENCY_MS } from '@/config/api'
import { FINISH_POINTS, type ContestEntry, type FTContest, type FTContestView } from '@/types/ft'

const delay = (ms = MOCK_LATENCY_MS) => new Promise((r) => setTimeout(r, ms))

function isMember(clubId: string, userId: string): boolean {
  return !!CLUBS.find((c) => c.id === clubId)?.members.some((m) => m.userId === userId && m.status === 'member')
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
    .filter((c) => isAdmin || isMember(c.clubId, userId) || c.hostId === userId || c.coHostIds.includes(userId))
    .map((c) => toView(c, userId, isAdmin))
    .sort((a, b) => Number(a.status === 'settled') - Number(b.status === 'settled'))
}

export async function getContest(id: string, userId: string, isAdmin = false): Promise<FTContestView | null> {
  await delay()
  const c = FT_CONTESTS.find((x) => x.id === id)
  return c ? toView(c, userId, isAdmin) : null
}

export async function requestEnter(contestId: string, userId: string): Promise<void> {
  await delay()
  const c = FT_CONTESTS.find((x) => x.id === contestId)
  if (!c || c.entries.some((e) => e.userId === userId)) return
  const u = USERS[userId]
  c.entries.push({ userId, name: u?.name ?? 'Guest', avatarColor: u?.avatarColor ?? '#6b7280', status: 'pending', paid: false, picks: [], spend: 0 })
  c.chat.push({ id: `m_${Date.now()}`, userId, name: u?.name ?? '', avatarColor: u?.avatarColor ?? '#6b7280', text: `${u?.name ?? 'A player'} requested to enter`, ts: 'now', kind: 'system' })
}

export async function approveEntry(contestId: string, targetUserId: string): Promise<void> {
  await delay(150)
  const e = FT_CONTESTS.find((x) => x.id === contestId)?.entries.find((x) => x.userId === targetUserId)
  if (e) e.status = 'approved'
}

export async function declineEntry(contestId: string, targetUserId: string): Promise<void> {
  await delay(150)
  const c = FT_CONTESTS.find((x) => x.id === contestId)
  if (c) c.entries = c.entries.filter((e) => e.userId !== targetUserId)
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
