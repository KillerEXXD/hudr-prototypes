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
for (let i = 0; i < 100; i++) claim(champDone, i, ['u_player', 'u_cc_p1', 'u_cc_p3', 'u_cc_p6', 'u_cc_p2'][i % 5])
const tchDone = emptyGrid()
for (let i = 0; i < 100; i++) claim(tchDone, i, ['u_player', 'u_tch_p1', 'u_tch_p3', 'u_tch_p4', 'u_tch_p2'][i % 5])
// ---- registration boards (partial claims → joinable) ----
const champReg = emptyGrid()
;([[2, 'u_cc_p2'], [14, 'u_cc_p5'], [27, 'u_cc_p7'], [38, 'u_cc_p3'], [45, 'u_cc_host'], [56, 'u_cc_p2'], [63, 'u_cc_p5'], [71, 'u_cc_p7'], [88, 'u_cc_host']] as [number, string][]).forEach(([i, id]) => claim(champReg, i, id))
const tchReg = emptyGrid()
;([[1, 'u_tch_p2'], [9, 'u_tch_p3'], [22, 'u_tch_p6'], [33, 'u_tch_p2'], [44, 'u_tch_host'], [55, 'u_tch_p3'], [67, 'u_tch_p6'], [79, 'u_tch_p2'], [90, 'u_tch_host']] as [number, string][]).forEach(([i, id]) => claim(tchReg, i, id))

// ---- Rollover demo (Aces High): identity digits so a (home,away) score maps to a
//      single, predictable cell — lets us leave specific winning cells EMPTY to make
//      a quarter "unwon". Three boards: a consumed source, the game it fed (shows the
//      "Rolled in from" provenance + a bumped champion), and a still-pending pool. ----
const idDigits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
const cellAt = (home: number, away: number) => (home % 10) * 10 + (away % 10)
const winnerIdOf = (cells: SquaresCell[], home: number, away: number) => ({ winnerCell: cellAt(home, away), winnerUserId: cells[cellAt(home, away)].userId })

// SOURCE — partial board; Q3 + Final winning cells left empty → both unwon. Under
// Rollover the Q3 base rolls onto Q4, then the unwon Q4 carries to the next game.
const rollSrcCells = emptyGrid()
{
  const skip = new Set([cellAt(21, 10), cellAt(27, 24)]) // Q3 → cell 10, Final → cell 74 stay empty
  const fillers = ['u_player', 'u_mike', 'u_tom', 'u_jordan']
  let placed = 0
  for (let i = 0; i < 100 && placed < 40; i++) { if (skip.has(i)) continue; claim(rollSrcCells, i, fillers[placed % fillers.length]); placed++ }
  claim(rollSrcCells, cellAt(7, 3), 'u_player')  // Q1 winner
  claim(rollSrcCells, cellAt(14, 7), 'u_mike')   // Q2 winner
}
// DEST — full board, every quarter won; Final won by u_player who also collects the
// 1,600 carried in from the source's unwon Q4.
const rollDestCells = emptyGrid()
for (let i = 0; i < 100; i++) claim(rollDestCells, i, ['u_player', 'u_mike', 'u_tom', 'u_jordan', 'u_host'][i % 5])
claim(rollDestCells, cellAt(28, 21), 'u_player') // ensure u_player owns the Final cell
// PENDING — partial board, Final cell empty → unwon Q4 still carries to a future game
// (shows in the create-board carry-in picker; not yet consumed).
const rollPendCells = emptyGrid()
{
  const skip = new Set([cellAt(24, 21)]) // Final → cell 41 stays empty
  const fillers = ['u_player', 'u_tom', 'u_jordan']
  let placed = 0
  for (let i = 0; i < 100 && placed < 30; i++) { if (skip.has(i)) continue; claim(rollPendCells, i, fillers[placed % fillers.length]); placed++ }
  claim(rollPendCells, cellAt(3, 0), 'u_player')  // Q1 winner
  claim(rollPendCells, cellAt(10, 7), 'u_tom')    // Q2 winner
  claim(rollPendCells, cellAt(17, 14), 'u_jordan') // Q3 winner
}

export const SQUARES_GAMES: SquaresGame[] = [
  // ---- Rollover demo (Aces High) ----
  {
    id: 'sq_roll_src', clubId: 'c_aces', clubName: 'Aces High', clubEmoji: '🂡',
    title: 'Playoffs Squares — Chiefs @ Bills', homeTeam: 'Chiefs', awayTeam: 'Bills',
    visibility: 'public', status: 'completed', timezone: 'CT', settledAt: '2026-06-12',
    stake: 50, hostId: 'u_host', coHostIds: [], noWinnerRule: 'rollover', rolledOverToGameId: 'sq_roll_dest',
    cells: rollSrcCells, rowDigits: idDigits, colDigits: idDigits,
    periods: [
      { label: 'Q1', pct: 10, homeScore: 7, awayScore: 3, ...winnerIdOf(rollSrcCells, 7, 3) },
      { label: 'Q2', pct: 10, homeScore: 14, awayScore: 7, ...winnerIdOf(rollSrcCells, 14, 7) },
      { label: 'Q3', pct: 10, homeScore: 21, awayScore: 10, ...winnerIdOf(rollSrcCells, 21, 10) },
      { label: 'Final', pct: 70, homeScore: 27, awayScore: 24, ...winnerIdOf(rollSrcCells, 27, 24) },
    ],
    participants: [part('u_host', 'active', true), part('u_player', 'active', true), part('u_mike', 'active', true), part('u_tom', 'active', true), part('u_jordan', 'active', true)],
    chat: [],
  },
  {
    id: 'sq_roll_dest', clubId: 'c_aces', clubName: 'Aces High', clubEmoji: '🂡',
    title: 'Title Game Squares — Chiefs @ Ravens', homeTeam: 'Chiefs', awayTeam: 'Ravens',
    visibility: 'public', status: 'completed', timezone: 'CT', settledAt: '2026-06-19',
    stake: 50, hostId: 'u_host', coHostIds: [], noWinnerRule: 'rollover',
    rolledOverFrom: [{ gameId: 'sq_roll_src', title: 'Playoffs Squares — Chiefs @ Bills', amount: 1680 }],
    cells: rollDestCells, rowDigits: idDigits, colDigits: idDigits,
    periods: [
      { label: 'Q1', pct: 10, homeScore: 7, awayScore: 0, ...winnerIdOf(rollDestCells, 7, 0) },
      { label: 'Q2', pct: 10, homeScore: 14, awayScore: 10, ...winnerIdOf(rollDestCells, 14, 10) },
      { label: 'Q3', pct: 10, homeScore: 21, awayScore: 17, ...winnerIdOf(rollDestCells, 21, 17) },
      { label: 'Final', pct: 70, homeScore: 28, awayScore: 21, ...winnerIdOf(rollDestCells, 28, 21) },
    ],
    participants: [part('u_host', 'active', true), part('u_player', 'active', true), part('u_mike', 'active', true), part('u_tom', 'active', true), part('u_jordan', 'active', true)],
    chat: [],
  },
  {
    id: 'sq_roll_pending', clubId: 'c_aces', clubName: 'Aces High', clubEmoji: '🂡',
    title: 'Divisional Squares — Lions @ Niners', homeTeam: 'Lions', awayTeam: 'Niners',
    visibility: 'public', status: 'completed', timezone: 'CT', settledAt: '2026-06-21',
    stake: 100, hostId: 'u_host', coHostIds: [], noWinnerRule: 'rollover',
    cells: rollPendCells, rowDigits: idDigits, colDigits: idDigits,
    periods: [
      { label: 'Q1', pct: 10, homeScore: 3, awayScore: 0, ...winnerIdOf(rollPendCells, 3, 0) },
      { label: 'Q2', pct: 10, homeScore: 10, awayScore: 7, ...winnerIdOf(rollPendCells, 10, 7) },
      { label: 'Q3', pct: 10, homeScore: 17, awayScore: 14, ...winnerIdOf(rollPendCells, 17, 14) },
      { label: 'Final', pct: 70, homeScore: 24, awayScore: 21, ...winnerIdOf(rollPendCells, 24, 21) },
    ],
    participants: [part('u_host', 'active', true), part('u_player', 'active', true), part('u_tom', 'active', true), part('u_jordan', 'active', true)],
    chat: [],
  },
  {
    id: 'sq_c', clubId: 'c_aces', clubName: 'Aces High', clubEmoji: '🂡',
    title: 'Sunday Night Squares', homeTeam: 'Ravens', awayTeam: 'Bills',
    visibility: 'public', status: 'registration', registrationClosesAt: 'in 1h 20m', timezone: 'CT',
    stake: 50, hostId: 'u_host', coHostIds: [],
    cells: apprCells, rowDigits: [], colDigits: [],
    periods: [{ label: 'Q1', pct: 10 }, { label: 'Q2', pct: 10 }, { label: 'Q3', pct: 10 }, { label: 'Final', pct: 70 }],
    participants: [part('u_host', 'active', true), part('u_player', 'active', false), part('u_mike', 'active', true), part('u_tom', 'active', false), part('u_jordan', 'active', true)],
    chat: [],
  },
  {
    id: 'sq_a', clubId: 'c_aces', clubName: 'Aces High', clubEmoji: '🂡',
    title: 'Sunday Squares', homeTeam: 'Chiefs', awayTeam: 'Eagles',
    visibility: 'public', status: 'registration', registrationClosesAt: 'in 2h 40m', timezone: 'CT',
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
  // ---- Demo: Bayou City Poker Club ----
  {
    id: 'sq_champ_done', clubId: 'c_champions', clubName: 'Bayou City Poker Club', clubEmoji: '🏆',
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
    participants: [part('u_cc_host', 'active', true), part('u_player', 'active', true), part('u_cc_p1', 'active', true), part('u_cc_p3', 'active', true), part('u_cc_p6', 'active', true), part('u_cc_p2', 'active', true)],
    chat: [],
  },
  {
    id: 'sq_champ_reg', clubId: 'c_champions', clubName: 'Bayou City Poker Club', clubEmoji: '🏆',
    title: 'Sunday Squares — Texans @ Colts', homeTeam: 'Texans', awayTeam: 'Colts',
    visibility: 'public', status: 'registration', registrationClosesAt: 'in 35m', timezone: 'CT',
    stake: 50, hostId: 'u_cc_host', coHostIds: [],
    cells: champReg, rowDigits: [], colDigits: [],
    periods: [{ label: 'Q1', pct: 10 }, { label: 'Q2', pct: 10 }, { label: 'Q3', pct: 10 }, { label: 'Final', pct: 70 }],
    participants: [part('u_cc_host', 'active', true), part('u_cc_p2', 'active', true), part('u_cc_p5', 'active', true), part('u_cc_p7', 'active', true)],
    chat: [],
  },
  // ---- Demo: Gulf Coast Card Club ----
  {
    id: 'sq_tch_done', clubId: 'c_tch', clubName: 'Gulf Coast Card Club', clubEmoji: '🃏',
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
    participants: [part('u_tch_host', 'active', true), part('u_player', 'active', true), part('u_tch_p1', 'active', true), part('u_tch_p3', 'active', true), part('u_tch_p4', 'active', true), part('u_tch_p2', 'active', true)],
    chat: [],
  },
  {
    id: 'sq_tch_reg', clubId: 'c_tch', clubName: 'Gulf Coast Card Club', clubEmoji: '🃏',
    title: 'Game Day Squares — Cowboys @ Giants', homeTeam: 'Cowboys', awayTeam: 'Giants',
    visibility: 'public', status: 'registration', registrationClosesAt: 'in 4h 10m', timezone: 'CT',
    stake: 100, hostId: 'u_tch_host', coHostIds: [],
    cells: tchReg, rowDigits: [], colDigits: [],
    periods: [{ label: 'Q1', pct: 10 }, { label: 'Q2', pct: 10 }, { label: 'Q3', pct: 10 }, { label: 'Final', pct: 70 }],
    participants: [part('u_tch_host', 'active', true), part('u_tch_p2', 'active', true), part('u_tch_p3', 'active', true), part('u_tch_p6', 'active', true)],
    chat: [],
  },
]
