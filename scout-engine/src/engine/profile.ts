import type { PlayerProfile, PositionalStat, StatKey, StatWithTier } from './types'
import { STAT_DEFS } from './statDefs'
import { computeTier } from './tiers'
import { classifyPlayer } from './typing'
import { buildExploits } from './exploits'
import { buildNarrative } from './narrative'
import { EXTRA_STATS, SAMPLE_HANDS } from './mockSource'
import type { SampleHand } from './mockSource'
import { STATS, PLAYERS } from '@/data'

// =====================================================================
// Profile builder — assembles the structured PlayerProfile by running
// Layers 1→4 in dependency order (spec §0). This is the single object
// the UI renders and the (simulated) narrator consumes.
// =====================================================================

function round(n: number): number { return Math.round(n) }

/** Build every spec stat as a StatWithTier, computing its mock denominator + tier. */
function buildStats(playerId: string): StatWithTier[] {
  const base = STATS[playerId]
  const extra = EXTRA_STATS[playerId]
  const hands = base.totalHands

  // Resolve each stat's raw value from base STATS or the extra set.
  const value: Record<StatKey, number> = {
    vpip: base.vpip,
    pfr: base.pfr,
    gap: base.vpip - base.pfr,
    threeBet: base.threeBet,
    foldTo3Bet: extra.foldTo3Bet,
    fourBet: extra.fourBet,
    coldCall: extra.coldCall,
    steal: base.steal,
    foldToSteal: base.foldToSteal,
    cbetFlop: base.cbetFlop,
    cbetTurn: base.cbetTurn,
    foldToCbetFlop: extra.foldToCbetFlop,
    foldToCbetTurn: extra.foldToCbetTurn,
    checkRaise: base.checkRaiseFlop,
    donk: extra.donk,
    wtsd: base.wtsd,
    wsd: base.wsd,
    wwsf: extra.wwsf,
    af: base.af,
    afq: extra.afq,
    riverBet: extra.riverBet,
  }

  return (Object.keys(STAT_DEFS) as StatKey[]).map((key) => {
    const def = STAT_DEFS[key]
    const opportunities = round(hands * def.oppMultiplier)
    return {
      key,
      label: def.label,
      value: value[key],
      unit: def.unit,
      opportunities,
      category: def.category,
      tier: computeTier(def.category, opportunities),
    }
  })
}

/** Per-seat open% (spec §2.1). Denominators are small → mostly TENTATIVE. */
function buildPositional(playerId: string): PositionalStat[] {
  const base = STATS[playerId]
  const hands = base.totalHands
  const perSeatOpp = round(hands / 6)
  const curve: { position: string; mult: number }[] = [
    { position: 'UTG', mult: 0.45 },
    { position: 'HJ', mult: 0.7 },
    { position: 'CO', mult: 1.05 },
    { position: 'BTN', mult: 1.55 },
    { position: 'SB', mult: 1.2 },
  ]
  return curve.map(({ position, mult }) => ({
    position,
    open: Math.min(95, round(base.pfr * mult)),
    opportunities: perSeatOpp,
    tier: computeTier('preflop', perSeatOpp),
  }))
}

const cache = new Map<string, PlayerProfile>()

export function getProfile(playerId: string): PlayerProfile | null {
  if (cache.has(playerId)) return cache.get(playerId)!
  const player = PLAYERS.find((p) => p.id === playerId)
  if (!player || !STATS[playerId] || !EXTRA_STATS[playerId]) return null

  const stats = buildStats(playerId)
  const positional = buildPositional(playerId)
  const typing = classifyPlayer(stats)
  const exploits = buildExploits(stats)
  const narrative = buildNarrative({ name: player.name, typing, exploits, stats })

  const profile: PlayerProfile = {
    playerId,
    name: player.name,
    totalHands: STATS[playerId].totalHands,
    stats,
    positional,
    typing,
    exploits,
    narrative,
  }
  cache.set(playerId, profile)
  return profile
}

export function getSampleHand(id: string | null): SampleHand | null {
  if (!id) return null
  return SAMPLE_HANDS[id] ?? null
}

export function statByKey(profile: PlayerProfile, key: StatKey): StatWithTier | undefined {
  return profile.stats.find((s) => s.key === key)
}
