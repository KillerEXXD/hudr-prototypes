import type { StatCategory, Tier } from './types'

// =====================================================================
// Layer 1 — Sample-size gating (spec §2.4).
// A stat off too few opportunities is noise that looks like a read.
// Tiers are based on the DENOMINATOR (opportunities), not total hands.
// =====================================================================

export const TIER_THRESHOLDS: Record<StatCategory, { reliable: number; tentative: number }> = {
  preflop: { reliable: 30, tentative: 10 },
  postflop: { reliable: 20, tentative: 8 },
}

export function computeTier(category: StatCategory, opportunities: number): Tier {
  const t = TIER_THRESHOLDS[category]
  if (opportunities >= t.reliable) return 'RELIABLE'
  if (opportunities >= t.tentative) return 'TENTATIVE'
  return 'NOISE'
}

export const TIER_META: Record<Tier, { label: string; short: string; variant: 'success' | 'warning' | 'muted'; note: string }> = {
  RELIABLE: { label: 'Reliable', short: 'OK', variant: 'success', note: 'Enough hands to trust this read.' },
  TENTATIVE: { label: 'Tentative', short: 'Small sample', variant: 'warning', note: 'Early signs only — weight lightly.' },
  NOISE: { label: 'Too few hands', short: 'Noise', variant: 'muted', note: 'Not enough data to show as a read.' },
}
