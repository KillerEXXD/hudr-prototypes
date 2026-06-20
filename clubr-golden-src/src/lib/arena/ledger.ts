// =====================================================================
// Arena — Relationship Ledger (DERIVED; computed from settled results).
//
// The retention engine. A poker player's real question is never "what are my
// abstract stakes" — it's "am I up or down with THIS crew, over time." No store
// holds head-to-head money (ClubR holds nothing), so we DERIVE a transparent,
// dollar-blind tally from settled games: per club, how many you played, how
// often you cashed, your net Stakes swing (wins of the pot vs. buy-ins paid).
//
// This is a scorekeeper's ledger, not a wallet — it mirrors what the players
// themselves would tally on paper after a session. Values are Stakes, never $.
// =====================================================================
import type { FTContestView } from '@/types/ft'
import type { LLGameView } from '@/types/ll'
import type { SquaresGameView } from '@/types/squares'

export interface LedgerLine {
  clubId: string
  clubName: string
  clubEmoji: string
  played: number       // settled games you took part in, for this club
  cashes: number       // games where you finished in a paid spot (rank 1, or a win)
  wins: number         // outright wins (1st / a winning square)
  /** Net Stakes swing: (Stakes won) − (Stakes staked). Dollar-blind. */
  net: number
  /** Last few settled outcomes, newest first, for a sparkline-style strip. */
  recent: { won: boolean; net: number; when?: string }[]
}

export interface LedgerTotals {
  played: number
  cashes: number
  wins: number
  net: number
  cashRate: number // 0..1
}

interface Outcome {
  clubId: string; clubName: string; clubEmoji: string
  staked: number; won: number; cashed: boolean; isWin: boolean; when?: string
}

// ---- Per-type outcome extraction (settled games only, for the given user) ----

function ftOutcomes(contests: FTContestView[], _userId: string): Outcome[] {
  return contests
    .filter((c) => c.status === 'settled' && c.myEntry)
    .map((c) => {
      const me = c.myEntry!
      const field = c.entries.length || 1
      const payouts = c.payouts ?? [100]
      const paidSpots = payouts.length
      const cashed = (me.rank ?? 99) <= paidSpots
      const isWin = me.rank === 1
      // Pot = sum of buy-ins; your cut = your payout share of the pot.
      const pot = c.stake * field
      const share = cashed ? (payouts[(me.rank ?? 1) - 1] ?? 0) / 100 : 0
      const won = Math.round(pot * share)
      return { clubId: c.clubId, clubName: c.clubName, clubEmoji: c.clubEmoji, staked: c.stake, won, cashed, isWin, when: c.settledAt }
    })
}

function llOutcomes(games: LLGameView[], _userId: string): Outcome[] {
  return games
    .filter((g) => g.status === 'completed' && g.me)
    .map((g) => {
      const me = g.me!
      const field = g.participants.length || 1
      const payouts = g.payouts ?? [100]
      const paidSpots = payouts.length
      const pos = me.finishPos ?? 99
      const cashed = pos <= paidSpots
      const isWin = pos === 1
      const pot = g.stake * field
      const share = cashed ? (payouts[pos - 1] ?? 0) / 100 : 0
      const won = Math.round(pot * share)
      return { clubId: g.clubId, clubName: g.clubName, clubEmoji: g.clubEmoji, staked: g.stake, won, cashed, isWin, when: g.settledAt }
    })
}

function squaresOutcomes(games: SquaresGameView[], userId: string): Outcome[] {
  return games
    .filter((g) => g.status === 'completed' && g.me)
    .map((g) => {
      const myWinPeriods = g.periods.filter((p) => p.winnerUserId === userId)
      const cashed = myWinPeriods.length > 0
      const isWin = cashed
      // Pot ≈ claimed squares × stake; your cut = sum of the periods you won.
      const pot = g.claimedCount * g.stake
      const wonShare = myWinPeriods.reduce((s, p) => s + p.pct / 100, 0)
      const won = Math.round(pot * wonShare)
      // What you staked ≈ your claimed squares × stake.
      const myCells = g.cells.filter((c) => c.userId === userId).length
      const staked = myCells * g.stake
      return { clubId: g.clubId, clubName: g.clubName, clubEmoji: g.clubEmoji, staked, won, cashed, isWin, when: g.settledAt }
    })
}

/** Build the per-club ledger from all three game sources. */
export function buildLedger(
  contests: FTContestView[],
  llGames: LLGameView[],
  sqGames: SquaresGameView[],
  userId: string,
): { lines: LedgerLine[]; totals: LedgerTotals } {
  const all = [
    ...ftOutcomes(contests, userId),
    ...llOutcomes(llGames, userId),
    ...squaresOutcomes(sqGames, userId),
  ]
  const byClub = new Map<string, LedgerLine>()
  for (const o of all) {
    let line = byClub.get(o.clubId)
    if (!line) {
      line = { clubId: o.clubId, clubName: o.clubName, clubEmoji: o.clubEmoji, played: 0, cashes: 0, wins: 0, net: 0, recent: [] }
      byClub.set(o.clubId, line)
    }
    line.played += 1
    if (o.cashed) line.cashes += 1
    if (o.isWin) line.wins += 1
    const net = o.won - o.staked
    line.net += net
    line.recent.push({ won: o.isWin, net, when: o.when })
  }
  const lines = [...byClub.values()].map((l) => ({
    ...l,
    recent: l.recent.sort((a, b) => (b.when ?? '').localeCompare(a.when ?? '')).slice(0, 6),
  })).sort((a, b) => b.played - a.played)

  const totals: LedgerTotals = lines.reduce(
    (t, l) => ({
      played: t.played + l.played,
      cashes: t.cashes + l.cashes,
      wins: t.wins + l.wins,
      net: t.net + l.net,
      cashRate: 0,
    }),
    { played: 0, cashes: 0, wins: 0, net: 0, cashRate: 0 },
  )
  totals.cashRate = totals.played ? totals.cashes / totals.played : 0
  return { lines, totals }
}
