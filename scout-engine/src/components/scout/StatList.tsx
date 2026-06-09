import type { StatWithTier } from '@/engine'
import { STAT_DEFS } from '@/engine'
import TierBadge from '@/components/common/TierBadge'
import { cn } from '@/lib/utils'

// A stat row that adapts to mode:
//  - plain: friendly name + plain meaning, value as a labelled bar, NOISE hidden
//  - pro:   pro label + definition tooltip, value + opportunities + tier chip
function fmt(s: StatWithTier): string {
  return s.unit === 'ratio' ? s.value.toFixed(1) : `${s.value}%`
}

function barPct(s: StatWithTier): number {
  if (s.unit === 'ratio') return Math.min(100, (s.value / 5) * 100)
  return Math.min(100, s.value)
}

function valueColor(s: StatWithTier): string {
  const def = STAT_DEFS[s.key]
  if (s.tier === 'NOISE') return 'text-text-muted'
  if (!def.highIsAggressive) return 'text-text-primary'
  if (s.value >= 55) return 'text-accent-emerald'
  if (s.value >= 30) return 'text-accent-amber'
  return 'text-accent-red'
}

export function StatRow({ stat, plain }: { stat: StatWithTier; plain: boolean }) {
  const def = STAT_DEFS[stat.key]
  if (plain && stat.tier === 'NOISE') return null
  return (
    <div className="py-2" title={plain ? def.plain : `${def.definition} — ${def.tells}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-text-secondary">{plain ? def.plainName : def.label}</span>
        <span className="flex items-center gap-2">
          <span className={cn('nums text-sm font-semibold', valueColor(stat))}>{fmt(stat)}</span>
          {!plain && <TierBadge tier={stat.tier} withOpps={stat.opportunities} />}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg-surface">
        <div
          className={cn('h-full rounded-full', stat.tier === 'NOISE' ? 'bg-tier-noise/50' : 'bg-accent-blue')}
          style={{ width: `${Math.max(3, barPct(stat))}%` }}
        />
      </div>
      {plain && <p className="mt-1 text-xs leading-snug text-text-muted">{def.plain}</p>}
    </div>
  )
}

export default function StatList({ stats, plain, className }: { stats: StatWithTier[]; plain: boolean; className?: string }) {
  return (
    <div className={cn('divide-y divide-border/60', className)}>
      {stats.map((s) => <StatRow key={s.key} stat={s} plain={plain} />)}
    </div>
  )
}
