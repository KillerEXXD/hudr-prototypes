import type { Archetype, StatKey, StatWithTier, Strength, TypingResult } from './types'

// =====================================================================
// Strengths — the positive mirror of the exploit matrix. Deterministic,
// RELIABLE-gated, so it respects scope/table-size/depth filters and never
// invents a read. Returns the top ~3 favorable traits.
// =====================================================================

interface StrengthRule {
  id: string
  stat: StatKey
  holds: (v: number) => boolean
  score: (v: number) => number
  title: string
  detail: string
}

const RULES: StrengthRule[] = [
  { id: 'cbet_pressure', stat: 'cbetFlop', holds: (v) => v >= 60 && v <= 80, score: (v) => v, title: 'Strong flop c-bet pressure', detail: 'Applies consistent pressure in single-raised pots.' },
  { id: 'bb_defense', stat: 'foldToSteal', holds: (v) => v >= 40 && v <= 58, score: (v) => 100 - v, title: 'Disciplined blind defense', detail: 'Defends the big blind at a healthy, non-exploitable rate.' },
  { id: 'showdown', stat: 'wsd', holds: (v) => v >= 54, score: (v) => v, title: 'Wins at showdown', detail: 'Picks showdown spots well and converts above average.' },
  { id: 'balanced_af', stat: 'af', holds: (v) => v >= 2 && v <= 3.6, score: () => 70, title: 'Well-balanced aggression', detail: 'Bets and raises in proportion — hard to read or trap.' },
  { id: 'three_bet', stat: 'threeBet', holds: (v) => v >= 8 && v <= 14, score: (v) => v + 50, title: 'Active, controlled 3-betting', detail: 'Re-raises enough to stay balanced without spewing.' },
  { id: 'turn_barrel', stat: 'cbetTurn', holds: (v) => v >= 45 && v <= 65, score: (v) => v, title: 'Credible turn barrels', detail: 'Follows through on the turn at a believable frequency.' },
  { id: 'wwsf', stat: 'wwsf', holds: (v) => v >= 50, score: (v) => v, title: 'Wins pots after the flop', detail: 'Comes out ahead once a flop is seen.' },
]

const ARCHETYPE_FALLBACK: Record<Archetype, string | null> = {
  TAG: 'Solid, disciplined fundamentals',
  LAG: 'Aggressive and hard to play against',
  Nit: 'Extreme discipline in hand selection',
  'Calling Station': null,
  Maniac: null,
  'Passive Fish': null,
  UNCLASSIFIED: null,
}

export function buildStrengths(stats: StatWithTier[], typing: TypingResult): Strength[] {
  const byKey: Record<StatKey, StatWithTier | undefined> = {} as never
  for (const s of stats) byKey[s.key] = s

  const found: { s: Strength; score: number }[] = []
  for (const r of RULES) {
    const st = byKey[r.stat]
    if (!st || st.tier !== 'RELIABLE') continue
    if (!r.holds(st.value)) continue
    found.push({ s: { id: r.id, title: r.title, detail: r.detail }, score: r.score(st.value) })
  }
  found.sort((a, b) => b.score - a.score)
  const out = found.slice(0, 3).map((f) => f.s)

  if (out.length === 0) {
    const d = ARCHETYPE_FALLBACK[typing.archetype]
    if (d) return [{ id: 'archetype', title: d, detail: 'Inferred from their overall style.' }]
  }
  return out
}
