// In-memory FT Fantasy (Stack Draft) seed data. Mutated by services.

import { USERS } from './store'
import type { AvailableFT, ContestEntry, FTContest, FTPlayer } from '@/types/ft'

export const FT_PLAYERS: FTPlayer[] = [
  { seat: 'A', name: 'Negreanu', bbStack: 95, icmPrice: 38000 },
  { seat: 'B', name: 'Ivey', bbStack: 72, icmPrice: 33000 },
  { seat: 'C', name: 'Hellmuth', bbStack: 58, icmPrice: 29000 },
  { seat: 'D', name: 'Bonomo', bbStack: 44, icmPrice: 26000 },
  { seat: 'E', name: 'Selbst', bbStack: 35, icmPrice: 24000 },
  { seat: 'F', name: 'Holz', bbStack: 26, icmPrice: 22000 },
  { seat: 'G', name: 'Kenney', bbStack: 19, icmPrice: 20000 },
  { seat: 'H', name: 'Konnikova', bbStack: 12, icmPrice: 18000 },
  { seat: 'I', name: 'Seidel', bbStack: 7, icmPrice: 15000 },
]

const PRICE = Object.fromEntries(FT_PLAYERS.map((p) => [p.seat, p.icmPrice]))
export function spendOf(picks: string[]): number {
  return picks.reduce((s, seat) => s + (PRICE[seat] ?? 0), 0)
}

function entry(userId: string, status: 'pending' | 'approved', paid: boolean, picks: string[] = []): ContestEntry {
  const u = USERS[userId]
  return { userId, name: u?.name ?? 'Guest', avatarColor: u?.avatarColor ?? '#6b7280', status, paid, picks, spend: spendOf(picks) }
}

let _cid = 0
const cmsg = (userId: string, text: string, ts: string, kind: 'user' | 'system' = 'user') => {
  _cid += 1
  const u = USERS[userId]
  return { id: `m_${_cid}`, userId, name: u?.name ?? 'System', avatarColor: u?.avatarColor ?? '#6b7280', text, ts, kind }
}

export const FT_CONTESTS: FTContest[] = [
  {
    id: 'ct_a', clubId: 'c_aces', clubName: 'Aces High', clubEmoji: '🂡', ftName: 'WSOP Online — Main FT',
    status: 'open', stake: 100, budget: 100000, locksAt: 'in 1h 05m', hostId: 'u_host', coHostIds: [],
    players: FT_PLAYERS,
    entries: [
      entry('u_host', 'approved', true, ['A', 'C', 'H', 'I']),
      entry('u_mike', 'approved', true, ['B', 'D', 'F', 'G']),
      entry('u_tom', 'approved', false),
      entry('u_jordan', 'pending', false),
      entry('u_dustin', 'pending', false),
    ],
    chat: [cmsg('u_host', 'Locks in an hour — get your drafts in 🃏', '7:42p'), cmsg('u_mike', 'Loaded up on short stacks 😅', '7:45p')],
  },
  {
    id: 'ct_b', clubId: 'c_grinders', clubName: 'The Grinders', clubEmoji: '♠️', ftName: 'PokerGO Cup — Event 7 FT',
    visibility: 'private', accessUserIds: ['u_gary', 'u_lena', 'u_player'],
    status: 'open', stake: 250, budget: 100000, locksAt: 'in 3h 40m', hostId: 'u_gary', coHostIds: [],
    players: FT_PLAYERS,
    entries: [
      entry('u_gary', 'approved', true, ['A', 'B', 'I', 'H']),
      entry('u_lena', 'approved', true, ['C', 'D', 'E', 'G']),
      entry('u_player', 'approved', false), // Sam — approved, hasn't drafted yet
    ],
    chat: [cmsg('u_gary', 'Big stake tonight — good luck all', '6:10p')],
  },
  {
    id: 'ct_c', clubId: 'c_grinders', clubName: 'The Grinders', clubEmoji: '♠️', ftName: 'Triton — Short Deck FT',
    status: 'open', stake: 100, budget: 100000, locksAt: 'in 5h 20m', hostId: 'u_gary', coHostIds: [],
    players: FT_PLAYERS,
    entries: [entry('u_lena', 'approved', true)],
    chat: [],
  },
  {
    id: 'ct_d', clubId: 'c_felt', clubName: 'Green Felt Club', clubEmoji: '🟢', ftName: 'EPT Monte Carlo FT',
    status: 'settled', stake: 250, budget: 100000, locksAt: 'settled', hostId: 'u_gary', coHostIds: [],
    players: FT_PLAYERS,
    finishingOrder: ['C', 'F', 'A', 'H', 'B', 'E', 'I', 'D', 'G'],
    entries: [
      entry('u_mike', 'approved', true, ['A', 'C', 'H', 'I']),
      entry('u_lena', 'approved', true, ['C', 'D', 'E', 'G']),
      entry('u_player', 'approved', true, ['B', 'E', 'F', 'I']),
      entry('u_tom', 'approved', true, ['F', 'G', 'H', 'I']),
    ],
    chat: [cmsg('u_gary', 'GG everyone — Mike runs it', '11:20p', 'system')],
  },
]

// The operator's slate of upcoming, ICM-priced final tables a host can choose to host.
export const AVAILABLE_FTS: AvailableFT[] = [
  { id: 'aft1', name: 'PokerGO Cup — Event 8 FT', room: 'PokerGO', startsIn: 'in 2h 10m', hoursLeft: 2, players: FT_PLAYERS },
  { id: 'aft2', name: 'WSOP Online — High Roller FT', room: 'WSOP', startsIn: 'in 5h 40m', hoursLeft: 6, players: FT_PLAYERS },
  { id: 'aft3', name: 'Triton Series — NLH FT', room: 'Triton', startsIn: 'in 21h', hoursLeft: 21, players: FT_PLAYERS },
  { id: 'aft4', name: 'EPT Barcelona — Main Event FT', room: 'EPT', startsIn: 'tomorrow', hoursLeft: 30, players: FT_PLAYERS },
]
