import { cn } from '@/lib/utils/cn'
import { Tag, AlertTriangle } from 'lucide-react'
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

  // "Roster blocked": seats are still open but the budget can no longer fit the
  // CHEAPEST way to fill them — so the entry can never reach `max` picks without
  // a swap. We surface this loudly (the old greyed-out cards never explained the
  // dead-end). minToComplete = sum of the cheapest `openSeats` players left.
  const openSeats = max - value.length
  const unpicked = players.filter((p) => !value.includes(p.seat))
  const cheapestOpen = unpicked.reduce<FTPlayer | undefined>(
    (min, p) => (p.icmPrice < (min?.icmPrice ?? Infinity) ? p : min), undefined)
  const minToComplete = [...unpicked]
    .sort((a, b) => a.icmPrice - b.icmPrice)
    .slice(0, openSeats)
    .reduce((s, p) => s + p.icmPrice, 0)
  const blocked = openSeats > 0 && unpicked.length > 0 && minToComplete > remaining
  const shortBy = Math.max(0, minToComplete - remaining)
  const blockedMsg = !blocked || !cheapestOpen ? ''
    : openSeats === 1
      ? `The cheapest open seat (${playerFull(cheapestOpen)}, ${fmtK(cheapestOpen.icmPrice)}) needs ${fmtK(shortBy)} more than your ${fmtK(remaining)} left. Remove a drafted player and pick a cheaper one.`
      : `Filling your last ${openSeats} seats needs ${fmtK(shortBy)} more than the ${fmtK(remaining)} you have left. Remove a drafted player and pick lower-priced ones.`

  function toggle(p: FTPlayer) {
    if (disabled) return
    if (value.includes(p.seat)) onChange(value.filter((s) => s !== p.seat))
    else if (value.length < max && p.icmPrice <= remaining) onChange([...value, p.seat])
  }

  return (
    <div>
      {/* Budget — Spent + Available shown big, with a fill bar that visibly
          animates and numbers that pop as you draft (the change used to be too
          subtle). Spent shares the amber of the per-player ICM-price tags.
          When the roster is blocked, the meter flips to red. */}
      <div className={cn('mb-2 rounded-xl border bg-bg-card p-3 transition-colors',
        blocked ? 'border-accent-red/50' : 'border-border')}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wide text-text-muted">Budget</span>
          {/* Drafted progress as slot pips (not a subtle "3/4 drafted" text). The
              open pip(s) pulse red when the roster is blocked. */}
          <span className="flex items-center gap-1.5">
            <span className="flex items-center gap-1" aria-label={`${value.length} of ${max} drafted`}>
              {Array.from({ length: max }).map((_, i) => (
                <span key={i} className={cn('h-2.5 w-2.5 rounded-full transition-colors',
                  i < value.length ? 'bg-accent-emerald'
                    : blocked ? 'bg-accent-red animate-pulse'
                      : 'border border-border bg-bg-surface')} />
              ))}
            </span>
            <span className={cn('text-[11px] font-bold tabular-nums',
              value.length === max ? 'text-accent-emerald' : blocked ? 'text-accent-red' : 'text-text-secondary')}>
              {value.length}/{max}
            </span>
          </span>
        </div>
        <div className="mb-1.5 flex items-end justify-between">
          <span className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-wide text-text-muted">Spent</span>
            <span key={`s${spend}`} className="text-xl font-extrabold leading-none text-accent-amber" style={{ animation: 'budgetPop 0.32s ease-out' }}>{fmtK(spend)}</span>
          </span>
          <span className="flex flex-col items-end">
            <span className="text-[9px] font-bold uppercase tracking-wide text-text-muted">Available</span>
            <span key={`a${remaining}`} className={cn('text-xl font-extrabold leading-none',
              blocked ? 'text-accent-red' : remaining > 0 ? 'text-accent-emerald' : 'text-text-secondary')} style={{ animation: 'budgetPop 0.32s ease-out' }}>{fmtK(remaining)}</span>
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg-surface">
          <div className={cn('h-full rounded-full transition-[width,background-color] duration-500 ease-out',
            blocked ? 'bg-accent-red' : 'bg-accent-amber')} style={{ width: `${spentPct}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-[9px] font-medium text-text-muted">
          <span>{spentPct}% used</span>
          <span>of {fmtK(budget)} budget</span>
        </div>
      </div>

      {/* Roster-blocked alert — the loud, actionable callout. Tells the user they
          hit budget before filling all seats and exactly what to do about it. */}
      {blocked && (
        <div role="alert" className="mb-2 flex items-start gap-2 rounded-xl border border-accent-red/50 bg-accent-red/10 p-2.5"
          style={{ animation: 'blockShake 0.4s ease-in-out' }}>
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-accent-red" strokeWidth={2.5} />
          <div className="min-w-0">
            <p className="text-[13px] font-extrabold leading-tight text-accent-red">
              Out of budget — {openSeats} seat{openSeats > 1 ? 's' : ''} still open
            </p>
            <p className="mt-0.5 text-[11px] font-medium leading-snug text-text-secondary">{blockedMsg}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {players.map((p) => {
          const picked = value.includes(p.seat)
          const affordable = picked || (value.length < max && p.icmPrice <= remaining)
          // When blocked, spotlight the cheapest open seat as the swap target.
          const isSwapTarget = blocked && !picked && cheapestOpen?.seat === p.seat
          const stackPct = Math.max(8, Math.round((p.bbStack / maxBB) * 100))
          return (
            <button
              key={p.seat}
              onClick={() => toggle(p)}
              disabled={disabled || (!picked && !affordable)}
              className={cn('flex flex-col gap-1.5 rounded-xl border p-2 text-left transition-all cursor-pointer disabled:cursor-not-allowed',
                picked ? 'border-accent-purple bg-accent-purple/15 ring-1 ring-accent-purple/40' : 'border-border bg-bg-card hover:bg-bg-surface',
                isSwapTarget && 'border-accent-red/60 ring-1 ring-accent-red/40',
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

      <style>{`@keyframes budgetPop { 0% { transform: scale(1.3); } 60% { transform: scale(0.97); } 100% { transform: scale(1); } }
@keyframes blockShake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-4px); } 40% { transform: translateX(4px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }`}</style>
    </div>
  )
}
