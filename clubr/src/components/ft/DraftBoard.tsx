import { cn } from '@/lib/utils/cn'
import type { FTPlayer } from '@/types/ft'

const fmtK = (n: number) => `${Math.round(n / 1000)}k`

// The 9-player ICM-priced draft board. Pick up to `max` within budget.
export function DraftBoard({ players, budget, value, onChange, max = 4, disabled }: {
  players: FTPlayer[]; budget: number; value: string[]; onChange: (v: string[]) => void; max?: number; disabled?: boolean
}) {
  const spend = value.reduce((s, seat) => s + (players.find((p) => p.seat === seat)?.icmPrice ?? 0), 0)
  const remaining = budget - spend

  function toggle(p: FTPlayer) {
    if (disabled) return
    if (value.includes(p.seat)) onChange(value.filter((s) => s !== p.seat))
    else if (value.length < max && p.icmPrice <= remaining) onChange([...value, p.seat])
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between rounded-xl border border-border bg-bg-card px-3 py-2 text-sm">
        <span className="text-text-muted">Budget</span>
        <span className="font-mono font-bold text-text-primary">{fmtK(remaining)} <span className="text-text-muted">/ {fmtK(budget)} left</span></span>
        <span className={cn('font-bold', value.length === max ? 'text-accent-emerald' : 'text-text-secondary')}>{value.length}/{max} drafted</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {players.map((p) => {
          const picked = value.includes(p.seat)
          const affordable = picked || (value.length < max && p.icmPrice <= remaining)
          return (
            <button
              key={p.seat}
              onClick={() => toggle(p)}
              disabled={disabled || (!picked && !affordable)}
              className={cn('flex flex-col items-center gap-0.5 rounded-xl border p-2 text-center transition-all cursor-pointer disabled:cursor-not-allowed',
                picked ? 'border-accent-purple bg-accent-purple/15 ring-1 ring-accent-purple/40' : 'border-border bg-bg-card hover:bg-bg-surface',
                !picked && !affordable && 'opacity-40')}
            >
              <span className={cn('flex h-6 w-6 items-center justify-center rounded-md text-xs font-extrabold', picked ? 'bg-accent-purple text-white' : 'bg-bg-surface text-text-secondary')}>{p.seat}</span>
              <span className="flex max-w-full items-center gap-0.5 truncate text-[11px] font-semibold text-text-primary"><span className="leading-none">{p.country ?? '🃏'}</span>{p.name}</span>
              <span className="font-mono text-[10px] text-text-muted">{fmtK(p.icmPrice)}</span>
              <span className="text-[9px] text-text-muted">{p.bbStack} BB</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
