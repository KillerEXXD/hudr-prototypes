// Telegram integration — swap seam (mock today; real bot + webhook later). SPEC §22.
// MOCK ONLY: simulates the host linking a broadcast channel, a member linking their
// Telegram account, and the approval-gated channel join. The real version is a
// platform bot (@ClubRBot) + a webhook edge function that approves/declines channel
// join-requests by matching the Telegram user to an APPROVED club member.

import { CLUBS, USERS } from '@/data/store'
import { MOCK_LATENCY_MS } from '@/config/api'
import type { ClubTelegram, TelegramStatus } from '@/types'

const delay = (ms = MOCK_LATENCY_MS) => new Promise((r) => setTimeout(r, ms))

// Mock "who is in each club's channel" — keyed by clubId → set of userIds.
const CHANNEL_MEMBERS: Record<string, Set<string>> = {}
const channelSet = (clubId: string) => (CHANNEL_MEMBERS[clubId] ??= new Set())

const isApprovedMember = (clubId: string, userId: string) =>
  !!CLUBS.find((c) => c.id === clubId)?.members.some((m) => m.userId === userId && m.status === 'member')

// ---- Host: connect / disconnect the club's channel ----
export async function connectChannel(clubId: string, link: string, title: string): Promise<void> {
  await delay(120)
  const c = CLUBS.find((x) => x.id === clubId)
  if (c) c.telegram = { link: link.trim(), title: title.trim() || `${c.name} channel` }
}
export async function disconnectChannel(clubId: string): Promise<void> {
  await delay(120)
  const c = CLUBS.find((x) => x.id === clubId)
  if (c) { delete c.telegram; channelSet(clubId).clear() }
}

// ---- Member: link their Telegram account (real = bot deep-link t.me/ClubRBot?start=) ----
export async function linkTelegram(userId: string, handle = 'you'): Promise<void> {
  await delay(150)
  if (USERS[userId]) USERS[userId].telegramHandle = handle.replace(/^@/, '') || 'you'
}

// ---- Status for the join card ----
export async function getTelegramStatus(clubId: string, userId: string): Promise<TelegramStatus> {
  await delay(60)
  const c = CLUBS.find((x) => x.id === clubId)
  const channel: ClubTelegram | null = c?.telegram ?? null
  return {
    channel,
    linked: !!USERS[userId]?.telegramHandle,
    joined: channelSet(clubId).has(userId),
    canJoin: isApprovedMember(clubId, userId),
  }
}

// ---- Member: request to join the channel. The (mock) bot admits ONLY an approved,
//      linked member — mirroring the webhook's approveChatJoinRequest gate. ----
export type JoinChannelResult = 'joined' | 'needs-link' | 'not-approved' | 'no-channel'
export async function joinChannel(clubId: string, userId: string): Promise<JoinChannelResult> {
  await delay(180)
  const c = CLUBS.find((x) => x.id === clubId)
  if (!c?.telegram) return 'no-channel'
  if (!isApprovedMember(clubId, userId)) return 'not-approved'
  if (!USERS[userId]?.telegramHandle) return 'needs-link'
  channelSet(clubId).add(userId) // bot approves the join-request
  return 'joined'
}

// Auto-remove: when a member leaves/is removed from the club, the bot kicks them.
export function removeFromChannel(clubId: string, userId: string): void {
  channelSet(clubId).delete(userId)
}
