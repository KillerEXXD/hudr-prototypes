import type { StatWithTier } from '@/engine'
import { STAT_DEFS, STAT_TYPICAL } from '@/engine'
import { cn } from '@/lib/utils'

// Stat row with the brief's "vs typical" context bar + confidence-as-opacity.
//  - the bar shows the typical population band with a marker at the value
//  - TENTATIVE rows are de-emphasized (opacity + dashed tag); NOISE rows hidden
function fmt(s: StatWithTier): string {
  return s.unit === 'ratio' ? s.value.toFixed(1) : `${s.value}%`
}

const tierMarker = (tier: StatWithTier['tier']) =>
  tier === 'RELIABLE' ? 'bg-tier-reliable' : tier === 'TENTATIVE' ? 'bg-tier-tentative' : 'bg-tier-noise'

function TypicalBar({ stat }: { stat: StatWithTier }) {
  const [low, high] = STAT_TYPICAL[stat.key]
  const max = stat.unit === 'ratio' ? 6 : 100
  const p = (n: number) => Math.max(0, Math.min(100, (n / max) * 100))
  return (
    <div className="relative mt-1.5 h-2 rounded-full bg-bg-surface" title={`Typical ${low}–${high}${stat.unit === '%' ? '%' : ''}`}>
      <div className="absolute inset-y-0 rounded-full bg-text-muted/25" style={{ left: `${p(low)}%`, width: `${Math.max(2, p(high) - p(low))}%` }} />
      <div
        className={cn('absolute top-1/2 h-3.5 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-bg-card', tierMarker(stat.tier))}
        style={{ left: `${p(stat.value)}%` }}
      />
    </div>
  )
}

export function StatRow({ stat, plain }: { stat: StatWithTier; plain: boolean }) {
  const def = STAT_DEFS[stat.key]
  if (stat.tier === 'NOISE') return null // hidden — not enough data to trust
  const tentative = stat.tier === 'TENTATIVE'
  const [low, high] = STAT_TYPICAL[stat.key]
  return (
    <div
      className={cn('py-2', tentative && 'opacity-60')}
      title={plain ? def.plain : `${def.definition} — ${def.tells} · typical ${low}–${high}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-text-secondary">{plain ? def.plainName : def.label}</span>
        <span className="flex items-center gap-2">
          {tentative && (
            <span className="rounded-full border border-dashed border-tier-tentative/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-tier-tentative">small sample</span>
          )}
          <span className="nums text-sm font-semibold text-text-primary">{fmt(stat)}</span>
        </span>
      </div>
      <TypicalBar stat={stat} />
      {plain && <p className="mt-1 text-xs leading-snug text-text-muted">{def.plain}</p>}
      {!plain && <p className="mt-1 text-[10px] text-text-muted">typical <span className="nums">{low}–{high}{stat.unit === '%' ? '%' : ''}</span> · n=<span className="nums">{stat.opportunities}</span></p>}
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
