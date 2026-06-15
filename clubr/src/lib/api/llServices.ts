// Last Longer services — swap seam (mock store today, API later).

import { LL_GAMES } from '@/data/llStore'
import { CLUBS, USERS } from '@/data/store'
import { MOCK_LATENCY_MS } from '@/config/api'
import type { LLGame, LLGameView } from '@/types/ll'

const delay = (ms = MOCK_LATENCY_MS) => new Promise((r) => setTimeout(r, ms))
const isMember = (clubId: string, userId: string) => !!CLUBS.find((c) => c.id === clubId)?.members.some((m) => m.userId === userId && m.status === 'member')

function toView(g: LLGame, userId: string, isAdmin: boolean): LLGameView {
  return {
    ...g,
    me: g.participants.find((p) => p.userId === userId) ?? null,
    canManage: isAdmin || g.hostId === userId || g.coHostIds.includes(userId),
    isMemberOfClub: isMember(g.clubId, userId),
    activeCount: g.participants.filter((p) => p.status === 'active').length,
  }
}

export async function listGames(userId: string, isAdmin = false): Promise<LLGameView[]> {
  await delay()
  return LL_GAMES
    .filter((g) => isAdmin || isMember(g.clubId, userId) || g.hostId === userId || g.coHostIds.includes(userId))
    .map((g) => toView(g, userId, isAdmin))
    .sort((a, b) => Number(a.status === 'completed') - Number(b.status === 'completed'))
}

export async function getGame(id: string, userId: string, isAdmin = false): Promise<LLGameView | null> {
  await delay()
  const g = LL_GAMES.find((x) => x.id === id)
  return g ? toView(g, userId, isAdmin) : null
}

export async function requestJoin(gameId: string, userId: string): Promise<void> {
  await delay()
  const g = LL_GAMES.find((x) => x.id === gameId)
  if (!g || g.participants.some((p) => p.userId === userId)) return
  const u = USERS[userId]
  g.participants.push({ userId, name: u?.name ?? 'Guest', avatarColor: u?.avatarColor ?? '#6b7280', status: 'pending', paid: false, chips: 0, chipsUpdatedAgo: '—', stale: false })
  g.chat.push({ id: `lm_${Date.now()}`, userId, name: u?.name ?? '', avatarColor: u?.avatarColor ?? '#6b7280', text: `${u?.name ?? 'A player'} requested to join`, ts: 'now', kind: 'system' })
}

export async function approve(gameId: string, target: string): Promise<void> {
  await delay(150)
  const p = LL_GAMES.find((x) => x.id === gameId)?.participants.find((x) => x.userId === target)
  if (p) { p.status = 'active'; p.chipsUpdatedAgo = 'now' }
}

export async function decline(gameId: string, target: string): Promise<void> {
  await delay(150)
  const g = LL_GAMES.find((x) => x.id === gameId)
  if (g) g.participants = g.participants.filter((p) => p.userId !== target)
}

export async function togglePaid(gameId: string, target: string): Promise<void> {
  await delay(120)
  const p = LL_GAMES.find((x) => x.id === gameId)?.participants.find((x) => x.userId === target)
  if (p) p.paid = !p.paid
}

export async function assignCoHost(gameId: string, target: string): Promise<void> {
  await delay(150)
  const g = LL_GAMES.find((x) => x.id === gameId)
  if (g && !g.coHostIds.includes(target)) g.coHostIds.push(target)
}

export async function updateChips(gameId: string, userId: string, chips: number): Promise<void> {
  await delay(120)
  const p = LL_GAMES.find((x) => x.id === gameId)?.participants.find((x) => x.userId === userId)
  if (p) { p.chips = chips; p.stale = false; p.chipsUpdatedAgo = 'now' }
}

/** Bust a player. `bySelf` marks a self-out in the chat. */
export async function bust(gameId: string, target: string, byUserId: string): Promise<void> {
  await delay(150)
  const g = LL_GAMES.find((x) => x.id === gameId)
  const p = g?.participants.find((x) => x.userId === target)
  if (!g || !p || p.status !== 'active') return
  const activeCount = g.participants.filter((x) => x.status === 'active').length
  p.status = 'out'; p.finishPos = activeCount; p.chips = 0
  const self = byUserId === target
  g.chat.push({ id: `lm_${Date.now()}`, userId: target, name: p.name, avatarColor: p.avatarColor, text: self ? `${p.name} self-busted — out in ${activeCount}${ord(activeCount)}` : `${p.name} eliminated — ${activeCount}${ord(activeCount)}`, ts: 'now', kind: 'system' })
  // last one standing → completed
  const remaining = g.participants.filter((x) => x.status === 'active')
  if (remaining.length === 1) { remaining[0].finishPos = 1; remaining[0].status = 'out'; g.status = 'completed'; g.winnerName = remaining[0].name }
}

export async function postChat(gameId: string, userId: string, text: string): Promise<void> {
  await delay(80)
  const g = LL_GAMES.find((x) => x.id === gameId)
  const u = USERS[userId]
  if (g && text.trim()) g.chat.push({ id: `lm_${Date.now()}`, userId, name: u?.name ?? '', avatarColor: u?.avatarColor ?? '#6b7280', text: text.trim(), ts: 'now' })
}

export async function proposeChop(gameId: string, byUserId: string): Promise<void> {
  await delay(150)
  const g = LL_GAMES.find((x) => x.id === gameId)
  if (!g) return
  const active = g.participants.filter((p) => p.status === 'active')
  g.chop = { proposedByName: USERS[byUserId]?.name ?? 'Host', agreements: active.map((p) => ({ userId: p.userId, name: p.name, agreed: p.userId === byUserId })) }
  g.chat.push({ id: `lm_${Date.now()}`, userId: byUserId, name: USERS[byUserId]?.name ?? '', avatarColor: '#6b7280', text: `${USERS[byUserId]?.name ?? 'Host'} proposed a chop`, ts: 'now', kind: 'system' })
}

export async function agreeChop(gameId: string, userId: string): Promise<void> {
  await delay(120)
  const g = LL_GAMES.find((x) => x.id === gameId)
  const a = g?.chop?.agreements.find((x) => x.userId === userId)
  if (a) a.agreed = true
  if (g?.chop && g.chop.agreements.every((x) => x.agreed)) { g.status = 'completed'; g.winnerName = 'Chopped' }
}

function ord(n: number) { return n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th' }
