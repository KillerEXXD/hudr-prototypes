// =====================================================================
// In-memory mock database for the ClubR prototype.
//
// This is the ONLY place mock data lives. The services layer
// (src/lib/api/services.ts) reads and writes this store; components and
// hooks never touch it directly. To go live, the service bodies swap to
// real API calls and this file is deleted — nothing else changes.
// =====================================================================

import type { Club, ContestSummary, LastLongerSummary, User } from '@/types'

// ---- Accounts (one per login role) + extra people who populate clubs ----
export const USERS: Record<string, User> = {
  u_admin: { id: 'u_admin', name: 'Avery Admin', handle: 'avery', email: 'avery@clubr.app', role: 'admin', avatarColor: '#8b5cf6' },
  u_host: { id: 'u_host', name: 'Harper Host', handle: 'harper', email: 'harper@aceshigh.club', role: 'host', avatarColor: '#10b981' },
  u_player: { id: 'u_player', name: 'Sam Rivers', handle: 'sam', email: 'sam@example.com', role: 'player', avatarColor: '#3b82f6' },
  u_gary: { id: 'u_gary', name: 'Gary Grind', handle: 'gary', email: 'gary@grinders.club', role: 'host', avatarColor: '#f59e0b' },
  u_rae: { id: 'u_rae', name: 'Rae Rivers', handle: 'rae', email: 'rae@riverrats.club', role: 'host', avatarColor: '#06b6d4' },
  u_mike: { id: 'u_mike', name: 'Mike Jones', handle: 'mikej', email: 'mike@example.com', role: 'player', avatarColor: '#ef4444' },
  u_tom: { id: 'u_tom', name: 'Tom Wilson', handle: 'tomw', email: 'tom@example.com', role: 'player', avatarColor: '#ec4899' },
  u_lena: { id: 'u_lena', name: 'Lena Park', handle: 'lena', email: 'lena@example.com', role: 'player', avatarColor: '#14b8a6' },
  u_jordan: { id: 'u_jordan', name: 'Jordan Lee', handle: 'jordan', email: 'jordan@example.com', role: 'player', avatarColor: '#f97316' },
  u_dustin: { id: 'u_dustin', name: 'Dustin Cole', handle: 'dustin', email: 'dustin@example.com', role: 'player', avatarColor: '#a855f7' },
  u_cody: { id: 'u_cody', name: 'Cody Banks', handle: 'cody', email: 'cody@example.com', role: 'player', avatarColor: '#eab308' },
}

const u = USERS
function member(id: string, role: 'owner' | 'host' | 'member', status: 'pending' | 'member', joinedAt: string) {
  return { userId: id, name: u[id].name, handle: u[id].handle, avatarColor: u[id].avatarColor, role, status, joinedAt }
}

// ---- Clubs (mutable — join requests + approvals change these) ----
export const CLUBS: Club[] = [
  {
    id: 'c_aces', name: 'Aces High', emoji: '🂡', color: '#ef4444',
    description: 'Friday night home game crew. Final-table fantasy + our weekly Last Longer.',
    ownerId: 'u_host', ownerName: 'Harper Host', inviteCode: 'ACES24', createdAt: '2026-05-02',
    members: [
      member('u_host', 'owner', 'member', '2026-05-02'),
      member('u_mike', 'member', 'member', '2026-05-04'),
      member('u_tom', 'member', 'member', '2026-05-06'),
      member('u_jordan', 'member', 'pending', '2026-06-13'),
      member('u_dustin', 'member', 'pending', '2026-06-14'),
    ],
  },
  {
    id: 'c_grinders', name: 'The Grinders', emoji: '♠️', color: '#10b981',
    description: 'Serious players, serious stacks. We run Stack Draft on every streamed FT.',
    ownerId: 'u_gary', ownerName: 'Gary Grind', inviteCode: 'GRIND7', createdAt: '2026-04-18',
    members: [
      member('u_gary', 'owner', 'member', '2026-04-18'),
      member('u_player', 'member', 'member', '2026-04-20'),
      member('u_lena', 'member', 'member', '2026-04-22'),
    ],
  },
  {
    id: 'c_river', name: 'River Rats', emoji: '🌊', color: '#06b6d4',
    description: 'Casual, friendly, no egos. Come for the Last Longer, stay for the chat.',
    ownerId: 'u_rae', ownerName: 'Rae Rivers', inviteCode: 'RIVER1', createdAt: '2026-06-08',
    members: [
      member('u_rae', 'owner', 'member', '2026-06-08'),
      member('u_cody', 'member', 'member', '2026-06-09'),
    ],
  },
  {
    id: 'c_felt', name: 'Green Felt Club', emoji: '🟢', color: '#22c55e',
    description: 'Old-school felt, new-school tools. FT fantasy every weekend.',
    ownerId: 'u_gary', ownerName: 'Gary Grind', inviteCode: 'FELT99', createdAt: '2026-06-10',
    members: [member('u_gary', 'owner', 'member', '2026-06-10'), member('u_mike', 'member', 'member', '2026-06-11')],
  },
  {
    id: 'c_highrollers', name: 'High Rollers', emoji: '💎', color: '#a855f7',
    description: 'Big stakes, bigger swings. Invite only.',
    ownerId: 'u_rae', ownerName: 'Rae Rivers', inviteCode: 'HIGH88', createdAt: '2026-06-11',
    members: [member('u_rae', 'owner', 'member', '2026-06-11'), member('u_tom', 'member', 'member', '2026-06-12')],
  },
]

// ---- Discover previews (full features arrive in Phases 2 & 3) ----
export const CONTESTS: ContestSummary[] = [
  { id: 'ct1', clubId: 'c_grinders', clubName: 'The Grinders', clubEmoji: '♠️', ftName: 'PokerGO Cup — Event 7 FT', format: 'stack-draft', status: 'open', stake: 250, entries: 11, locksAt: 'in 3h 40m' },
  { id: 'ct2', clubId: 'c_aces', clubName: 'Aces High', clubEmoji: '🂡', ftName: 'WSOP Online — Main FT', format: 'stack-draft', status: 'open', stake: 100, entries: 6, locksAt: 'in 1h 05m' },
  { id: 'ct3', clubId: 'c_felt', clubName: 'Green Felt Club', clubEmoji: '🟢', ftName: 'EPT Monte Carlo FT', format: 'stack-draft', status: 'locked', stake: 500, entries: 14, locksAt: 'locked' },
  { id: 'ct4', clubId: 'c_grinders', clubName: 'The Grinders', clubEmoji: '♠️', ftName: 'Triton Series — HR FT', format: 'pickem', status: 'settled', stake: 250, entries: 9, locksAt: 'settled' },
]

export const LAST_LONGERS: LastLongerSummary[] = [
  { id: 'll1', clubId: 'c_aces', clubName: 'Aces High', clubEmoji: '🂡', title: 'Friday Night Last Longer', status: 'live', stake: 100, players: 38, remaining: 12 },
  { id: 'll2', clubId: 'c_river', clubName: 'River Rats', clubEmoji: '🌊', title: 'Sunday Sweat', status: 'registration', stake: 50, players: 9, remaining: 9 },
  { id: 'll3', clubId: 'c_grinders', clubName: 'The Grinders', clubEmoji: '♠️', title: 'Midweek Grind', status: 'completed', stake: 100, players: 24, remaining: 1 },
]

// Counter for generated ids (avoids relying on wall-clock for uniqueness).
let _seq = 100
export function nextId(prefix: string): string {
  _seq += 1
  return `${prefix}_${_seq}`
}
