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

// ---- Lifecycle: leave / remove / owner-manage / dissolve / delete-account ----
//
// All implementations follow the plan documented at
// C:\Users\ravee\.claude\plans\776-dont-fix-want-sequential-bonbon.md. They are
// mock-side stubs: real refund/forfeit cascade lives behind the edge functions
// (Phase 2). For demo purposes we just adjust the in-memory store + show the
// consequence preview in the UI.

export interface LeavePreview {
  pendingSquares: number
  paidSquares: number
  liveLLChips: number
  lockedFTPicks: number
}

/** Preview what will happen if the caller leaves this club. Drives the consequence
 *  list rendered in LeaveClubSheet so the user sees EXACTLY what they're giving up. */
export async function previewLeaveClub(_clubId: string, _userId: string): Promise<LeavePreview> {
  await delay(120)
  // Mock data: pretend the user has a couple of active stakes in the club.
  // Real implementation scans the 3 game tables and refunds/forfeits per the
  // B3 rule documented in the plan.
  return { pendingSquares: 1, paidSquares: 3, liveLLChips: 235000, lockedFTPicks: 0 }
}

/** Member leaves a club (self-only). Removes the row + runs forfeit/refund per
 *  active game type. NB: blocked for the Creator — they must Dissolve or
 *  promote a successor first. */
export async function leaveClub(clubId: string, userId: string): Promise<{ ok: boolean; reason?: 'creator_must_dissolve' }> {
  await delay(180)
  const c = CLUBS.find((x) => x.id === clubId)
  if (!c) return { ok: true }
  if (c.creatorId === userId) return { ok: false, reason: 'creator_must_dissolve' }
  c.members = c.members.filter((m) => m.userId !== userId)
  return { ok: true }
}

/** Owner removes a non-Owner member. 30-day re-invite cooldown applies in v2. */
export async function removeMember(clubId: string, targetUserId: string): Promise<void> {
  await delay(150)
  const c = CLUBS.find((x) => x.id === clubId)
  if (c) c.members = c.members.filter((m) => m.userId !== targetUserId)
}

/** Creator adds a new Owner from the members list. */
export async function addOwner(clubId: string, targetUserId: string, callerUserId: string): Promise<{ ok: boolean; reason?: 'creator_only' }> {
  await delay(150)
  const c = CLUBS.find((x) => x.id === clubId)
  if (!c) return { ok: true }
  if (c.creatorId !== callerUserId) return { ok: false, reason: 'creator_only' }
  const m = c.members.find((x) => x.userId === targetUserId)
  if (m) m.role = 'owner'
  return { ok: true }
}

/** Creator demotes an Owner to regular member. Cannot demote the Creator themselves. */
export async function removeOwner(clubId: string, targetUserId: string, callerUserId: string): Promise<{ ok: boolean; reason?: 'creator_only' | 'cannot_demote_creator' }> {
  await delay(150)
  const c = CLUBS.find((x) => x.id === clubId)
  if (!c) return { ok: true }
  if (c.creatorId !== callerUserId) return { ok: false, reason: 'creator_only' }
  if (c.creatorId === targetUserId) return { ok: false, reason: 'cannot_demote_creator' }
  const m = c.members.find((x) => x.userId === targetUserId)
  if (m) m.role = 'member'
  return { ok: true }
}

/** Creator dissolves the club. Brutal + irreversible. Auto-settles active games. */
export async function dissolveClub(clubId: string, callerUserId: string): Promise<{ ok: boolean; reason?: 'creator_only' }> {
  await delay(220)
  const c = CLUBS.find((x) => x.id === clubId)
  if (!c) return { ok: true }
  if (c.creatorId !== callerUserId) return { ok: false, reason: 'creator_only' }
  c.dissolvedAt = new Date().toISOString()
  c.dissolvedBy = callerUserId
  // In the real backend: cancel all active games, refund pending entries,
  // notify members. Mock just marks the club as dissolved and removes
  // non-Creator members so it disappears from their views.
  c.members = c.members.filter((m) => m.userId === c.creatorId)
  return { ok: true }
}

export interface AccountDeletePreview {
  clubMemberCount: number
  createdClubs: { id: string; name: string }[]
  activeGamesCount: number
}

/** Surfaces what the user is about to walk away from in Step 1 of the delete flow. */
export async function previewDeleteAccount(userId: string): Promise<AccountDeletePreview> {
  await delay(140)
  const memberships = CLUBS.filter((c) => c.members.some((m) => m.userId === userId))
  const created = CLUBS.filter((c) => c.creatorId === userId).map((c) => ({ id: c.id, name: c.name }))
  return {
    clubMemberCount: memberships.length,
    createdClubs: created,
    activeGamesCount: 2, // mock
  }
}

/** Anonymize the user account. PII wiped immediately; account row stays for 14d
 *  grace window so the user can log back in to restore. After 14d a cron job
 *  hard-purges (not modeled in prototype). */
export async function deleteAccount(userId: string): Promise<{ ok: boolean; reason?: 'creator_must_resolve' }> {
  await delay(220)
  // Check if the user is the Creator of any non-dissolved club; if so, refuse.
  const createdActive = CLUBS.filter((c) => c.creatorId === userId && !c.dissolvedAt)
  if (createdActive.length > 0) return { ok: false, reason: 'creator_must_resolve' }
  // Auto-leave all club memberships.
  for (const c of CLUBS) c.members = c.members.filter((m) => m.userId !== userId)
  return { ok: true }
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
