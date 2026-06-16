import { Trophy, Plus, Minus, Clock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { TIMEZONES, PAYOUT_PRESETS, payoutsSum, arePayoutsValid, payoutSummary } from '@/lib/gameSetup'

type Accent = 'purple' | 'amber'
const ords = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`

// ---- Registration close time + timezone (mandatory at creation) ----
export function ScheduleFields({ accent, closesAt, onCloseChange, tz, onTzChange }: {
  accent: Accent
  closesAt: string; onCloseChange: (v: string) => void
  tz: string; onTzChange: (v: string) => void
}) {
  const ring = accent === 'amber' ? 'focus:ring-accent-amber' : 'focus:ring-accent-purple'
  return (
    <div>
      <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-text-secondary"><Clock className="h-3.5 w-3.5" />Registration closes *</span>
      <div className="flex gap-2">
        <input
          type="datetime-local"
          value={closesAt}
          onChange={(e) => onCloseChange(e.target.value)}
          className={cn('min-w-0 flex-1 rounded-xl border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2', ring)}
        />
        <select
          value={tz}
          onChange={(e) => onTzChange(e.target.value)}
          className={cn('rounded-xl border border-border bg-bg-surface px-2 py-2 text-sm font-semibold text-text-primary focus:outline-none focus:ring-2', ring)}
          aria-label="Time zone"
        >
          {TIMEZONES.map((z) => <option key={z.id} value={z.id}>{z.id}</option>)}
        </select>
      </div>
      <p className="mt-1 text-[11px] text-text-muted">Players can register until this time — a live countdown shows on the card.</p>
    </div>
  )
}

// ---- Payout structure editor (presets + custom places, must sum to 100%) ----
export function PayoutEditor({ accent, payouts, onChange }: {
  accent: Accent
  payouts: number[]; onChange: (p: number[]) => void
}) {
  const sum = payoutsSum(payouts)
  const ok = arePayoutsValid(payouts)
  const sel = accent === 'amber' ? 'border-accent-amber bg-accent-amber/15 text-accent-amber' : 'border-accent-purple bg-accent-purple/15 text-accent-purple'
  const setN = (i: number, v: number) => onChange(payouts.map((x, j) => (j === i ? v : x)))

  return (
    <div>
      <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-text-secondary"><Trophy className="h-3.5 w-3.5" />Payouts *</span>
      <div className="flex flex-wrap gap-1.5">
        {PAYOUT_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange([...p.payouts])}
            className={cn('rounded-lg border px-2.5 py-1 text-xs font-semibold cursor-pointer', JSON.stringify(payouts) === JSON.stringify(p.payouts) ? sel : 'border-border text-text-secondary')}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-2 flex flex-col gap-1.5">
        {payouts.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-8 text-xs font-semibold text-text-muted">{ords(i + 1)}</span>
            <input
              type="number" min={0} max={100} value={v}
              onChange={(e) => setN(i, Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
              className="w-16 rounded-lg border border-border bg-bg-surface px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
            />
            <span className="text-xs text-text-muted">%</span>
            {payouts.length > 1 && (
              <button type="button" onClick={() => onChange(payouts.filter((_, j) => j !== i))} className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-bg-surface cursor-pointer" aria-label={`Remove ${ords(i + 1)} place`}>
                <Minus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-1.5 flex items-center justify-between">
        <button type="button" onClick={() => onChange([...payouts, 0])} className="flex items-center gap-1 text-xs font-semibold text-accent-blue cursor-pointer"><Plus className="h-3.5 w-3.5" />Add place</button>
        <span className={cn('text-xs font-bold', ok ? 'text-accent-emerald' : 'text-accent-red')}>Total {sum}% {ok ? '✓' : '— must equal 100%'}</span>
      </div>
    </div>
  )
}

// ---- Compact payout pill for game cards ----
export function PayoutBadge({ payouts }: { payouts?: number[] }) {
  const s = payoutSummary(payouts)
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary">
      <Trophy className="h-3 w-3 text-accent-amber" />
      {s.wta ? 'Winner takes all' : <>{s.label} · <span className="font-mono">{s.splits}</span></>}
    </span>
  )
}
