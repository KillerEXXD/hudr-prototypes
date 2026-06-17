// In-memory Last Longer seed data. Mutated by services.

import { USERS } from './store'
import type { LLGame, LLParticipant } from '@/types/ll'

function p(userId: string, status: LLParticipant['status'], paid: boolean, chips: number, ago: string, stale = false, finishPos?: number, bustedAgo?: string): LLParticipant {
  const u = USERS[userId]
  return { userId, name: u?.name ?? 'Guest', avatarColor: u?.avatarColor ?? '#6b7280', status, paid, chips, chipsUpdatedAgo: ago, stale, finishPos, bustedAgo }
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
    status: 'registration', stake: 100, hostId: 'u_gary', coHostIds: [],
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
    status: 'registration', stake: 100, hostId: 'u_host', coHostIds: [],
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
  // ---- Demo: Champions Club, Houston ----
  {
    id: 'll_champ_done', clubId: 'c_champions', clubName: 'Champions Club, Houston', clubEmoji: '🏆', title: 'Fall Open — Day 1 Last Longer',
    status: 'completed', stake: 100, hostId: 'u_cc_host', coHostIds: [], winnerName: 'Lena Park', settledAt: '2026-06-07',
    location: 'Champions Club Houston', mode: 'in-person',
    participants: [
      p('u_lena', 'out', true, 0, '—', false, 1),
      p('u_mike', 'out', true, 0, '—', false, 2, '25m ago'),
      p('u_player', 'out', true, 0, '—', false, 3, '1h ago'),
      p('u_jordan', 'out', true, 0, '—', false, 4, '1h 45m ago'),
      p('u_cody', 'out', true, 0, '—', false, 5, '2h 30m ago'),
    ],
    chat: [cmsg('u_cc_host', 'Lena outlasts the field 🏆 — Sam a solid 3rd', '11:20p', 'system')],
  },
  {
    id: 'll_champ_reg', clubId: 'c_champions', clubName: 'Champions Club, Houston', clubEmoji: '🏆', title: 'Saturday Night Last Longer',
    status: 'registration', stake: 100, hostId: 'u_cc_host', coHostIds: [],
    location: 'Champions Club Houston', mode: 'in-person',
    participants: [
      p('u_cc_host', 'active', true, 0, 'now'),
      p('u_mike', 'active', true, 0, 'now'),
      p('u_jordan', 'active', false, 0, 'now'),
    ],
    chat: [cmsg('u_cc_host', 'Registration open — last longer wins the pool. Cards at 8 🃏', '6:50p', 'system')],
  },
  // ---- Demo: Texas Card House, Houston ----
  {
    id: 'll_tch_done', clubId: 'c_tch', clubName: 'Texas Card House, Houston', clubEmoji: '🃏', title: 'Fall Harvest — Last Longer',
    status: 'completed', stake: 250, hostId: 'u_tch_host', coHostIds: [], winnerName: 'Gary Grind', settledAt: '2026-06-05',
    location: 'Texas Card House Houston', mode: 'in-person',
    participants: [
      p('u_gary', 'out', true, 0, '—', false, 1),
      p('u_cody', 'out', true, 0, '—', false, 2, '18m ago'),
      p('u_player', 'out', true, 0, '—', false, 3, '50m ago'),
      p('u_dustin', 'out', true, 0, '—', false, 4, '1h 35m ago'),
    ],
    chat: [cmsg('u_tch_host', 'Gary takes the Harvest 🏆', '10:30p', 'system')],
  },
  {
    id: 'll_tch_reg', clubId: 'c_tch', clubName: 'Texas Card House, Houston', clubEmoji: '🃏', title: 'Midweek Deep Stack Last Longer',
    status: 'registration', stake: 100, hostId: 'u_tch_host', coHostIds: [],
    location: 'Texas Card House Houston', mode: 'in-person',
    participants: [
      p('u_tch_host', 'active', true, 0, 'now'),
      p('u_gary', 'active', true, 0, 'now'),
      p('u_dustin', 'active', false, 0, 'now'),
    ],
    chat: [cmsg('u_tch_host', 'Deep stacks tonight — register now 🃏', '5:40p', 'system')],
  },
]
