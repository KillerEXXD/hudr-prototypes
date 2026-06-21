import { cn } from '@/lib/utils/cn'
import { Check } from 'lucide-react'
import { type FTPlayer } from '@/types/ft'

// =====================================================================
// DraftBoard — the ClubrGo JSX "Draft Board" signature screen, faithfully:
// gold BUDGET LEFT / PICKS header, a glowing gold meter, a picked-token row,
// and a single-column ranked finalist list with gold-ring selected rows.
// Bound to the app's REAL data (seats, ICM prices, stacks) and Stakes wording.
// Props unchanged, so the FT detail page that renders it needs no edits.
// =====================================================================
const fmt = (n: number) => n.toLocaleString('en-US')

export function DraftBoard({ players, budget, value, onChange, max = 4, disabled }: {
  players: FTPlayer[]; budget: number; value: string[]; onChange: (v: string[]) => void; max?: number; disabled?: boolean
}) {
  const spend = value.reduce((s, seat) => s + (players.find((p) => p.seat === seat)?.icmPrice ?? 0), 0)
  const remaining = budget - spend
  const pct = budget > 0 ? Math.min(100, (spend / budget) * 100) : 0
  const full = value.length >= max
  const low = remaining < budget * 0.1

  function toggle(p: FTPlayer) {
    if (disabled) return
    if (value.includes(p.seat)) onChange(value.filter((s) => s !== p.seat))
    else if (!full && p.icmPrice <= remaining) onChange([...value, p.seat])
  }

  const name = (p: FTPlayer) => p.first && p.last ? `${p.first} ${p.last}` : p.name

  return (
    <div>
      {/* budget meter */}
      <div className="rounded-[18px] border border-[#23382C] bg-bg-card p-3.5">
        <div className="mb-2.5 flex items-baseline justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-muted">Budget left</div>
            <div className={cn('font-bold leading-none', low ? 'text-accent-amber' : 'text-accent-gold')} style={{ fontFamily: 'var(--font-family-display)', fontSize: 26 }}>
              {fmt(remaining)}<span className="text-[13px] font-medium text-text-muted"> / {fmt(budget)} Stakes</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-muted">Picks</div>
            <div className="font-bold leading-none text-text-primary" style={{ fontFamily: 'var(--font-family-display)', fontSize: 26 }}>
              {value.length}<span className="text-[13px] font-medium text-text-muted"> / {max}</span>
            </div>
          </div>
        </div>
        {/* meter */}
        <div className="relative h-2.5 overflow-hidden rounded-full bg-[#0C1A13]">
          <div className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,var(--color-accent-gold-deep),var(--color-accent-gold))] shadow-[0_0_12px_rgba(233,196,106,0.2)] transition-[width] duration-300"
            style={{ width: `${pct}%` }} />
        </div>
        {/* pick tokens */}
        <div className="mt-3 flex gap-1.5">
          {Array.from({ length: max }).map((_, i) => {
            const seat = value[i]
            const p = seat ? players.find((x) => x.seat === seat) : undefined
            return (
              <div key={i} className={cn('relative flex h-[38px] flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-xl font-mono text-[12px] font-semibold',
                p ? 'bg-[linear-gradient(135deg,#1E3A2C,#15281E)] text-accent-gold' : 'border border-dashed border-[#23382C] bg-[#0E1B14] text-text-muted')}>
                {p ? <span>{p.country} <span className="text-text-primary">S{p.seat}</span></span> : '—'}
                {p && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-accent-gold" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* finalists list header */}
      <div className="mb-3 mt-4 flex items-center justify-between px-0.5">
        <span className="text-[14px] font-semibold text-text-secondary" style={{ fontFamily: 'var(--font-family-display)' }}>{players.length} finalists</span>
        <span className="font-mono text-[11px] text-text-muted">ICM price · seat order</span>
      </div>

      {/* finalists — single-column ranked list */}
      <div className="flex flex-col gap-2">
        {players.map((p) => {
          const picked = value.includes(p.seat)
          const tooPricey = !picked && (full || p.icmPrice > remaining)
          return (
            <button key={p.seat} onClick={() => toggle(p)} disabled={disabled || tooPricey}
              className={cn('flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all active:scale-[0.99] disabled:cursor-not-allowed',
                picked ? 'border-accent-gold bg-[linear-gradient(110deg,#1A3326,#14271C)] shadow-[0_6px_22px_-10px_rgba(233,196,106,0.2)]' : 'border-[#23382C] bg-bg-card',
                tooPricey && 'opacity-45')}>
              {/* seat avatar */}
              <div className={cn('relative grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] border text-[16px] font-bold',
                picked ? 'border-accent-gold bg-accent-gold text-bg-primary' : 'border-[#23382C] bg-[#16291F] text-text-secondary')}
                style={{ fontFamily: 'var(--font-family-display)' }}>
                {p.seat}
                {p.country && <span className="absolute -bottom-1 -right-1 text-[13px]">{p.country}</span>}
              </div>
              {/* name + stack */}
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold text-text-primary" style={{ fontFamily: 'var(--font-family-display)' }}>{name(p)}</div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="font-mono text-[11px] text-text-muted">{p.chips ? `${fmt(p.chips)} chips` : `${p.bbStack} BB`}</span>
                </div>
              </div>
              {/* ICM price */}
              <div className="shrink-0 text-right">
                <div className={cn('text-[17px] font-bold', picked ? 'text-accent-gold' : 'text-text-primary')} style={{ fontFamily: 'var(--font-family-display)' }}>{fmt(p.icmPrice)}</div>
                <div className="font-mono text-[10px] tracking-[0.04em] text-text-muted">ICM Stakes</div>
              </div>
              {/* check ring */}
              <div className={cn('grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full border-2',
                picked ? 'border-accent-gold bg-accent-gold' : 'border-[#23382C]')}>
                {picked && <Check className="h-3.5 w-3.5 text-bg-primary" strokeWidth={3} />}
              </div>
            </button>
          )
        })}
      </div>

      {/* footer status — "Pick N more" / locked summary */}
      <div className="sticky bottom-2 mt-4">
        <div className={cn('rounded-2xl px-4 py-3.5 text-center text-[15px] font-bold',
          full ? 'bg-[linear-gradient(100deg,var(--color-accent-gold),var(--color-accent-gold-deep))] text-bg-primary shadow-[0_10px_30px_-10px_rgba(233,196,106,0.3)]' : 'bg-[#16291F] text-text-muted')}
          style={{ fontFamily: 'var(--font-family-display)' }}>
          {full ? `Roster set · ${fmt(spend)} Stakes spent` : `Pick ${max - value.length} more finalist${max - value.length > 1 ? 's' : ''}`}
        </div>
      </div>
    </div>
  )
}
