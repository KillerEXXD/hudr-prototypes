// In-memory Last Longer seed data. Mutated by services.

import { USERS } from './store'
import type { LLGame, LLParticipant } from '@/types/ll'

function p(userId: string, status: LLParticipant['status'], paid: boolean, chips: number, ago: string, stale = false, finishPos?: number, bustedAgo?: string): LLParticipant {
  const u = USERS[userId]
  return { userId, name: u?.name ?? 'Guest', avatarColor: u?.avatarColor ?? '#6b7280', avatarUrl: u?.avatarUrl, status, paid, chips, chipsUpdatedAgo: ago, stale, finishPos, bustedAgo }
}

let _cid = 0
const cmsg = (userId: string, text: string, ts: string, kind: 'user' | 'system' = 'user') => {
  _cid += 1
  const u = USERS[userId]
  return { id: `lm_${_cid}`, userId, name: u?.name ?? 'System', avatarColor: u?.avatarColor ?? '#6b7280', text, ts, kind }
}

export const LL_GAMES: LLGame[] = [
  {
    id: 'll_a', clubId: 'c_aces', clubName: 'Aces High', clubEmoji: '🂡', title: 'Friday Night Last Longer',
    status: 'live', stake: 100, hostId: 'u_host', coHostIds: [],
    participants: [
      p('u_host', 'active', true, 285000, 'now'),
      p('u_mike', 'active', true, 245000, '3m'),
      p('u_tom', 'active', false, 190000, '24m', true),
      p('u_lena', 'active', true, 120000, '8m'),
      p('u_jordan', 'pending', false, 0, '—'),
      p('u_cody', 'out', true, 0, '—', false, 7, '52m ago'),
      p('u_dustin', 'out', true, 0, '—', false, 8, '1h 15m ago'),
    ],
    chat: [cmsg('u_host', 'Blinds up to 2k/4k 🔼', '8:10p'), cmsg('u_mike', 'chip leader flexing 😏', '8:12p'), cmsg('u_cody', 'gg me, out in 7th', '8:05p', 'system')],
  },
  {
    id: 'll_b', clubId: 'c_grinders', clubName: 'The Grinders', clubEmoji: '♠️', title: 'Midweek Grind',
    visibility: 'private', accessUserIds: ['u_gary', 'u_lena', 'u_player'],
    status: 'live', stake: 250, hostId: 'u_gary', coHostIds: [],
    participants: [
      p('u_gary', 'active', true, 410000, 'now'),
      p('u_lena', 'active', true, 260000, '6m'),
      p('u_player', 'active', false, 175000, '21m', true), // Sam — can update chips / self-out
    ],
    chat: [cmsg('u_gary', 'Down to 3 — who wants to chop?', '9:30p')],
  },
  {
    id: 'll_c', clubId: 'c_grinders', clubName: 'The Grinders', clubEmoji: '♠️', title: 'Sunday Sweat',
    status: 'registration', registrationClosesAt: 'in 2h 15m', stake: 100, hostId: 'u_gary', coHostIds: [],
    participants: [p('u_gary', 'active', true, 0, 'now'), p('u_lena', 'active', true, 0, 'now')],
    chat: [],
  },
  {
    id: 'll_d', clubId: 'c_felt', clubName: 'Green Felt Club', clubEmoji: '🟢', title: 'Saturday Showdown',
    status: 'completed', stake: 100, hostId: 'u_gary', coHostIds: [], winnerName: 'Mike Jones', settledAt: '2026-05-16',
    participants: [
      p('u_mike', 'out', true, 0, '—', false, 1),
      p('u_tom', 'out', true, 0, '—', false, 2, '15m ago'),
      p('u_lena', 'out', true, 0, '—', false, 3, '48m ago'),
      p('u_cody', 'out', true, 0, '—', false, 4, '1h 20m ago'),
    ],
    chat: [cmsg('u_gary', 'Mike takes it down 🏆', '11:55p', 'system')],
  },
  {
    id: 'll_e', clubId: 'c_grinders', clubName: 'The Grinders', clubEmoji: '♠️', title: "Last Week's Grind",
    status: 'completed', stake: 250, hostId: 'u_gary', coHostIds: [], winnerName: 'Gary Grind', settledAt: '2026-05-22',
    location: 'The Card Room', mode: 'in-person',
    participants: [
      p('u_gary', 'out', true, 0, '—', false, 1),
      p('u_player', 'out', true, 0, '—', false, 2, '1h ago'),
      p('u_lena', 'out', true, 0, '—', false, 3, '2h 10m ago'),
    ],
    chat: [cmsg('u_gary', 'Sam so close — 2nd! GG', '10:40p', 'system')],
  },
  // ---- Aces High (Club Host) — REGISTERING ----
  {
    id: 'll_f', clubId: 'c_aces', clubName: 'Aces High', clubEmoji: '🂡', title: 'Saturday Deep Stack Last Longer',
    status: 'registration', registrationClosesAt: 'in 45m', stake: 100, hostId: 'u_host', coHostIds: [],
    location: 'Aces High Card Room', mode: 'in-person',
    participants: [
      p('u_host', 'active', true, 0, 'now'),
      p('u_mike', 'active', true, 0, 'now'),
      p('u_tom', 'active', false, 0, 'now'),
      p('u_jordan', 'pending', false, 0, '—'),
    ],
    chat: [cmsg('u_host', 'Registration open — cards in the air at 8pm 🃏', '7:15p', 'system')],
  },
  // ---- Aces High (Club Host) — COMPLETED ----
  {
    id: 'll_g', clubId: 'c_aces', clubName: 'Aces High', clubEmoji: '🂡', title: 'Last Friday Last Longer',
    status: 'completed', stake: 100, hostId: 'u_host', coHostIds: [], winnerName: 'Mike Jones', settledAt: '2026-06-12',
    location: 'Aces High Card Room', mode: 'in-person',
    participants: [
      p('u_mike', 'out', true, 0, '—', false, 1),
      p('u_host', 'out', true, 0, '—', false, 2, '20m ago'),
      p('u_tom', 'out', true, 0, '—', false, 3, '55m ago'),
      p('u_dustin', 'out', true, 0, '—', false, 4, '1h 30m ago'),
      p('u_jordan', 'out', true, 0, '—', false, 5, '2h 05m ago'),
    ],
    chat: [cmsg('u_host', 'GG all — Mike takes it down 🏆', '11:48p', 'system')],
  },
  // ---- Demo: Bayou City Poker Club — real Lone Star Poker Series $1M field ----
  {
    id: 'll_champ_done', clubId: 'c_champions', clubName: 'Bayou City Poker Club', clubEmoji: '🏆', title: 'Lone Star Poker Series — $1M Main Event',
    status: 'completed', stake: 250, hostId: 'u_cc_host', coHostIds: [], winnerName: 'Joon Park', settledAt: '2026-06-07',
    location: 'Bayou City Poker Club', mode: 'in-person',
    participants: [
      p('u_cc_p1', 'out', true, 0, '—', false, 1),
      p('u_cc_p2', 'out', true, 0, '—', false, 2, '14m ago'),
      p('u_cc_p3', 'out', true, 0, '—', false, 3, '38m ago'),
      p('u_cc_p4', 'out', true, 0, '—', false, 4, '1h 05m ago'),
      p('u_cc_p5', 'out', true, 0, '—', false, 5, '1h 40m ago'),
      p('u_cc_p6', 'out', true, 0, '—', false, 6, '2h 10m ago'),
      p('u_cc_p7', 'out', true, 0, '—', false, 7, '2h 30m ago'),
      p('u_cc_p8', 'out', true, 0, '—', false, 8, '2h 55m ago'),
      p('u_cc_p9', 'out', true, 0, '—', false, 9, '3h 15m ago'),
    ],
    chat: [cmsg('u_cc_host', 'Joon Park outlasts a stacked field — Lone Star $1M champ 🏆', '11:55p', 'system')],
  },
  {
    id: 'll_champ_live', clubId: 'c_champions', clubName: 'Bayou City Poker Club', clubEmoji: '🏆', title: 'Friday Night Last Longer',
    status: 'live', stake: 100, hostId: 'u_cc_host', coHostIds: [],
    location: 'Bayou City Poker Club', mode: 'in-person',
    participants: [
      p('u_cc_p3', 'active', true, 420000, 'now'),
      p('u_player', 'active', true, 305000, '4m'),
      p('u_cc_p6', 'active', true, 260000, '9m'),
      p('u_cc_p1', 'active', true, 180000, '15m', true),
      p('u_cc_p8', 'out', true, 0, '—', false, 6, '40m ago'),
      p('u_cc_p9', 'out', true, 0, '—', false, 7, '1h 05m ago'),
    ],
    chat: [cmsg('u_cc_host', 'Down to 4 — Kevin chip leads', '9:20p', 'system')],
  },
  {
    id: 'll_champ_reg', clubId: 'c_champions', clubName: 'Bayou City Poker Club', clubEmoji: '🏆', title: 'Saturday Night Last Longer',
    status: 'registration', registrationClosesAt: 'in 3h 30m', stake: 100, hostId: 'u_cc_host', coHostIds: [],
    location: 'Bayou City Poker Club', mode: 'in-person',
    participants: [
      p('u_cc_host', 'active', true, 0, 'now'),
      p('u_cc_p2', 'active', true, 0, 'now'),
      p('u_cc_p5', 'active', true, 0, 'now'),
      p('u_cc_p7', 'active', false, 0, 'now'),
    ],
    chat: [cmsg('u_cc_host', 'Registration open — last longer wins the pool. Cards at 8 🃏', '6:50p', 'system')],
  },
  // ---- Demo: Gulf Coast Card Club — real Trailblazer $1M Main Event field ----
  {
    id: 'll_tch_done', clubId: 'c_tch', clubName: 'Gulf Coast Card Club', clubEmoji: '🃏', title: 'Trailblazer Poker Tour — $1M Main Event',
    status: 'completed', stake: 250, hostId: 'u_tch_host', coHostIds: [], winnerName: 'Travis Preng', settledAt: '2026-06-05',
    location: 'Gulf Coast Card Club', mode: 'in-person',
    participants: [
      p('u_tch_p1', 'out', true, 0, '—', false, 1),
      p('u_tch_p2', 'out', true, 0, '—', false, 2, '16m ago'),
      p('u_tch_p3', 'out', true, 0, '—', false, 3, '42m ago'),
      p('u_tch_p4', 'out', true, 0, '—', false, 4, '1h 10m ago'),
      p('u_tch_p5', 'out', true, 0, '—', false, 5, '1h 35m ago'),
      p('u_tch_p6', 'out', true, 0, '—', false, 6, '2h 05m ago'),
      p('u_tch_p7', 'out', true, 0, '—', false, 7, '2h 25m ago'),
      p('u_tch_p8', 'out', true, 0, '—', false, 8, '2h 50m ago'),
      p('u_tch_p9', 'out', true, 0, '—', false, 9, '3h 10m ago'),
    ],
    chat: [cmsg('u_tch_host', 'Travis Preng takes down the Trailblazer $1M 🏆', '10:30p', 'system')],
  },
  {
    id: 'll_tch_live', clubId: 'c_tch', clubName: 'Gulf Coast Card Club', clubEmoji: '🃏', title: 'Thursday Last Longer',
    status: 'live', stake: 100, hostId: 'u_tch_host', coHostIds: [],
    location: 'Gulf Coast Card Club', mode: 'in-person',
    participants: [
      p('u_tch_p1', 'active', true, 380000, 'now'),
      p('u_player', 'active', true, 290000, '6m'),
      p('u_tch_p4', 'active', true, 210000, '11m'),
      p('u_tch_p7', 'active', false, 140000, '22m', true),
      p('u_tch_p9', 'out', true, 0, '—', false, 5, '35m ago'),
    ],
    chat: [cmsg('u_tch_host', 'Travis chip leads again 😅', '9:05p', 'system')],
  },
  {
    id: 'll_tch_reg', clubId: 'c_tch', clubName: 'Gulf Coast Card Club', clubEmoji: '🃏', title: 'Midweek Deep Stack Last Longer',
    status: 'registration', registrationClosesAt: 'in 1h 50m', stake: 100, hostId: 'u_tch_host', coHostIds: [],
    location: 'Gulf Coast Card Club', mode: 'in-person',
    participants: [
      p('u_tch_host', 'active', true, 0, 'now'),
      p('u_tch_p2', 'active', true, 0, 'now'),
      p('u_tch_p3', 'active', true, 0, 'now'),
      p('u_tch_p6', 'active', false, 0, 'now'),
    ],
    chat: [cmsg('u_tch_host', 'Deep stacks tonight — register now 🃏', '5:40p', 'system')],
  },
]
