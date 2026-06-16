import type { SquaresGame, SquaresCell, SquaresParticipant } from '@/types/squares'
import { emptyGrid } from '@/types/squares'
import { USERS } from '@/data/store'

const u = USERS
const part = (id: string, status: SquaresParticipant['status'], paid: boolean): SquaresParticipant =>
  ({ userId: id, name: u[id].name, avatarColor: u[id].avatarColor, status, paid })
const claim = (cells: SquaresCell[], idx: number, id: string) => { cells[idx] = { userId: id, name: u[id].name, avatarColor: u[id].avatarColor } }

// ---- registration board: claims open, digits still sealed ----
const regCells = emptyGrid()
;([[0,'u_mike'],[5,'u_tom'],[12,'u_jordan'],[23,'u_mike'],[34,'u_tom'],[41,'u_host'],[47,'u_jordan'],
  [55,'u_mike'],[63,'u_tom'],[71,'u_jordan'],[78,'u_host'],[80,'u_mike'],[88,'u_tom'],[92,'u_jordan'],[99,'u_host']] as [number, string][])
  .forEach(([i, id]) => claim(regCells, i, id))

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

export const SQUARES_GAMES: SquaresGame[] = [
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
    visibility: 'public', status: 'completed', timezone: 'PT',
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
]
