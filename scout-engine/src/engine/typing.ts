import type { Archetype, StatKey, StatWithTier, TypingResult, TableSizeBucket } from './types'

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

// Short-handed (≤4) boundary set — ranges widen, so norms shift up (spec §3:
// "expose them as config so they can be tuned for tournament stages").
export const SHORT_BOUNDARIES: Boundary[] = [
  {
    archetype: 'Maniac', text: 'short-handed · VPIP ≥ 55, PFR ≥ 45, AFq ≥ 65%',
    coreRead: 'Hyper-aggressive even for short-handed. Let them barrel into your strong hands.',
    test: (s) => (v(s, 'vpip') ?? -1) >= 55 && (v(s, 'pfr') ?? -1) >= 45 && (v(s, 'afq') ?? -1) >= 65,
  },
  {
    archetype: 'Calling Station', text: 'short-handed · VPIP ≥ 45, AF < 1.3, Fold-to-C-Bet < 42%',
    coreRead: 'Never bluff. Value bet thin and relentlessly.',
    test: (s) => (v(s, 'vpip') ?? -1) >= 45 && (v(s, 'af') ?? 99) < 1.3 && (v(s, 'foldToCbetFlop') ?? 99) < 42,
  },
  {
    archetype: 'LAG', text: 'short-handed · VPIP 38–58, PFR 30–48, gap ≤ 10, 3-Bet ≥ 10%',
    coreRead: 'Pressure player. Trap with strong hands and let them barrel.',
    test: (s) => {
      const vp = v(s, 'vpip'), pf = v(s, 'pfr'), g = v(s, 'gap'), tb = v(s, 'threeBet')
      return vp != null && pf != null && g != null && tb != null && vp >= 38 && vp <= 58 && pf >= 30 && pf <= 48 && g <= 10 && tb >= 10
    },
  },
  {
    archetype: 'TAG', text: 'short-handed · VPIP 26–38, PFR 22–34, gap ≤ 8, AFq ≥ 48%',
    coreRead: 'Solid short-handed reg. Attack their c-bet give-ups; avoid bloating pots light.',
    test: (s) => {
      const vp = v(s, 'vpip'), pf = v(s, 'pfr'), g = v(s, 'gap'), aq = v(s, 'afq')
      return vp != null && pf != null && g != null && aq != null && vp >= 26 && vp <= 38 && pf >= 22 && pf <= 34 && g <= 8 && aq >= 48
    },
  },
  {
    archetype: 'Passive Fish', text: 'short-handed · VPIP ≥ 42, gap ≥ 12, AF < 1.6',
    coreRead: 'Loose-passive. Iso widely and value bet.',
    test: (s) => (v(s, 'vpip') ?? -1) >= 42 && (v(s, 'gap') ?? -1) >= 12 && (v(s, 'af') ?? 99) < 1.6,
  },
  {
    archetype: 'Nit', text: 'short-handed · VPIP ≤ 22, PFR ≤ 18, Fold-to-3Bet ≥ 62%',
    coreRead: 'Way too tight for short-handed. Steal relentlessly; fold to real aggression.',
    test: (s) => (v(s, 'vpip') ?? 99) <= 22 && (v(s, 'pfr') ?? 99) <= 18 && (v(s, 'foldTo3Bet') ?? -1) >= 62,
  },
]

/** Pick the boundary set for the active table-size filter. */
export function getBoundaries(tableSize: TableSizeBucket): Boundary[] {
  return tableSize === 'short' ? SHORT_BOUNDARIES : ARCHETYPE_BOUNDARIES
}

export function classifyPlayer(stats: StatWithTier[], boundaries: Boundary[] = ARCHETYPE_BOUNDARIES): TypingResult {
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
  const enoughEvidence = reliableInputs >= 3

  let matched: Archetype = 'UNCLASSIFIED'
  let matchedBoundary: string | null = null
  if (enoughEvidence) {
    for (const b of boundaries) {
      if (b.test(lookup)) { matched = b.archetype; matchedBoundary = b.text; break }
    }
  }

  return { archetype: matched, confidence, matchedBoundary, inputsUsed }
}
