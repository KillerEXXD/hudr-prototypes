import type { SquaresGame, SquaresCell, SquaresParticipant } from '@/types/squares'
import { emptyGrid } from '@/types/squares'
import { USERS } from '@/data/store'

const u = USERS
const part = (id: string, status: SquaresParticipant['status'], paid: boolean): SquaresParticipant =>
  ({ userId: id, name: u[id].name, avatarColor: u[id].avatarColor, status, paid })
const claim = (cells: SquaresCell[], idx: number, id: string, approved = true) => { cells[idx] = { userId: id, name: u[id].name, avatarColor: u[id].avatarColor, approved } }

// ---- registration board: claims open, digits still sealed (all host-approved already) ----
const regCells = emptyGrid()
;([[0,'u_mike'],[5,'u_tom'],[12,'u_jordan'],[23,'u_mike'],[34,'u_tom'],[41,'u_host'],[47,'u_jordan'],
  [55,'u_mike'],[63,'u_tom'],[71,'u_jordan'],[78,'u_host'],[80,'u_mike'],[88,'u_tom'],[92,'u_jordan'],[99,'u_host']] as [number, string][])
  .forEach(([i, id]) => claim(regCells, i, id))

// ---- approval-demo board (ongoing): Sam (Player) has 2 approved + 3 pending; others pending too ----
const apprCells = emptyGrid()
;([[22,'u_player'],[35,'u_player'],[10,'u_mike'],[56,'u_tom'],[44,'u_host']] as [number, string][])
  .forEach(([i, id]) => claim(apprCells, i, id, true))   // host-approved → locked in
;([[3,'u_player'],[48,'u_player'],[61,'u_player'],[27,'u_mike'],[73,'u_tom'],[88,'u_jordan']] as [number, string][])
  .forEach(([i, id]) => claim(apprCells, i, id, false))  // pending host approval → withdrawable

// ---- completed board: full grid + assigned digits + period winners ----
const doneCells = emptyGrid()
const fillers = ['u_player', 'u_gary', 'u_lena', 'u_mike', 'u_tom']
for (let i = 0; i < 100; i++) claim(doneCells, i, fillers[i % fillers.length])
const rowDigits = [3, 7, 0, 5, 9, 1, 4, 8, 2, 6] // HOME, down the side
const colDigits = [1, 8, 4, 0, 6, 2, 9, 3, 7, 5] // AWAY, across the top
const winAt = (home: number, away: number) => {
  const idx = rowDigits.indexOf(home % 10) * 10 + colDigits.indexOf(away % 10)
  return { winnerCell: idx, winnerUserId: doneCells[idx].userId }
}

// ---- Demo Texas clubs: completed boards (full grid + digits + period winners) ----
const winIn = (cells: SquaresCell[], rowD: number[], colD: number[], home: number, away: number) => {
  const idx = rowD.indexOf(home % 10) * 10 + colD.indexOf(away % 10)
  return { winnerCell: idx, winnerUserId: cells[idx].userId }
}
const champDone = emptyGrid()
for (let i = 0; i < 100; i++) claim(champDone, i, ['u_player', 'u_mike', 'u_lena', 'u_jordan', 'u_cody'][i % 5])
const tchDone = emptyGrid()
for (let i = 0; i < 100; i++) claim(tchDone, i, ['u_player', 'u_gary', 'u_cody', 'u_dustin', 'u_mike'][i % 5])
// ---- registration boards (partial claims → joinable) ----
const champReg = emptyGrid()
;([[2, 'u_mike'], [14, 'u_lena'], [27, 'u_jordan'], [38, 'u_cody'], [45, 'u_cc_host'], [56, 'u_mike'], [63, 'u_lena'], [71, 'u_jordan'], [88, 'u_cc_host']] as [number, string][]).forEach(([i, id]) => claim(champReg, i, id))
const tchReg = emptyGrid()
;([[1, 'u_gary'], [9, 'u_cody'], [22, 'u_dustin'], [33, 'u_gary'], [44, 'u_tch_host'], [55, 'u_cody'], [67, 'u_dustin'], [79, 'u_gary'], [90, 'u_tch_host']] as [number, string][]).forEach(([i, id]) => claim(tchReg, i, id))

export const SQUARES_GAMES: SquaresGame[] = [
  {
    id: 'sq_c', clubId: 'c_aces', clubName: 'Aces High', clubEmoji: '🂡',
    title: 'Sunday Night Squares', homeTeam: 'Ravens', awayTeam: 'Bills',
    visibility: 'public', status: 'registration', timezone: 'CT',
    stake: 50, hostId: 'u_host', coHostIds: [],
    cells: apprCells, rowDigits: [], colDigits: [],
    periods: [{ label: 'Q1', pct: 10 }, { label: 'Q2', pct: 10 }, { label: 'Q3', pct: 10 }, { label: 'Final', pct: 70 }],
    participants: [part('u_host', 'active', true), part('u_player', 'active', false), part('u_mike', 'active', true), part('u_tom', 'active', false), part('u_jordan', 'active', true)],
    chat: [],
  },
  {
    id: 'sq_a', clubId: 'c_aces', clubName: 'Aces High', clubEmoji: '🂡',
    title: 'Sunday Squares', homeTeam: 'Chiefs', awayTeam: 'Eagles',
    visibility: 'public', status: 'registration', timezone: 'CT',
    stake: 100, hostId: 'u_host', coHostIds: [],
    cells: regCells, rowDigits: [], colDigits: [],
    periods: [{ label: 'Q1', pct: 10 }, { label: 'Q2', pct: 10 }, { label: 'Q3', pct: 10 }, { label: 'Final', pct: 70 }],
    participants: [part('u_host', 'active', true), part('u_mike', 'active', true), part('u_tom', 'active', false), part('u_jordan', 'active', true)],
    chat: [],
  },
  {
    id: 'sq_b', clubId: 'c_grinders', clubName: 'The Grinders', clubEmoji: '♠️',
    title: 'Cowboys @ Niners Squares', homeTeam: 'Niners', awayTeam: 'Cowboys',
    visibility: 'public', status: 'completed', timezone: 'PT', settledAt: '2026-06-09',
    stake: 250, hostId: 'u_gary', coHostIds: [],
    cells: doneCells, rowDigits, colDigits,
    periods: [
      { label: 'Q1', pct: 10, homeScore: 7, awayScore: 3, ...winAt(7, 3) },
      { label: 'Q2', pct: 10, homeScore: 10, awayScore: 10, ...winAt(10, 10) },
      { label: 'Q3', pct: 10, homeScore: 17, awayScore: 13, ...winAt(17, 13) },
      { label: 'Final', pct: 70, homeScore: 24, awayScore: 20, ...winAt(24, 20) },
    ],
    participants: [part('u_gary', 'active', true), part('u_player', 'active', true), part('u_lena', 'active', true), part('u_mike', 'active', true), part('u_tom', 'active', true)],
    chat: [],
  },
  // ---- Demo: Champions Club, Houston ----
  {
    id: 'sq_champ_done', clubId: 'c_champions', clubName: 'Champions Club, Houston', clubEmoji: '🏆',
    title: 'Texans @ Cowboys Squares', homeTeam: 'Texans', awayTeam: 'Cowboys',
    visibility: 'public', status: 'completed', timezone: 'CT', settledAt: '2026-06-08',
    stake: 50, hostId: 'u_cc_host', coHostIds: [],
    cells: champDone, rowDigits, colDigits,
    periods: [
      { label: 'Q1', pct: 10, homeScore: 7, awayScore: 0, ...winIn(champDone, rowDigits, colDigits, 7, 0) },
      { label: 'Q2', pct: 10, homeScore: 14, awayScore: 10, ...winIn(champDone, rowDigits, colDigits, 14, 10) },
      { label: 'Q3', pct: 10, homeScore: 21, awayScore: 13, ...winIn(champDone, rowDigits, colDigits, 21, 13) },
      { label: 'Final', pct: 70, homeScore: 27, awayScore: 24, ...winIn(champDone, rowDigits, colDigits, 27, 24) },
    ],
    participants: [part('u_cc_host', 'active', true), part('u_player', 'active', true), part('u_mike', 'active', true), part('u_lena', 'active', true), part('u_jordan', 'active', true), part('u_cody', 'active', true)],
    chat: [],
  },
  {
    id: 'sq_champ_reg', clubId: 'c_champions', clubName: 'Champions Club, Houston', clubEmoji: '🏆',
    title: 'Sunday Squares — Texans @ Colts', homeTeam: 'Texans', awayTeam: 'Colts',
    visibility: 'public', status: 'registration', timezone: 'CT',
    stake: 50, hostId: 'u_cc_host', coHostIds: [],
    cells: champReg, rowDigits: [], colDigits: [],
    periods: [{ label: 'Q1', pct: 10 }, { label: 'Q2', pct: 10 }, { label: 'Q3', pct: 10 }, { label: 'Final', pct: 70 }],
    participants: [part('u_cc_host', 'active', true), part('u_mike', 'active', true), part('u_lena', 'active', true), part('u_jordan', 'active', true)],
    chat: [],
  },
  // ---- Demo: Texas Card House, Houston ----
  {
    id: 'sq_tch_done', clubId: 'c_tch', clubName: 'Texas Card House, Houston', clubEmoji: '🃏',
    title: 'Cowboys @ Eagles Squares', homeTeam: 'Eagles', awayTeam: 'Cowboys',
    visibility: 'public', status: 'completed', timezone: 'CT', settledAt: '2026-06-04',
    stake: 100, hostId: 'u_tch_host', coHostIds: [],
    cells: tchDone, rowDigits, colDigits,
    periods: [
      { label: 'Q1', pct: 10, homeScore: 3, awayScore: 7, ...winIn(tchDone, rowDigits, colDigits, 3, 7) },
      { label: 'Q2', pct: 10, homeScore: 10, awayScore: 14, ...winIn(tchDone, rowDigits, colDigits, 10, 14) },
      { label: 'Q3', pct: 10, homeScore: 20, awayScore: 17, ...winIn(tchDone, rowDigits, colDigits, 20, 17) },
      { label: 'Final', pct: 70, homeScore: 31, awayScore: 27, ...winIn(tchDone, rowDigits, colDigits, 31, 27) },
    ],
    participants: [part('u_tch_host', 'active', true), part('u_player', 'active', true), part('u_gary', 'active', true), part('u_cody', 'active', true), part('u_dustin', 'active', true), part('u_mike', 'active', true)],
    chat: [],
  },
  {
    id: 'sq_tch_reg', clubId: 'c_tch', clubName: 'Texas Card House, Houston', clubEmoji: '🃏',
    title: 'Game Day Squares — Cowboys @ Giants', homeTeam: 'Cowboys', awayTeam: 'Giants',
    visibility: 'public', status: 'registration', timezone: 'CT',
    stake: 100, hostId: 'u_tch_host', coHostIds: [],
    cells: tchReg, rowDigits: [], colDigits: [],
    periods: [{ label: 'Q1', pct: 10 }, { label: 'Q2', pct: 10 }, { label: 'Q3', pct: 10 }, { label: 'Final', pct: 70 }],
    participants: [part('u_tch_host', 'active', true), part('u_gary', 'active', true), part('u_cody', 'active', true), part('u_dustin', 'active', true)],
    chat: [],
  },
]
