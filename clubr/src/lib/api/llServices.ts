// Last Longer services — swap seam (mock store today, API later).

import { LL_GAMES } from '@/data/llStore'
import { CLUBS, USERS } from '@/data/store'
import { MOCK_LATENCY_MS } from '@/config/api'
import { ECONOMY, refund } from '@/data/creditsStore'
import type { LLGame, LLGameView, LLParticipant } from '@/types/ll'
import { type PrivateGate, type PrivateGameInfo } from '@/lib/api/privateGame'
import { fmtChips } from '@/lib/utils/chipFormat'

const delay = (ms = MOCK_LATENCY_MS) => new Promise((r) => setTimeout(r, ms))
const isMember = (clubId: string, userId: string) => !!CLUBS.find((c) => c.id === clubId)?.members.some((m) => m.userId === userId && m.status === 'member')

/** Current chip leader among ACTIVE players (null if nobody has chips yet). */
function chipLeader(g: LLGame): LLParticipant | null {
  const top = g.participants
    .filter((x) => x.status === 'active')
    .reduce<LLParticipant | null>((m, x) => (!m || x.chips > m.chips ? x : m), null)
  return top && top.chips > 0 ? top : null
}

/** Post a system chat line when the chip lead changes hands. */
function announceLeadChange(g: LLGame, prevLeaderId?: string) {
  const leader = chipLeader(g)
  if (leader && leader.userId !== prevLeaderId) {
    g.chat.push({ id: `lm_${Date.now()}`, userId: leader.userId, name: leader.name, avatarColor: leader.avatarColor, text: `👑 ${leader.name} takes the chip lead — ${fmtChips(leader.chips)}`, ts: 'now', kind: 'system' })
  }
}

// Private games are only visible to host, co-hosts, the chosen access list, and admins.
function canView(g: LLGame, userId: string, isAdmin: boolean): boolean {
  if (g.visibility !== 'private') return true
  // Participants can always view a game they've joined (even private + off access list).
  return isAdmin || g.hostId === userId || g.coHostIds.includes(userId) || (g.accessUserIds ?? []).includes(userId) || g.participants.some((p) => p.userId === userId)
}

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
    .filter((g) => (isAdmin || isMember(g.clubId, userId) || g.hostId === userId || g.coHostIds.includes(userId)) && canView(g, userId, isAdmin))
    .map((g) => toView(g, userId, isAdmin))
    .sort((a, b) => Number(a.status === 'completed') - Number(b.status === 'completed'))
}

export async function getGame(id: string, userId: string, isAdmin = false): Promise<LLGameView | PrivateGate | null> {
  await delay()
  const g = LL_GAMES.find((x) => x.id === id)
  if (!g) return null
  if (!canView(g, userId, isAdmin)) return { private: { clubId: g.clubId, clubName: g.clubName, ownerName: CLUBS.find((c) => c.id === g.clubId)?.ownerName ?? 'the club owner' } satisfies PrivateGameInfo }
  return toView(g, userId, isAdmin)
}

export async function requestJoin(gameId: string, userId: string): Promise<void> {
  await delay()
  const g = LL_GAMES.find((x) => x.id === gameId)
  if (!g || g.participants.some((p) => p.userId === userId)) return
  const u = USERS[userId]
  const isHost = g.hostId === userId || g.coHostIds.includes(userId)
  g.participants.push({ userId, name: u?.name ?? 'Guest', avatarColor: u?.avatarColor ?? '#6b7280', status: isHost ? 'active' : 'pending', paid: false, chips: 0, chipsUpdatedAgo: isHost ? 'now' : '—', stale: false })
  g.chat.push({ id: `lm_${Date.now()}`, userId, name: u?.name ?? '', avatarColor: u?.avatarColor ?? '#6b7280', text: isHost ? `🪑 ${u?.name ?? 'The host'} joined as a player` : `🙋 ${u?.name ?? 'A player'} requested to join`, ts: 'now', kind: 'system' })
}

export async function approve(gameId: string, target: string): Promise<void> {
  await delay(150)
  const g = LL_GAMES.find((x) => x.id === gameId)
  const p = g?.participants.find((x) => x.userId === target)
  if (g && p) { p.status = 'active'; p.chipsUpdatedAgo = 'now'; g.chat.push({ id: `lm_${Date.now()}`, userId: target, name: p.name, avatarColor: p.avatarColor, text: `✅ ${p.name} was admitted`, ts: 'now', kind: 'system' }) }
}

export async function decline(gameId: string, target: string): Promise<void> {
  await delay(150)
  const g = LL_GAMES.find((x) => x.id === gameId)
  if (g) {
    if (g.participants.some((p) => p.userId === target)) refund(target, `Refund — declined from ${g.title}`, ECONOMY.joinGameCost)
    g.participants = g.participants.filter((p) => p.userId !== target)
  }
}

export async function togglePaid(gameId: string, target: string): Promise<void> {
  await delay(120)
  const p = LL_GAMES.find((x) => x.id === gameId)?.participants.find((x) => x.userId === target)
  if (p) p.paid = !p.paid
}

export async function assignCoHost(gameId: string, target: string): Promise<void> {
  await delay(150)
  const g = LL_GAMES.find((x) => x.id === gameId)
  if (g && !g.coHostIds.includes(target)) {
    g.coHostIds.push(target)
    const u = USERS[target]
    g.chat.push({ id: `lm_${Date.now()}`, userId: target, name: u?.name ?? '', avatarColor: u?.avatarColor ?? '#6b7280', text: `🛡️ ${u?.name ?? 'A player'} is now a co-host`, ts: 'now', kind: 'system' })
  }
}
export async function removeCoHost(gameId: string, target: string): Promise<void> {
  await delay(150)
  const g = LL_GAMES.find((x) => x.id === gameId)
  if (g && target !== g.hostId && g.coHostIds.includes(target)) {
    g.coHostIds = g.coHostIds.filter((x) => x !== target)
    const u = USERS[target]
    g.chat.push({ id: `lm_${Date.now()}`, userId: target, name: u?.name ?? '', avatarColor: u?.avatarColor ?? '#6b7280', text: `${u?.name ?? 'A player'} is no longer a co-host`, ts: 'now', kind: 'system' })
  }
}

export async function updateChips(gameId: string, userId: string, chips: number): Promise<void> {
  await delay(120)
  const g = LL_GAMES.find((x) => x.id === gameId)
  const p = g?.participants.find((x) => x.userId === userId)
  if (!g || !p) return
  const prevLeaderId = chipLeader(g)?.userId
  p.chips = chips; p.stale = false; p.chipsUpdatedAgo = 'now'
  announceLeadChange(g, prevLeaderId) // new chip leader → chat
}

/** Bust a player. `bySelf` marks a self-out in the chat. */
export async function bust(gameId: string, target: string, byUserId: string): Promise<void> {
  await delay(150)
  const g = LL_GAMES.find((x) => x.id === gameId)
  const p = g?.participants.find((x) => x.userId === target)
  if (!g || !p || p.status !== 'active') return
  const prevLeaderId = chipLeader(g)?.userId
  const activeCount = g.participants.filter((x) => x.status === 'active').length
  p.status = 'out'; p.finishPos = activeCount; p.chips = 0; p.bustedAgo = 'now'
  const self = byUserId === target
  g.chat.push({ id: `lm_${Date.now()}`, userId: target, name: p.name, avatarColor: p.avatarColor, text: self ? `🚪 ${p.name} self-busted — out in ${activeCount}${ord(activeCount)}` : `💥 ${p.name} eliminated — ${activeCount}${ord(activeCount)}`, ts: 'now', kind: 'system' })
  // last one standing → completed
  const remaining = g.participants.filter((x) => x.status === 'active')
  if (remaining.length === 1) { remaining[0].finishPos = 1; remaining[0].status = 'out'; g.status = 'completed'; g.winnerName = remaining[0].name }
  else announceLeadChange(g, prevLeaderId) // bust shifted the chip lead → chat
}

// Host/co-host undoes an accidental bust → the player returns to active. If the
// bust had auto-completed the game, reopen it + reactivate the auto-declared winner.
export async function reinstate(gameId: string, target: string): Promise<void> {
  await delay(150)
  const g = LL_GAMES.find((x) => x.id === gameId)
  const p = g?.participants.find((x) => x.userId === target)
  if (!g || !p || p.status !== 'out') return
  p.status = 'active'; p.finishPos = undefined; p.bustedAgo = undefined
  if (g.status === 'completed') {
    const w = g.participants.find((x) => x.finishPos === 1); if (w) { w.status = 'active'; w.finishPos = undefined }
    g.status = 'live'; g.winnerName = undefined
  }
  g.chat.push({ id: `lm_${Date.now()}`, userId: target, name: p.name, avatarColor: p.avatarColor, text: `↩️ ${p.name} was reinstated by the host`, ts: 'now', kind: 'system' })
}

export async function postChat(gameId: string, userId: string, text: string): Promise<void> {
  await delay(80)
  const g = LL_GAMES.find((x) => x.id === gameId)
  const u = USERS[userId]
  if (g && text.trim()) g.chat.push({ id: `lm_${Date.now()}`, userId, name: u?.name ?? '', avatarColor: u?.avatarColor ?? '#6b7280', text: text.trim(), ts: 'now' })
}

/** Host extends the registration deadline (absolute UTC ISO). Extend-only. */
export async function extendRegistration(gameId: string, closesAt: string): Promise<void> {
  await delay(120); const g = LL_GAMES.find((x) => x.id === gameId); if (g) g.registrationClosesAt = closesAt
}
/** Host closes registration NOW (early) — the game goes live. */
export async function closeRegistration(gameId: string): Promise<void> {
  await delay(120); const g = LL_GAMES.find((x) => x.id === gameId); if (g) { g.status = 'live'; g.registrationClosesAt = new Date().toISOString(); g.regClosedEarly = true }
}

export async function proposeChop(gameId: string, byUserId: string): Promise<void> {
  await delay(150)
  const g = LL_GAMES.find((x) => x.id === gameId)
  if (!g) return
  const active = g.participants.filter((p) => p.status === 'active')
  g.chop = { proposedByName: USERS[byUserId]?.name ?? 'Host', agreements: active.map((p) => ({ userId: p.userId, name: p.name, agreed: p.userId === byUserId })) }
  g.chat.push({ id: `lm_${Date.now()}`, userId: byUserId, name: USERS[byUserId]?.name ?? '', avatarColor: '#6b7280', text: `✂️ ${USERS[byUserId]?.name ?? 'Host'} proposed a chop`, ts: 'now', kind: 'system' })
}

export async function agreeChop(gameId: string, userId: string): Promise<void> {
  await delay(120)
  const g = LL_GAMES.find((x) => x.id === gameId)
  const a = g?.chop?.agreements.find((x) => x.userId === userId)
  if (a) a.agreed = true
  if (g?.chop && g.chop.agreements.every((x) => x.agreed)) {
    // Chop accepted: every survivor is a joint winner (finish 1st) — they split the pool
    // equally. Mark them 'out' so the completed game shows winners (not "still in").
    g.participants.forEach((p) => { if (p.status === 'active') { p.status = 'out'; p.finishPos = 1 } })
    g.status = 'completed'; g.winnerName = 'Chopped'
  }
}

function ord(n: number) { return n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th' }

export async function createGame(clubId: string, hostId: string, input: { title: string; location: string; mode: 'in-person' | 'online'; stake: number; visibility: 'public' | 'private'; accessUserIds: string[]; closesAt: string; timezone: string; payouts: number[] }): Promise<string> {
  await delay()
  const club = CLUBS.find((c) => c.id === clubId)
  const u = USERS[hostId]
  const id = `ll_${Date.now()}`
  LL_GAMES.unshift({
    id, clubId, clubName: club?.name ?? 'Club', clubEmoji: club?.emoji ?? '🃏',
    title: input.title.trim() || 'New Last Longer',
    visibility: input.visibility,
    accessUserIds: input.visibility === 'private' ? Array.from(new Set([hostId, ...input.accessUserIds])) : [],
    location: input.location.trim() || undefined, mode: input.mode,
    status: 'registration', registrationClosesAt: input.closesAt || undefined,
    timezone: input.timezone, payouts: input.payouts,
    stake: input.stake, hostId, coHostIds: [],
    participants: [], // host is NOT auto-added — they join as a player only if they want
    chat: [],
  })
  return id
}

// Invite members to a PRIVATE game — grants view access; they still request & the host admits.
export async function inviteToGame(gameId: string, userIds: string[]): Promise<void> {
  await delay(150)
  const g = LL_GAMES.find((x) => x.id === gameId)
  if (!g) return
  g.accessUserIds = Array.from(new Set([...(g.accessUserIds ?? []), ...userIds]))
  userIds.forEach((uid, i) => {
    const u = USERS[uid]
    g.chat.push({ id: `lm_inv_${Date.now()}_${i}`, userId: uid, name: u?.name ?? '', avatarColor: u?.avatarColor ?? '#6b7280', text: `📨 ${u?.name ?? 'A member'} was invited`, ts: 'now', kind: 'system' })
  })
}
