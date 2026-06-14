import type { PositionalStat } from '@/engine'
import TierBadge from '@/components/common/TierBadge'
import { cn } from '@/lib/utils'

// Open% by seat — spec's "single highest-value positional read".
export default function PositionalOpens({ data, plain }: { data: PositionalStat[]; plain: boolean }) {
  const max = Math.max(40, ...data.map((d) => d.open))
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.position} className="flex items-center gap-3" title={`${d.opportunities} opportunities in ${d.position}`}>
          <span className="w-9 shrink-0 text-xs font-semibold text-text-secondary">{d.position}</span>
          <div className="relative h-5 flex-1 overflow-hidden rounded bg-bg-surface">
            <div
              className={cn('flex h-full items-center justify-end rounded pr-1.5', d.tier === 'NOISE' ? 'bg-tier-noise/40' : d.tier === 'TENTATIVE' ? 'bg-accent-amber/60' : 'bg-accent-blue')}
              style={{ width: `${Math.max(8, (d.open / max) * 100)}%` }}
            >
              <span className="nums text-[10px] font-bold text-white">{d.open}%</span>
            </div>
          </div>
          {!plain && <TierBadge tier={d.tier} plain />}
        </div>
      ))}
      <p className="pt-1 text-xs text-text-muted">
        {plain
          ? 'How often they make the first raise from each seat. They open far more from late seats (BTN) than early ones (UTG).'
          : 'Open-raise % per seat. Per-seat denominators are small, so most positional reads stay TENTATIVE until many hands accumulate.'}
      </p>
    </div>
  )
}
