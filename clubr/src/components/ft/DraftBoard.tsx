import { cn } from '@/lib/utils/cn'
import { Tag } from 'lucide-react'
import { type FTPlayer } from '@/types/ft'
import { playerFull } from '@/lib/utils/ftFormat'

const fmtK = (n: number) => `${Math.round(n / 1000)}k`

// The 9-player ICM-priced draft board. Pick up to `max` within budget.
export function DraftBoard({ players, budget, value, onChange, max = 4, disabled }: {
  players: FTPlayer[]; budget: number; value: string[]; onChange: (v: string[]) => void; max?: number; disabled?: boolean
}) {
  const spend = value.reduce((s, seat) => s + (players.find((p) => p.seat === seat)?.icmPrice ?? 0), 0)
  const remaining = budget - spend
  const spentPct = budget > 0 ? Math.min(100, Math.round((spend / budget) * 100)) : 0
  const maxBB = Math.max(1, ...players.map((p) => p.bbStack))

  function toggle(p: FTPlayer) {
    if (disabled) return
    if (value.includes(p.seat)) onChange(value.filter((s) => s !== p.seat))
    else if (value.length < max && p.icmPrice <= remaining) onChange([...value, p.seat])
  }

  return (
    <div>
      {/* Budget — Spent + Available shown big, with a fill bar that visibly
          animates and numbers that pop as you draft (the change used to be too
          subtle). Spent shares the amber of the per-player ICM-price tags. */}
      <div className="mb-2 rounded-xl border border-border bg-bg-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wide text-text-muted">Budget</span>
          <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold',
            value.length === max ? 'bg-accent-emerald/20 text-accent-emerald' : 'bg-bg-surface text-text-secondary')}>
            {value.length}/{max} drafted
          </span>
        </div>
        <div className="mb-1.5 flex items-end justify-between">
          <span className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-wide text-text-muted">Spent</span>
            <span key={`s${spend}`} className="text-xl font-extrabold leading-none text-accent-amber" style={{ animation: 'budgetPop 0.32s ease-out' }}>{fmtK(spend)}</span>
          </span>
          <span className="flex flex-col items-end">
            <span className="text-[9px] font-bold uppercase tracking-wide text-text-muted">Available</span>
            <span key={`a${remaining}`} className={cn('text-xl font-extrabold leading-none', remaining > 0 ? 'text-accent-emerald' : 'text-text-secondary')} style={{ animation: 'budgetPop 0.32s ease-out' }}>{fmtK(remaining)}</span>
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg-surface">
          <div className="h-full rounded-full bg-accent-amber transition-[width] duration-500 ease-out" style={{ width: `${spentPct}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-[9px] font-medium text-text-muted">
          <span>{spentPct}% used</span>
          <span>of {fmtK(budget)} budget</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {players.map((p) => {
          const picked = value.includes(p.seat)
          const affordable = picked || (value.length < max && p.icmPrice <= remaining)
          const stackPct = Math.max(8, Math.round((p.bbStack / maxBB) * 100))
          return (
            <button
              key={p.seat}
              onClick={() => toggle(p)}
              disabled={disabled || (!picked && !affordable)}
              className={cn('flex flex-col gap-1.5 rounded-xl border p-2 text-left transition-all cursor-pointer disabled:cursor-not-allowed',
                picked ? 'border-accent-purple bg-accent-purple/15 ring-1 ring-accent-purple/40' : 'border-border bg-bg-card hover:bg-bg-surface',
                !picked && !affordable && 'opacity-40')}
            >
              {/* top row: seat tag + ICM price (amber price-tag pill — clearly the COST, never the stack) */}
              <div className="flex w-full items-center justify-between gap-1">
                <span className={cn('flex h-6 w-6 items-center justify-center rounded-md text-xs font-extrabold', picked ? 'bg-accent-purple text-white' : 'bg-bg-surface text-text-secondary')}>{p.seat}</span>
                <span title="ICM price" className={cn('inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[12px] font-extrabold leading-none',
                  affordable ? 'bg-accent-amber/20 text-accent-amber' : 'bg-bg-surface text-text-muted')}>
                  <Tag className="h-3 w-3" strokeWidth={2.5} />{fmtK(p.icmPrice)}
                </span>
              </div>
              {/* name — the hero */}
              <span className="flex items-center gap-1 truncate text-sm font-bold leading-tight text-text-primary">
                <span className="shrink-0 text-base leading-none">{p.country ?? '🃏'}</span>
                <span className="truncate">{playerFull(p)}</span>
              </span>
              {/* stack — BB with a relative-depth bar (distinct blue, never confused with the amber price) */}
              <div className="w-full">
                <div className="mb-0.5 flex items-baseline justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wide text-text-muted">Stack</span>
                  <span className="text-[12px] font-extrabold leading-none text-text-secondary">{p.bbStack}<span className="ml-0.5 text-[9px] font-bold text-text-muted">BB</span></span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-surface">
                  <div className={cn('h-full rounded-full', picked ? 'bg-accent-purple' : 'bg-accent-blue')} style={{ width: `${stackPct}%` }} />
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <style>{`@keyframes budgetPop { 0% { transform: scale(1.3); } 60% { transform: scale(0.97); } 100% { transform: scale(1); } }`}</style>
    </div>
  )
}
