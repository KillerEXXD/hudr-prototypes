// In-memory FT Fantasy (Stack Draft) seed data. Mutated by services.

import { USERS } from './store'
import type { AvailableFT, ContestEntry, FTContest, FTPlayer } from '@/types/ft'

// 9-handed final table, ordered by chip stack (leader first). Chips are at the
// current 100k big blind, so chips = bbStack × 100,000.
// 9-handed final table, ordered by chip stack (leader first). Chips are at the
// current 100k big blind, so chips = bbStack × 100,000. Prices are ICM-weighted
// so any legal 4-seat draft fits the 100k budget, but the top-heavy combos do
// not (e.g. A+B+C+D = 116k) — forcing real trade-offs.
export const FT_PLAYERS: FTPlayer[] = [
  { seat: 'A', name: 'Negreanu', first: 'Daniel', last: 'Negreanu', country: '🇨🇦', bbStack: 95, chips: 9_500_000, icmPrice: 35000, icmCash: 1_150_000 },
  { seat: 'B', name: 'Ivey', first: 'Phil', last: 'Ivey', country: '🇺🇸', bbStack: 72, chips: 7_200_000, icmPrice: 30000, icmCash: 880_000 },
  { seat: 'C', name: 'Hellmuth', first: 'Phil', last: 'Hellmuth', country: '🇺🇸', bbStack: 58, chips: 5_800_000, icmPrice: 27000, icmCash: 700_000 },
  { seat: 'D', name: 'Bonomo', first: 'Justin', last: 'Bonomo', country: '🇺🇸', bbStack: 44, chips: 4_400_000, icmPrice: 24000, icmCash: 560_000 },
  { seat: 'E', name: 'Selbst', first: 'Vanessa', last: 'Selbst', country: '🇺🇸', bbStack: 35, chips: 3_500_000, icmPrice: 22000, icmCash: 450_000 },
  { seat: 'F', name: 'Holz', first: 'Fedor', last: 'Holz', country: '🇩🇪', bbStack: 26, chips: 2_600_000, icmPrice: 20000, icmCash: 360_000 },
  { seat: 'G', name: 'Kenney', first: 'Bryn', last: 'Kenney', country: '🇺🇸', bbStack: 19, chips: 1_900_000, icmPrice: 18000, icmCash: 290_000 },
  { seat: 'H', name: 'Konnikova', first: 'Maria', last: 'Konnikova', country: '🇺🇸', bbStack: 12, chips: 1_200_000, icmPrice: 16000, icmCash: 235_000 },
  { seat: 'I', name: 'Seidel', first: 'Erik', last: 'Seidel', country: '🇺🇸', bbStack: 7, chips: 700_000, icmPrice: 13000, icmCash: 190_000 },
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
    status: 'open', stake: 100, budget: 100000, locksAt: 'in 1h 05m',
    room: 'WSOP Online', prizePool: '$2,400,000', buyIn: '$1,000', level: '40k / 80k · 80k ante', streamUrl: 'https://www.youtube.com/@WSOP/streams', streamLive: false,
    hostId: 'u_host', coHostIds: [],
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
    status: 'open', stake: 250, budget: 100000, locksAt: 'in 3h 40m',
    room: 'PokerGO', prizePool: '$1,065,000', buyIn: '$10,000', level: '30k / 60k · 60k ante', streamUrl: 'https://www.youtube.com/@PokerGO/streams', streamLive: false,
    hostId: 'u_gary', coHostIds: [],
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
    status: 'open', stake: 100, budget: 100000, locksAt: 'in 5h 20m',
    room: 'Triton', prizePool: '$6,200,000', buyIn: '$50,000', level: '50k / 100k · 100k ante', streamUrl: 'https://www.youtube.com/@TritonPoker/streams', streamLive: false,
    hostId: 'u_gary', coHostIds: [],
    players: FT_PLAYERS,
    entries: [entry('u_lena', 'approved', true)],
    chat: [],
  },
  {
    id: 'ct_d', clubId: 'c_felt', clubName: 'Green Felt Club', clubEmoji: '🟢', ftName: 'EPT Monte Carlo FT',
    status: 'settled', stake: 250, budget: 100000, locksAt: 'settled',
    room: 'EPT', prizePool: '$5,100,000', buyIn: '$5,300', level: 'Final · table done', streamUrl: 'https://www.youtube.com/@PokerStars/streams', streamLive: false,
    hostId: 'u_gary', coHostIds: [],
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
  {
    id: 'ct_h', clubId: 'c_grinders', clubName: 'The Grinders', clubEmoji: '♠️', ftName: 'GG Super MILLION$ FT',
    status: 'locked', stake: 100, budget: 100000, locksAt: 'locked · plays in 25m',
    room: 'GGPoker', prizePool: '$1,800,000', buyIn: '$10,300', level: '50k / 100k · 100k ante', streamUrl: 'https://www.youtube.com/@GGPoker/streams', streamLive: true,
    hostId: 'u_gary', coHostIds: [],
    players: FT_PLAYERS,
    entries: [
      entry('u_gary', 'approved', true, ['A', 'B', 'I', 'H']),
      entry('u_lena', 'approved', true, ['C', 'D', 'E', 'G']),
      entry('u_player', 'approved', false, ['A', 'C', 'H', 'I']),
    ],
    chat: [cmsg('u_gary', 'Locked! Cards in the air soon 🔒', '9:05p', 'system')],
  },
  {
    id: 'ct_i', clubId: 'c_aces', clubName: 'Aces High', clubEmoji: '🂡', ftName: 'partypoker MILLIONS FT',
    status: 'locked', stake: 250, budget: 100000, locksAt: 'locked · plays in 12m',
    room: 'partypoker', prizePool: '$5,000,000', buyIn: '$10,300', level: '50k / 100k · 100k ante', streamUrl: 'https://www.youtube.com/@partypokerTV/streams', streamLive: true,
    hostId: 'u_host', coHostIds: [],
    players: FT_PLAYERS,
    entries: [
      entry('u_mike', 'approved', true, ['B', 'D', 'F', 'G']),
      entry('u_tom', 'approved', false, ['A', 'C', 'E', 'I']),
    ],
    chat: [],
  },
  // ---- Completed (settled) — POINTS format: top 3 split the pot ----
  {
    id: 'ct_j', clubId: 'c_aces', clubName: 'Aces High', clubEmoji: '🂡', ftName: 'WSOP Main Event — Final Table',
    status: 'settled', format: 'points', stake: 250, budget: 100000, locksAt: 'settled',
    room: 'WSOP', prizePool: '$10,000,000', buyIn: '$10,000', level: 'Final · table done', streamUrl: 'https://www.youtube.com/@WSOP/streams', streamLive: false,
    hostId: 'u_host', coHostIds: [],
    players: FT_PLAYERS,
    finishingOrder: ['A', 'C', 'B', 'F', 'D', 'I', 'E', 'G', 'H'],
    entries: [
      entry('u_host', 'approved', true, ['A', 'C', 'F', 'I']), // 223 pts → 1st
      entry('u_tom', 'approved', true, ['A', 'B', 'G', 'I']), // 174 pts → 2nd
      entry('u_player', 'approved', true, ['A', 'D', 'F', 'H']), // 163 pts → 3rd (Sam — Player demo account)
      entry('u_dustin', 'approved', true, ['B', 'C', 'H', 'I']), // 141 pts → 4th
      entry('u_jordan', 'approved', true, ['C', 'D', 'F', 'G']), // 136 pts → 5th
      entry('u_mike', 'approved', true, ['B', 'D', 'E', 'H']), // 90 pts → 6th
    ],
    chat: [cmsg('u_host', 'GG all — Harper takes it down 🏆', '1:05a', 'system')],
  },
  // ---- Completed (settled) — WINNER TAKES ALL: only 1st is paid ----
  {
    id: 'ct_k', clubId: 'c_aces', clubName: 'Aces High', clubEmoji: '🂡', ftName: 'Triton Invitational — High Roller FT',
    status: 'settled', format: 'winner_takes_all', stake: 500, budget: 100000, locksAt: 'settled',
    room: 'Triton', prizePool: '$8,900,000', buyIn: '$100,000', level: 'Final · table done', streamUrl: 'https://www.youtube.com/@TritonPoker/streams', streamLive: false,
    hostId: 'u_host', coHostIds: [],
    players: FT_PLAYERS,
    finishingOrder: ['B', 'A', 'H', 'C', 'I', 'D', 'E', 'F', 'G'],
    entries: [
      entry('u_mike', 'approved', true, ['A', 'B', 'H', 'I']), // 245 pts → WINNER, takes the pot
      entry('u_player', 'approved', true, ['A', 'H', 'C', 'I']), // 180 pts → 2nd, no payout (WTA) — Sam, Player demo account
      entry('u_jordan', 'approved', true, ['B', 'E', 'G', 'H']), // 165 pts
      entry('u_host', 'approved', true, ['A', 'D', 'F', 'H']), // 144 pts
      entry('u_tom', 'approved', true, ['C', 'D', 'E', 'F']), // 71 pts
    ],
    chat: [cmsg('u_host', 'Winner takes all — Mike scoops the whole pot 💰', '12:40a', 'system')],
  },
]

// The operator's slate of upcoming, ICM-priced final tables a host can choose to host.
export const AVAILABLE_FTS: AvailableFT[] = [
  { id: 'aft1', name: 'PokerGO Cup — Event 8 FT', room: 'PokerGO', startsIn: 'in 2h 10m', hoursLeft: 2, date: 'Today · 8:00pm ET', prizePool: '$1,200,000', buyIn: '$25,000', players: FT_PLAYERS },
  { id: 'aft2', name: 'WSOP Online — High Roller FT', room: 'WSOP', startsIn: 'in 5h 40m', hoursLeft: 6, date: 'Today · 11:30pm ET', prizePool: '$3,450,000', buyIn: '$10,000', players: FT_PLAYERS },
  { id: 'aft3', name: 'Triton Series — NLH FT', room: 'Triton', startsIn: 'in 21h', hoursLeft: 21, date: 'Tomorrow · 6:00pm ET', prizePool: '$8,900,000', buyIn: '$100,000', players: FT_PLAYERS },
  { id: 'aft4', name: 'EPT Barcelona — Main Event FT', room: 'EPT', startsIn: 'tomorrow', hoursLeft: 30, date: 'Sat · 3:00pm ET', prizePool: '$5,100,000', buyIn: '$5,300', players: FT_PLAYERS },
]
