// =====================================================================
// SERVICES — the single swap seam between the app and its data.
//
// Every screen/hook calls these functions. Today they read & write the
// in-memory mock store with simulated latency. To go live, replace each
// body with an apiClient.get/post call (see src/config/api.ts, USE_MOCK)
// — the signatures and return types stay identical, so NO component or
// hook changes are needed.
// =====================================================================

import { CLUBS, USERS, nextId } from '@/data/store'
import { MOCK_LATENCY_MS } from '@/config/api'
import type { Club, ClubMember, ClubView, User } from '@/types'

const delay = (ms = MOCK_LATENCY_MS) => new Promise((r) => setTimeout(r, ms))
const today = () => new Date().toISOString().slice(0, 10)

function buildMember(userId: string, role: ClubMember['role'], status: ClubMember['status']): ClubMember {
  const u = USERS[userId]
  return { userId, name: u?.name ?? 'Guest', handle: u?.handle ?? 'guest', avatarColor: u?.avatarColor ?? '#6b7280', role, status, joinedAt: today() }
}

function toView(club: Club, userId: string, isAdmin: boolean): ClubView {
  const me = club.members.find((m) => m.userId === userId)
  const myStatus = me ? me.status : 'none'
  const canManage = isAdmin || me?.role === 'owner' || me?.role === 'host'
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
  return [...CLUBS]
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
  return c ? toView(c, userId, isAdmin) : null
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
  if (!c) return null
  if (!c.members.some((m) => m.userId === userId)) {
    c.members.push(buildMember(userId, 'member', 'pending'))
  }
  return toView(c, userId, false)
}

export async function createClub(input: { name: string; emoji: string; description: string; location?: string }, userId: string): Promise<ClubView> {
  await delay()
  const u = USERS[userId]
  const code = (input.name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'CLUB') + Math.floor(10 + Math.random() * 89)
  const club: Club = {
    id: nextId('c'),
    name: input.name.trim() || 'New Club',
    emoji: input.emoji || '🃏',
    color: '#3b82f6',
    description: input.description.trim(),
    location: (input.location ?? '').trim() || (u?.location ?? ''),
    ownerId: userId,
    ownerName: u?.name ?? 'You',
    inviteCode: code,
    createdAt: today(),
    members: [buildMember(userId, 'owner', 'member')],
  }
  CLUBS.unshift(club)
  return toView(club, userId, false)
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
