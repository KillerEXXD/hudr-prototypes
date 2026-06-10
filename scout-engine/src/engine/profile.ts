import type { PlayerProfile, PositionalStat, RawPlayerStatValues, StatKey, StatWithTier, TableSizeBucket } from './types'
import { STAT_DEFS } from './statDefs'
import { computeTier } from './tiers'
import { classifyPlayer, getBoundaries } from './typing'
import { buildExploits } from './exploits'
import { buildNarrative } from './narrative'
import { exploitabilityScore, skillRating } from './scores'
import { buildStrengths } from './strengths'
import { buildExploitPlan } from './plan'
import { SAMPLE_HANDS } from './mockSource'
import type { SampleHand } from './mockSource'

// =====================================================================
// Profile builder — a PURE function of raw stat values (no data-source
// coupling). Runs Layers 1→4 in dependency order (spec §0). The service
// layer fetches RawPlayerStatValues (mock or live) and calls this.
// =====================================================================

function round(n: number): number { return Math.round(n) }

/** Build every spec stat as a StatWithTier, computing denominator + tier. */
export function buildStats(raw: RawPlayerStatValues): StatWithTier[] {
  const hands = raw.totalHands
  const value: Record<StatKey, number> = {
    vpip: raw.vpip,
    pfr: raw.pfr,
    gap: raw.vpip - raw.pfr,
    threeBet: raw.threeBet,
    foldTo3Bet: raw.foldTo3Bet,
    fourBet: raw.fourBet,
    coldCall: raw.coldCall,
    steal: raw.steal,
    foldToSteal: raw.foldToSteal,
    cbetFlop: raw.cbetFlop,
    cbetTurn: raw.cbetTurn,
    foldToCbetFlop: raw.foldToCbetFlop,
    foldToCbetTurn: raw.foldToCbetTurn,
    checkRaise: raw.checkRaise,
    donk: raw.donk,
    wtsd: raw.wtsd,
    wsd: raw.wsd,
    wwsf: raw.wwsf,
    af: raw.af,
    afq: raw.afq,
    riverBet: raw.riverBet,
  }
  return (Object.keys(STAT_DEFS) as StatKey[]).map((key) => {
    const def = STAT_DEFS[key]
    const opportunities = round(hands * def.oppMultiplier)
    return {
      key, label: def.label, value: value[key], unit: def.unit,
      opportunities, category: def.category, tier: computeTier(def.category, opportunities),
    }
  })
}

/** Per-seat open% (spec §2.1). Small denominators → mostly TENTATIVE. */
export function buildPositional(raw: RawPlayerStatValues): PositionalStat[] {
  const perSeatOpp = round(raw.totalHands / 6)
  const curve = [
    { position: 'UTG', mult: 0.45 }, { position: 'HJ', mult: 0.7 }, { position: 'CO', mult: 1.05 },
    { position: 'BTN', mult: 1.55 }, { position: 'SB', mult: 1.2 },
  ]
  return curve.map(({ position, mult }) => ({
    position,
    open: Math.min(95, round(raw.pfr * mult)),
    opportunities: perSeatOpp,
    tier: computeTier('preflop', perSeatOpp),
  }))
}

/** Run the full 4-layer pipeline for one player, adapting to the active filters. */
export function buildProfile(
  player: { id: string; name: string },
  raw: RawPlayerStatValues,
  ctx?: { tableSize?: TableSizeBucket },
): PlayerProfile {
  const stats = buildStats(raw)
  const positional = buildPositional(raw)
  // Adaptive typing: short-handed uses a looser boundary set (spec §3).
  const typing = classifyPlayer(stats, getBoundaries(ctx?.tableSize ?? 'all'))
  const exploits = buildExploits(stats)
  const exploitability = exploitabilityScore(exploits)
  const skill = skillRating(stats, typing, exploitability)
  const strengths = buildStrengths(stats, typing)
  const plan = buildExploitPlan(exploits, typing, stats)
  const narrative = buildNarrative({ name: player.name, typing, exploits, stats })
  return { playerId: player.id, name: player.name, totalHands: raw.totalHands, stats, positional, typing, exploits, exploitability, skill, strengths, plan, narrative }
}

export function getSampleHand(id: string | null): SampleHand | null {
  if (!id) return null
  return SAMPLE_HANDS[id] ?? null
}

export function statByKey(profile: PlayerProfile, key: StatKey): StatWithTier | undefined {
  return profile.stats.find((s) => s.key === key)
}
