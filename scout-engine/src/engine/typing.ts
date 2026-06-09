import type { Archetype, StatKey, StatWithTier, TypingResult } from './types'

// =====================================================================
// Layer 2 — Player Typing (spec §3).
// Maps RELIABLE stats to an archetype via EXPLICIT boundary conditions,
// never vibes. NOISE-tier stats are ignored. If no archetype matches
// cleanly, output UNCLASSIFIED rather than forcing a label.
// Boundaries are config so they can be tuned per tournament stage.
// =====================================================================

export interface Boundary {
  archetype: Exclude<Archetype, 'UNCLASSIFIED'>
  /** human-readable boundary, shown in the Pro "why this label" trace. */
  text: string
  /** all conditions must hold; a condition reading a NOISE stat fails. */
  test: (s: Record<StatKey, { value: number } | undefined>) => boolean
  coreRead: string
}

/** The stats that define an archetype — confidence is the RELIABLE fraction of these. */
export const TYPING_INPUTS: StatKey[] = ['vpip', 'pfr', 'gap', 'afq', 'threeBet']

const v = (s: Record<StatKey, { value: number } | undefined>, k: StatKey) => s[k]?.value

export const ARCHETYPE_BOUNDARIES: Boundary[] = [
  {
    archetype: 'Maniac',
    text: 'VPIP ≥ 40, PFR ≥ 32, AFq ≥ 60%',
    coreRead: 'Hyper-aggressive. Widen your calling/trapping ranges and let them hang themselves.',
    test: (s) => (v(s, 'vpip') ?? -1) >= 40 && (v(s, 'pfr') ?? -1) >= 32 && (v(s, 'afq') ?? -1) >= 60,
  },
  {
    archetype: 'Calling Station',
    text: 'VPIP ≥ 28, AF < 1.2, Fold-to-C-Bet < 40%, low W$SD',
    coreRead: 'Never bluff. Value bet thin and relentlessly; size up.',
    test: (s) => (v(s, 'vpip') ?? -1) >= 28 && (v(s, 'af') ?? 99) < 1.2 && (v(s, 'foldToCbetFlop') ?? 99) < 40,
  },
  {
    archetype: 'LAG',
    text: 'VPIP 27–40, PFR 22–34, gap ≤ 8, 3-Bet ≥ 8%',
    coreRead: 'Pressure player. Trap with strong hands and let them barrel into you.',
    test: (s) => {
      const vp = v(s, 'vpip'), pf = v(s, 'pfr'), g = v(s, 'gap'), tb = v(s, 'threeBet')
      return vp != null && pf != null && g != null && tb != null &&
        vp >= 27 && vp <= 40 && pf >= 22 && pf <= 34 && g <= 8 && tb >= 8
    },
  },
  {
    archetype: 'TAG',
    text: 'VPIP 18–26, PFR 15–22, gap ≤ 6, AFq ≥ 45%',
    coreRead: 'Solid. Avoid bloating pots without strong hands; attack their c-bet give-ups.',
    test: (s) => {
      const vp = v(s, 'vpip'), pf = v(s, 'pfr'), g = v(s, 'gap'), aq = v(s, 'afq')
      return vp != null && pf != null && g != null && aq != null &&
        vp >= 18 && vp <= 26 && pf >= 15 && pf <= 22 && g <= 6 && aq >= 45
    },
  },
  {
    archetype: 'Passive Fish',
    text: 'VPIP ≥ 30, gap ≥ 10, AF < 1.5',
    coreRead: 'Loose-passive. Iso-raise widely, value bet, rarely bluff.',
    test: (s) => (v(s, 'vpip') ?? -1) >= 30 && (v(s, 'gap') ?? -1) >= 10 && (v(s, 'af') ?? 99) < 1.5,
  },
  {
    archetype: 'Nit',
    text: 'VPIP ≤ 15, PFR ≤ 12, Fold-to-3Bet ≥ 65%',
    coreRead: 'Over-folds. 3-bet light, steal blinds, fold when they show real aggression.',
    test: (s) => (v(s, 'vpip') ?? 99) <= 15 && (v(s, 'pfr') ?? 99) <= 12 && (v(s, 'foldTo3Bet') ?? -1) >= 65,
  },
]

export const ARCHETYPE_CORE_READS: Record<Archetype, string> = {
  TAG: ARCHETYPE_BOUNDARIES.find(b => b.archetype === 'TAG')!.coreRead,
  LAG: ARCHETYPE_BOUNDARIES.find(b => b.archetype === 'LAG')!.coreRead,
  Nit: ARCHETYPE_BOUNDARIES.find(b => b.archetype === 'Nit')!.coreRead,
  'Calling Station': ARCHETYPE_BOUNDARIES.find(b => b.archetype === 'Calling Station')!.coreRead,
  Maniac: ARCHETYPE_BOUNDARIES.find(b => b.archetype === 'Maniac')!.coreRead,
  'Passive Fish': ARCHETYPE_BOUNDARIES.find(b => b.archetype === 'Passive Fish')!.coreRead,
  UNCLASSIFIED: 'No clean archetype match — profile by individual leaks only; do not assign a personality.',
}

export function classifyPlayer(stats: StatWithTier[]): TypingResult {
  // Build a lookup that EXCLUDES noise-tier stats (spec: downstream ignores NOISE).
  const reliableEnough = (t: StatWithTier) => t.tier !== 'NOISE'
  const lookup: Record<StatKey, { value: number } | undefined> = {} as never
  for (const s of stats) lookup[s.key] = reliableEnough(s) ? { value: s.value } : undefined

  const inputsUsed = TYPING_INPUTS.map((k) => {
    const s = stats.find((x) => x.key === k)
    return { key: k, value: s?.value ?? 0, tier: s?.tier ?? 'NOISE' as const }
  })
  const reliableInputs = inputsUsed.filter((i) => i.tier === 'RELIABLE').length
  const confidence = reliableInputs / TYPING_INPUTS.length

  // Need a minimum of reliable evidence to assign any label at all.
  const enoughEvidence = reliableInputs >= 3

  let matched: Archetype = 'UNCLASSIFIED'
  let matchedBoundary: string | null = null
  if (enoughEvidence) {
    for (const b of ARCHETYPE_BOUNDARIES) {
      if (b.test(lookup)) { matched = b.archetype; matchedBoundary = b.text; break }
    }
  }

  return { archetype: matched, confidence, matchedBoundary, inputsUsed }
}
