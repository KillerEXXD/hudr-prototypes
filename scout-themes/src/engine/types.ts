// =====================================================================
// Engine Types — the data contracts shared across all 4 layers.
// Mirrors the "Poker Player Analysis Engine" build spec.
// =====================================================================

/** Sample-size reliability tier (spec §2.4). */
export type Tier = 'RELIABLE' | 'TENTATIVE' | 'NOISE'

/** Threshold family: preflop denominators are larger than postflop. */
export type StatCategory = 'preflop' | 'postflop'

/** Canonical stat identifiers (spec §2.1–2.3). */
export type StatKey =
  | 'vpip' | 'pfr' | 'gap' | 'threeBet' | 'foldTo3Bet' | 'fourBet'
  | 'coldCall' | 'steal' | 'foldToSteal'
  | 'cbetFlop' | 'cbetTurn' | 'foldToCbetFlop' | 'foldToCbetTurn'
  | 'checkRaise' | 'donk' | 'wtsd' | 'wsd' | 'wwsf'
  | 'af' | 'afq' | 'riverBet'

/** Player archetype (spec §3). UNCLASSIFIED when no boundary matches cleanly. */
export type Archetype =
  | 'TAG' | 'LAG' | 'Nit' | 'Calling Station' | 'Maniac' | 'Passive Fish'
  | 'UNCLASSIFIED'

/** A single computed stat carrying its reliability tier. */
export interface StatWithTier {
  key: StatKey
  label: string
  value: number
  unit: '%' | 'ratio'
  opportunities: number
  category: StatCategory
  tier: Tier
}

/** Per-seat open% (spec §2.1 "Open by Position"). */
export interface PositionalStat {
  position: string
  open: number
  opportunities: number
  tier: Tier
}

/** Output of Layer 2 (typing). */
export interface TypingResult {
  archetype: Archetype
  /** fraction of typing inputs that are RELIABLE tier (0..1). */
  confidence: number
  matchedBoundary: string | null
  inputsUsed: { key: StatKey; value: number; tier: Tier }[]
}

/** Output of Layer 3 (one fired exploit). */
export interface Exploit {
  leakId: string
  title: string
  triggerStat: StatKey
  triggerValue: number
  tier: Tier
  /** stat-literate counter-strategy (Pro mode). */
  counterText: string
  /** plain-English counter-move (Normal mode). */
  plainCounter: string
  confirmationStat: string
  /** 0..100 — how exploitable; ranks which leaks lead the report. */
  severity: number
  sampleHandId: string | null
}

/** Output of Layer 4 (narrative) — pre-rendered both ways. */
export interface Narrative {
  nickname: string
  /** plain one-liner under the nickname. */
  summary: string
  /** archetype in plain words + confidence caveat (Normal mode). */
  typePlain: string
  /** stat-cited type summary (Pro mode). */
  proSummary: string
  gamePlanPlain: string[]
  gamePlanPro: string[]
}

/** The structured profile JSON — the ONLY thing the narrative layer consumes. */
export interface PlayerProfile {
  playerId: string
  name: string
  totalHands: number
  stats: StatWithTier[]
  positional: PositionalStat[]
  typing: TypingResult
  exploits: Exploit[]
  /** 0–100 — how beatable this player is (aggregated exploit severities). */
  exploitability: number
  /** how strong they are overall. */
  skill: SkillRating
  narrative: Narrative
}

// ---- Analysis-scope filter dimensions ----
export type Scope = 'event' | 'career'
export type TableSizeBucket = 'all' | 'short' | 'full'   // short = ≤4 players, full = ≥5
export type DepthBucket = 'all' | 'short' | 'mid' | 'deep' // <15bb / 15–40bb / 40+bb

export interface StatFilters {
  scope: Scope
  tournamentId: string | null
  tableSize: TableSizeBucket
  depth: DepthBucket
}

export interface SkillRating {
  score: number   // 0–100
  grade: string   // 'A+' … 'F', or '—' when insufficient data
}

/** Raw per-player stat values fed into the engine (Layer 1 input, domain shape). */
export interface RawPlayerStatValues {
  totalHands: number
  vpip: number
  pfr: number
  threeBet: number
  foldTo3Bet: number
  fourBet: number
  coldCall: number
  steal: number
  foldToSteal: number
  cbetFlop: number
  cbetTurn: number
  foldToCbetFlop: number
  foldToCbetTurn: number
  checkRaise: number
  donk: number
  wtsd: number
  wsd: number
  wwsf: number
  af: number
  afq: number
  riverBet: number
}
