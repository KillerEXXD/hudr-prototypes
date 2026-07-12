// =====================================================================
// Demo-clubs seed (mock). Builds a user's two throwaway sandbox clubs —
// Rookie HQ (they own) + Aces Academy (they're a member) — each with 3
// free games (one of each type) populated by the 6 shared demo bots, all
// tagged isDemo so they stay walled off from real surfaces.
//
// See docs/DEMO_CLUBS.md. The live backend (Phase 2) replaces this with a
// `seed-demo` edge function; the service layer hides the mock/live swap.
// =====================================================================

import type { Club, ClubMember } from '@/types'
import type { ContestEntry, FTContest } from '@/types/ft'
import type { LLGame, LLParticipant } from '@/types/ll'
import type { SquaresGame, SquaresParticipant, SquaresCell } from '@/types/squares'
import { CLUBS, USERS, DEMO_BOT_IDS, nextId } from './store'
import { FT_CONTESTS, FT_PLAYERS } from './ftStore'
import { LL_GAMES } from './llStore'
import { SQUARES_GAMES } from './squaresStore'

export const ROOKIE_NAME = 'Rookie HQ'
export const ACES_NAME = 'Aces Academy'
const TODAY = '2026-06-27'

// ---- local row builders (shapes mirror the stores' private seed helpers) ----
function clubMember(id: string, role: 'owner' | 'member', status: 'pending' | 'member'): ClubMember {
  const u = USERS[id]
  return { userId: id, name: u.name, handle: u.handle, avatarColor: u.avatarColor, role, status, joinedAt: TODAY }
}
function ftEntry(id: string): ContestEntry {
  const u = USERS[id]
  return { userId: id, name: u.name, avatarColor: u.avatarColor, status: 'approved', paid: true, picks: [], spend: 0 }
}
function llPart(id: string, chips: number, ago: string): LLParticipant {
  const u = USERS[id]
  return { userId: id, name: u.name, avatarColor: u.avatarColor, status: 'active', paid: true, chips, chipsUpdatedAgo: ago, stale: false }
}
function sqPart(id: string): SquaresParticipant {
  const u = USERS[id]
  return { userId: id, name: u.name, avatarColor: u.avatarColor, status: 'active', paid: true }
}
/** 100-cell grid with the first `n` cells claimed (approved) by rotating bots. */
function sqGrid(n: number): SquaresCell[] {
  const cells: SquaresCell[] = Array.from({ length: 100 }, () => ({}))
  for (let i = 0; i < n; i++) {
    const u = USERS[DEMO_BOT_IDS[i % DEMO_BOT_IDS.length]]
    cells[i * 7 + 3] = { userId: u.id, name: u.name, avatarColor: u.avatarColor, approved: true }
  }
  return cells
}
const PERIODS = [
  { label: 'Q1' as const, pct: 10 }, { label: 'Q2' as const, pct: 10 },
  { label: 'Q3' as const, pct: 10 }, { label: 'Final' as const, pct: 70 },
]

/** True once a user already has their demo clubs (seed is idempotent). */
export function hasDemoClubs(userId: string): boolean {
  return CLUBS.some((c) => c.isDemo === true && c.members.some((m) => m.userId === userId))
}

/** The user's demo club ids (for removal / navigation). */
export function demoClubIdsFor(userId: string): string[] {
  return CLUBS.filter((c) => c.isDemo === true && c.members.some((m) => m.userId === userId)).map((c) => c.id)
}

/**
 * Create the two demo clubs for `userId` (idempotent). Returns the id of
 * Rookie HQ (the owner club) to navigate into. The 6 bots populate both.
 */
export function buildDemoClubs(userId: string): string {
  const existing = CLUBS.find((c) => c.isDemo === true && c.ownerId === userId)
  if (existing) return existing.id

  const me = USERS[userId]
  const botMembers = DEMO_BOT_IDS.map((b) => clubMember(b, 'member', 'member'))

  // Club A: Rookie HQ — the user OWNS it (hosts games, manages players).
  const rookieId = nextId('c')
  const rookie: Club = {
    id: rookieId, name: ROOKIE_NAME, emoji: '🎓', color: '#3b82f6',
    description: 'Your training sandbox — host games, manage players, and learn the ropes. Nothing here is real.',
    location: 'Demo City', visibility: 'public',
    ownerId: userId, ownerName: me.name, inviteCode: 'ROOKIE', createdAt: TODAY, isDemo: true,
    members: [clubMember(userId, 'owner', 'member'), ...botMembers],
  }

  // Club B: Aces Academy — the user is a MEMBER (joins + plays); a bot hosts.
  const acesId = nextId('c')
  const botHost = DEMO_BOT_IDS[0]
  const aces: Club = {
    id: acesId, name: ACES_NAME, emoji: '🃏', color: '#8b5cf6',
    description: 'A friendly demo club to play in — join games, draft a team, claim squares, chase the leaderboard.',
    location: 'Demo City', visibility: 'public',
    ownerId: botHost, ownerName: USERS[botHost].name, inviteCode: 'ACADEMY', createdAt: TODAY, isDemo: true,
    members: [clubMember(botHost, 'owner', 'member'), clubMember(userId, 'member', 'member'),
      ...DEMO_BOT_IDS.slice(1).map((b) => clubMember(b, 'member', 'member'))],
  }

  CLUBS.unshift(aces, rookie) // rookie unshifted last → ends up first in the carousel

  seedGames(rookie, userId)
  seedGames(aces, botHost)

  return rookieId
}

/** Push one game of each type into a demo club, hosted by `hostId`. */
function seedGames(club: Club, hostId: string) {
  const base = { clubId: club.id, clubName: club.name, clubEmoji: club.emoji, hostId, coHostIds: [] as string[] }
  const bots = DEMO_BOT_IDS

  const ft: FTContest = {
    ...base, id: nextId('ct'), ftName: 'Demo Final Table', status: 'open',
    stake: 100, budget: 100000, locksAt: 'in 2h 00m',
    room: 'Demo Stream', prizePool: '$1,000,000', buyIn: '$1,000', level: '40k / 80k · 80k ante',
    streamUrl: '', streamLive: false,
    players: FT_PLAYERS,
    entries: bots.slice(0, 4).map(ftEntry),
    chat: [],
  }
  FT_CONTESTS.unshift(ft)

  const ll: LLGame = {
    ...base, id: nextId('ll'), title: 'Demo Last Longer', status: 'live', stake: 100,
    participants: [
      llPart(bots[0], 280000, 'now'), llPart(bots[1], 210000, '4m'),
      llPart(bots[2], 155000, '9m'), llPart(bots[3], 95000, '2m'),
    ],
    chat: [],
  }
  LL_GAMES.unshift(ll)

  const sq: SquaresGame = {
    ...base, id: nextId('sq'), title: 'Demo Squares', homeTeam: 'Hearts', awayTeam: 'Spades',
    visibility: 'public', status: 'registration', timezone: 'CT', stake: 50,
    cells: sqGrid(12), rowDigits: [], colDigits: [],
    periods: PERIODS,
    participants: bots.map(sqPart),
    chat: [],
  }
  SQUARES_GAMES.unshift(sq)
}

/** Remove a user's demo clubs + all their games. */
export function clearDemoClubs(userId: string): void {
  const ids = new Set(demoClubIdsFor(userId))
  if (!ids.size) return
  const purge = <T extends { clubId: string }>(arr: T[]) => {
    for (let i = arr.length - 1; i >= 0; i--) if (ids.has(arr[i].clubId)) arr.splice(i, 1)
  }
  purge(FT_CONTESTS); purge(LL_GAMES); purge(SQUARES_GAMES)
  for (let i = CLUBS.length - 1; i >= 0; i--) if (ids.has(CLUBS[i].id)) CLUBS.splice(i, 1)
}
