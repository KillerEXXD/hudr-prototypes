import type { Archetype, Exploit, SkillRating, StatKey, StatWithTier, TypingResult } from './types'

// =====================================================================
// Overall scores. Both are pure functions of the (filtered) profile, so
// they recompute for whatever scope/table-size/depth is active.
// =====================================================================

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

/** Exploitability 0–100 — severity-weighted blend of the fired exploits. */
export function exploitabilityScore(exploits: Exploit[]): number {
  if (!exploits.length) return 0
  const w = [1, 0.45, 0.25, 0.15]
  const sum = exploits.slice(0, 4).reduce((acc, e, i) => acc + e.severity * (w[i] ?? 0.1), 0)
  return clamp(Math.round(sum), 0, 100)
}

const ARCH_SKILL: Record<Archetype, number> = {
  TAG: 12, LAG: 7, Nit: -2, 'Calling Station': -14, Maniac: -10, 'Passive Fish': -10, UNCLASSIFIED: 0,
}

/** Skill grade A+…F — how strong they are. '—' when there isn't enough RELIABLE data. */
export function skillRating(stats: StatWithTier[], typing: TypingResult, exploitability: number): SkillRating {
  if (typing.confidence < 0.4) return { score: 0, grade: '—' }
  const get = (k: StatKey) => {
    const s = stats.find((x) => x.key === k)
    return s && s.tier !== 'NOISE' ? s.value : undefined
  }
  let score = 58
  const wsd = get('wsd'); if (wsd != null) score += (wsd - 50) * 0.7
  const af = get('af'); if (af != null) { if (af >= 2 && af <= 3.6) score += 8; else if (af < 1.2 || af > 5) score -= 6 }
  const gap = get('gap'); if (gap != null) score += gap <= 6 ? 5 : gap >= 12 ? -6 : 0
  score += ARCH_SKILL[typing.archetype]
  score -= exploitability * 0.25
  score = clamp(Math.round(score), 0, 100)
  const grade =
    score >= 86 ? 'A+' : score >= 78 ? 'A' : score >= 72 ? 'A-' : score >= 66 ? 'B+' :
    score >= 60 ? 'B' : score >= 52 ? 'C' : score >= 44 ? 'D' : 'F'
  return { score, grade }
}
