// Barrel for the 4-layer analysis engine.
export type {
  Tier, StatCategory, StatKey, Archetype,
  StatWithTier, PositionalStat, TypingResult, Exploit, Narrative, PlayerProfile,
  RawPlayerStatValues, Scope, TableSizeBucket, DepthBucket, StatFilters, SkillRating,
  Strength, PlanItem, ExploitPlan,
} from './types'
export { STAT_DEFS, STAT_ORDER, STAT_TYPICAL } from './statDefs'
export type { StatDef } from './statDefs'
export { TIER_THRESHOLDS, TIER_META, computeTier } from './tiers'
export { ARCHETYPE_BOUNDARIES, SHORT_BOUNDARIES, ARCHETYPE_CORE_READS, TYPING_INPUTS, classifyPlayer, getBoundaries } from './typing'
export { EXPLOIT_RULES, buildExploits } from './exploits'
export { exploitabilityScore, skillRating } from './scores'
export { buildStrengths } from './strengths'
export { buildExploitPlan } from './plan'
export { buildNarrative } from './narrative'
export { buildProfile, buildStats, buildPositional, getSampleHand, statByKey } from './profile'
export { buildSharpExtras } from './sharpExtras'
export type { SharpExtras, SizingRead, PositionRange, ShowdownBand, ShowdownRead } from './sharpExtras'
export { EXTRA_STATS, SAMPLE_HANDS } from './mockSource'
export type { SampleHand } from './mockSource'
