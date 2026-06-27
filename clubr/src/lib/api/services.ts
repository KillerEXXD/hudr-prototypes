// =====================================================================
// SERVICES — the single swap seam between the app and its data.
//
// Every screen/hook calls these functions. Today they read & write the
// in-memory mock store with simulated latency. To go live, replace each
// body with an apiClient.get/post call (see src/config/api.ts, USE_MOCK)
// — the signatures and return types stay identical, so NO component or
// hook changes are needed.
// =====================================================================

import { CLUBS, NOTIFICATIONS, USERS, nextId } from '@/data/store'
import { buildDemoClubs, clearDemoClubs } from '@/data/demoSeed'
import { MOCK_LATENCY_MS } from '@/config/api'
import type { AppNotification, Club, ClubMember, ClubView, User } from '@/types'

const delay = (ms = MOCK_LATENCY_MS) => new Promise((r) => setTimeout(r, ms))
const today = () => new Date().toISOString().slice(0, 10)

function buildMember(userId: string, role: ClubMember['role'], status: ClubMember['status']): ClubMember {
  const u = USERS[userId]
  return { userId, name: u?.name ?? 'Guest', handle: u?.handle ?? 'guest', avatarColor: u?.avatarColor ?? '#6b7280', role, status, joinedAt: today() }
}

// Public clubs get a short, shareable code (ACES24); private clubs get a long
// random code (8 chars, ambiguous letters dropped) — copy-and-send only.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const randomCode = (n: number) => Array.from({ length: n }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('')
const readableCode = (name: string) => (name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'CLUB') + Math.floor(10 + Math.random() * 89)
const codeFor = (name: string, visibility: 'public' | 'private') => (visibility === 'private' ? randomCode(8) : readableCode(name))

/** Can this viewer see a PRIVATE club at all? Active member, owner, or app admin.
 *  Pending requesters are NOT included — they stay gated until the owner admits them. */
function canSeePrivate(club: Club, userId: string, isAdmin: boolean): boolean {
  const me = club.members.find((m) => m.userId === userId)
  return isAdmin || me?.role === 'owner' || me?.status === 'member'
}

function toView(club: Club, userId: string, isAdmin: boolean): ClubView {
  const me = club.members.find((m) => m.userId === userId)
  const myStatus = me ? me.status : 'none'
  const canManage = isAdmin || me?.role === 'owner'
  return {
    ...club,
    myStatus,
    myRole: me ? me.role : null,
    canManage,
    pendingCount: club.members.filter((m) => m.status === 'pending').length,
  }
}

// ---- Reads ----
export async function listRecentClubs(userId: string, isAdmin = false): Promise<ClubView[]> {
  await delay()
  // Discovery: private clubs never appear unless you're the admin or already a member
  // (so they're excluded from Discover / search / by-location for everyone else).
  return [...CLUBS]
    .filter((c) => isAdmin || c.visibility !== 'private' || c.members.some((m) => m.userId === userId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((c) => toView(c, userId, isAdmin))
}

export async function listMyClubs(userId: string, isAdmin = false): Promise<ClubView[]> {
  await delay()
  return CLUBS.filter((c) => c.members.some((m) => m.userId === userId) || (isAdmin && false))
    .map((c) => toView(c, userId, isAdmin))
    .sort((a, b) => Number(b.myStatus === 'member') - Number(a.myStatus === 'member'))
}

export async function getClub(clubId: string, userId: string, isAdmin = false): Promise<ClubView | null> {
  await delay()
  const c = CLUBS.find((x) => x.id === clubId)
  // Non-disclosure: a private club the viewer can't see returns null — IDENTICAL to a
  // club that doesn't exist. The caller shows the same generic "enter invite code" gate,
  // so a direct URL can never reveal whether a private club exists.
  if (!c) return null
  if (c.visibility === 'private' && !canSeePrivate(c, userId, isAdmin)) return null
  return toView(c, userId, isAdmin)
}

// ---- Admin reads ----
export async function listAllClubs(): Promise<Club[]> {
  await delay()
  return [...CLUBS]
}

export async function listAllUsers(): Promise<User[]> {
  await delay()
  return Object.values(USERS)
}

// ---- Mutations ----
export async function requestToJoin(clubId: string, userId: string): Promise<ClubView | null> {
  await delay()
  const c = CLUBS.find((x) => x.id === clubId)
  if (!c) return null
  if (!c.members.some((m) => m.userId === userId)) {
    c.members.push(buildMember(userId, 'member', 'pending'))
  }
  return toView(c, userId, false)
}

export async function joinViaInvite(code: string, userId: string): Promise<ClubView | null> {
  await delay()
  const c = CLUBS.find((x) => x.inviteCode.toUpperCase() === code.trim().toUpperCase())
  if (c && !c.members.some((m) => m.userId === userId)) {
    c.members.push(buildMember(userId, 'member', 'pending'))
  }
  // Reveal the club ONLY for a PUBLIC match. A private match (or no match at all) returns
  // null — the two are indistinguishable, so entering a code never confirms a private club
  // exists. The request is still recorded for a private match; the host sees it and admits.
  return c && c.visibility !== 'private' ? toView(c, userId, false) : null
}

/** Richer invite-link outcome (mirrors the live API): a valid PRIVATE code confirms
 *  'private-requested' (request recorded, club NOT disclosed) vs 'club' vs 'not-found'. */
export type InviteOutcome =
  | { kind: 'club'; club: ClubView }
  | { kind: 'private-requested' }
  | { kind: 'not-found' }

export async function applyInviteCode(code: string, userId: string): Promise<InviteOutcome> {
  await delay()
  const c = CLUBS.find((x) => x.inviteCode.toUpperCase() === code.trim().toUpperCase())
  if (!c) return { kind: 'not-found' }
  if (!c.members.some((m) => m.userId === userId)) c.members.push(buildMember(userId, 'member', 'pending'))
  return c.visibility === 'private' ? { kind: 'private-requested' } : { kind: 'club', club: toView(c, userId, false) }
}

export async function createClub(input: { name: string; emoji: string; description: string; location?: string; visibility?: 'public' | 'private'; telegram?: boolean }, userId: string): Promise<ClubView> {
  await delay()
  const u = USERS[userId]
  const visibility = input.visibility ?? 'public'
  const club: Club = {
    id: nextId('c'),
    name: input.name.trim() || 'New Club',
    emoji: input.emoji || '🃏',
    color: '#3b82f6',
    description: input.description.trim(),
    location: (input.location ?? '').trim() || (u?.location ?? ''),
    visibility,
    ownerId: userId,
    ownerName: u?.name ?? 'You',
    inviteCode: codeFor(input.name, visibility),
    createdAt: today(),
    members: [buildMember(userId, 'owner', 'member')],
    // Opted into Telegram at creation → club page shows "Finish Telegram setup".
    telegramSetupPending: input.telegram === true,
  }
  CLUBS.unshift(club)
  // Creating a club makes you an owner — Owner takes precedence over Member.
  if (u && u.role === 'member') u.role = 'owner'
  return toView(club, userId, false)
}

// ---- Demo-clubs onboarding sandbox (docs/DEMO_CLUBS.md) ----

/** Lazily create the caller's two demo clubs (Rookie HQ + Aces Academy) + 6 free games.
 *  Idempotent. Returns Rookie HQ's id to navigate into. */
export async function seedDemoClubs(userId: string): Promise<string> {
  await delay()
  return buildDemoClubs(userId)
}

/** Remove the caller's demo clubs + all their games. */
export async function removeDemoClubs(userId: string): Promise<void> {
  await delay(150)
  clearDemoClubs(userId)
}

/** Host toggles a club between public & private. Rotates the invite code to match
 *  (going private mints a fresh 8-char code so an old short code can't probe it). */
export async function setClubVisibility(clubId: string, visibility: 'public' | 'private'): Promise<void> {
  await delay(120)
  const c = CLUBS.find((x) => x.id === clubId)
  if (!c || c.visibility === visibility) return
  c.visibility = visibility
  c.inviteCode = codeFor(c.name, visibility)
}

export async function approveMember(clubId: string, targetUserId: string): Promise<void> {
  await delay(150)
  const c = CLUBS.find((x) => x.id === clubId)
  const m = c?.members.find((x) => x.userId === targetUserId)
  if (m) m.status = 'member'
}

export async function rejectMember(clubId: string, targetUserId: string): Promise<void> {
  await delay(150)
  const c = CLUBS.find((x) => x.id === clubId)
  if (c) c.members = c.members.filter((x) => x.userId !== targetUserId)
}

// ---- Notifications (the header bell) ----
// Mock store: the seeded rows are the host's inbox (the demo's notification
// audience). Returns them newest-first with the unread count for the badge.
export async function listNotifications(): Promise<{ items: AppNotification[]; unread: number }> {
  await delay(120)
  const items = NOTIFICATIONS.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return { items, unread: items.filter((n) => !n.read).length }
}

export async function markNotificationRead(id: string): Promise<void> {
  await delay(80)
  const n = NOTIFICATIONS.find((x) => x.id === id)
  if (n) n.read = true
}

export async function markAllNotificationsRead(): Promise<void> {
  await delay(80)
  for (const n of NOTIFICATIONS) n.read = true
}
