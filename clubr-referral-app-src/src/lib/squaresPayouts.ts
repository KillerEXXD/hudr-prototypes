import type { SquaresGameView, SquaresPeriod, SquaresParticipant } from '@/types/squares'

// =====================================================================
// Squares payouts — single source of truth for "what each player actually
// won" given the host's `noWinnerRule`. Pure function; no I/O. Consumed by
// both the per-quarter card display AND the per-player results card.
//
// ClubR is the scorekeeper — cash settles between players off-app. This
// function is purely about what to SHOW (and how the rollover/split chain
// flowed); refund + charity records are display-only.
// =====================================================================

export type NoWinnerRule = 'rollover' | 'split' | 'refund' | 'charity'
// Where an unclaimed period's money went. 'nextGame' is the Rollover terminal: an
// unwon Final carries its whole pool to a FUTURE game (host-managed), not to players.
export type UnclaimedTo = NoWinnerRule | 'nextGame'

export interface PerPeriodPayout {
  label: string
  pct: number
  basePrize: number       // pot × pct/100, rounded
  rolloverIn: number      // accumulated unclaimed from earlier unwon periods (rollover rule only)
  actualPrize: number     // basePrize + rolloverIn — what the winner takes
  winner: SquaresParticipant | null
  /** What happened to the prize when this period had no winner. null = period had a winner OR not yet scored. */
  unclaimedTo: UnclaimedTo | null
  /** Dollars that flowed into the unclaimed-handler (basePrize + rolloverIn for rollover; basePrize otherwise). */
  unclaimedAmount: number
}

export interface PerPlayerTotals {
  base: number       // sum of basePrize across periods they won
  rolloverIn: number // rollover bonuses they captured by winning the period it rolled into
  splitIn: number    // share received from split-rule unclaimed periods
  refund: number     // refund-rule pro-rata returns to this player
  total: number      // base + rolloverIn + splitIn + refund
}

export interface SquaresPayouts {
  rule: NoWinnerRule
  charityName: string | null
  perPeriod: PerPeriodPayout[]
  perPlayer: Map<string, PerPlayerTotals>
  /** Total $ marked for charity across all unwon periods (rule='charity' only). */
  charityAmount: number
}

const ORDER = ['Q1', 'Q2', 'Q3', 'Final']
const orderOf = (label: string) => {
  const i = ORDER.indexOf(label)
  return i === -1 ? 999 : i
}

/** Empty zeros for a player we touched for the first time. */
function zeros(): PerPlayerTotals { return { base: 0, rolloverIn: 0, splitIn: 0, refund: 0, total: 0 } }
function ensure(m: Map<string, PerPlayerTotals>, uid: string): PerPlayerTotals {
  let v = m.get(uid)
  if (!v) { v = zeros(); m.set(uid, v) }
  return v
}
function recompTotals(m: Map<string, PerPlayerTotals>) {
  for (const v of m.values()) v.total = v.base + v.rolloverIn + v.splitIn + v.refund
}

/**
 * Compute the per-period and per-player payout breakdown for a Squares game
 * under the host's selected `noWinnerRule`. Pure function.
 *
 * - **rollover** (default): every unwon quarter (Q1/Q2/Q3) → adds straight to the
 *   FINAL's prize (never to the next quarter). The Final pays its base + everything
 *   carried in. Final unwon → the whole pool carries to the NEXT GAME (host-managed);
 *   nobody in this game receives it (`unclaimedTo: 'nextGame'`).
 * - **split**: unclaimed period N → split equally among unique players who
 *   won OTHER periods. No other winners → pro-rata refund (graceful tail).
 * - **refund**: unclaimed period N → pro-rata to all claimed-cell owners by
 *   squares owned.
 * - **charity**: unclaimed period N → recorded in `charityAmount`; no
 *   players receive it.
 */
export function computeSquaresPayouts(g: SquaresGameView): SquaresPayouts {
  const rule: NoWinnerRule = g.noWinnerRule ?? 'rollover'
  const charityName = g.charityName ?? null
  const pot = g.stake * (g.claimedCount ?? 0)
  // Order periods Q1 → Q2 → Q3 → Final so the rollover chain reads natural.
  const ordered = [...g.periods].sort((a, b) => orderOf(a.label) - orderOf(b.label))
  const perPlayer = new Map<string, PerPlayerTotals>()

  // Pass 1: base + rollover. Walk in order. Charity is settled inline; split
  // is deferred to pass 2 because it needs the full list of "other winners".
  // `carryToFinal` accumulates every unwon Q1/Q2/Q3 base and is handed to the Final.
  // It is SEEDED with any cross-game pools rolled into this game at creation (Rollover
  // only) — so a won Final takes them, and an unwon Final carries them onward too.
  const crossGamePool = rule === 'rollover' ? (g.rolledOverFrom ?? []).reduce((s, r) => s + (r.amount ?? 0), 0) : 0
  let carryToFinal = crossGamePool
  let charityAmount = 0
  const perPeriod: PerPeriodPayout[] = ordered.map((p) => {
    const basePrize = Math.round(pot * (p.pct / 100))
    const winner = p.winnerUserId ? g.participants.find((pp) => pp.userId === p.winnerUserId) ?? null : null
    const isFinal = p.label === 'Final'
    // Under Rollover, ONLY the Final receives the carry from unwon earlier quarters.
    const rolloverIn = rule === 'rollover' && isFinal ? carryToFinal : 0
    const actualPrize = winner ? basePrize + rolloverIn : 0

    if (winner) {
      const pp = ensure(perPlayer, winner.userId)
      pp.base += basePrize
      pp.rolloverIn += rolloverIn
      return { label: p.label, pct: p.pct, basePrize, rolloverIn, actualPrize, winner, unclaimedTo: null, unclaimedAmount: 0 }
    }

    // No winner this period → resolve per rule.
    if (rule === 'rollover') {
      if (isFinal) {
        // Final unwon → the WHOLE pool (Final base + everything carried from unwon
        // Q1–Q3) rolls to the NEXT GAME. Nobody in this game receives it.
        return { label: p.label, pct: p.pct, basePrize, rolloverIn, actualPrize: 0, winner: null, unclaimedTo: 'nextGame', unclaimedAmount: basePrize + carryToFinal }
      }
      // Unwon Q1/Q2/Q3 → feed the Final directly (not the next quarter).
      carryToFinal += basePrize
      return { label: p.label, pct: p.pct, basePrize, rolloverIn: 0, actualPrize: 0, winner: null, unclaimedTo: 'rollover', unclaimedAmount: basePrize }
    }
    if (rule === 'charity') {
      charityAmount += basePrize
      return { label: p.label, pct: p.pct, basePrize, rolloverIn: 0, actualPrize: 0, winner: null, unclaimedTo: 'charity', unclaimedAmount: basePrize }
    }
    // 'split' and 'refund' resolved in pass 2 — record the dollars now.
    return { label: p.label, pct: p.pct, basePrize, rolloverIn: 0, actualPrize: 0, winner: null, unclaimedTo: rule, unclaimedAmount: basePrize }
  })

  // Pass 2: settle the rule-dependent leftovers.
  //  - rollover needs NO pass-2 work now: unwon Q1–Q3 already fed the Final in
  //    pass 1, and an unwon Final is terminal ('nextGame' — carries to a future game).

  //  - split: for EACH unwon period, divide its basePrize among the unique
  //    winners of OTHER periods. If no other winners, pro-rata refund.
  if (rule === 'split') {
    const winners = uniqueWinnerIds(ordered)
    for (const row of perPeriod) {
      if (row.winner || row.unclaimedAmount === 0) continue
      if (winners.size > 0) {
        const share = Math.floor(row.unclaimedAmount / winners.size)
        for (const uid of winners) ensure(perPlayer, uid).splitIn += share
      } else {
        addProRataRefund(perPlayer, g, row.unclaimedAmount)
        row.unclaimedTo = 'refund'
      }
    }
  }

  //  - refund: pro-rata across claimed cells, one period at a time so
  //    the per-period unclaimedAmount stays informative.
  if (rule === 'refund') {
    for (const row of perPeriod) {
      if (row.winner || row.unclaimedAmount === 0) continue
      addProRataRefund(perPlayer, g, row.unclaimedAmount)
    }
  }

  recompTotals(perPlayer)
  return { rule, charityName, perPeriod, perPlayer, charityAmount }
}

/** Set of userIds who won at least one period (in the given order). */
function uniqueWinnerIds(ordered: SquaresPeriod[]): Set<string> {
  const s = new Set<string>()
  for (const p of ordered) if (p.winnerUserId) s.add(p.winnerUserId)
  return s
}

/** Add `amount` to `perPlayer[userId].refund` weighted by squares owned. */
function addProRataRefund(perPlayer: Map<string, PerPlayerTotals>, g: SquaresGameView, amount: number) {
  const byOwner = new Map<string, number>() // userId → squares owned
  for (const c of g.cells) if (c.userId) byOwner.set(c.userId, (byOwner.get(c.userId) ?? 0) + 1)
  const totalClaimed = [...byOwner.values()].reduce((a, b) => a + b, 0)
  if (totalClaimed === 0) return // pathological; nothing to refund to
  for (const [uid, n] of byOwner) {
    const share = Math.round(amount * (n / totalClaimed))
    ensure(perPlayer, uid).refund += share
  }
}
