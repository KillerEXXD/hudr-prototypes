import { useState } from 'react'
import { Layers, Check, Info } from 'lucide-react'
import { useFinalists } from '@/hooks'
import { PrimaryBtn } from '@/components/ui'
import { cn } from '@/lib/utils/cn'

const BUDGET = 100000
const fmtK = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`)

export function FtDraftPage() {
  const { data: finalists = [] } = useFinalists()
  const [picks, setPicks] = useState<string[]>(['A', 'F'])
  const spent = finalists.filter((f) => picks.includes(f.seat)).reduce((s, f) => s + f.price, 0)
  const left = BUDGET - spent
  const pct = Math.min(100, (spent / BUDGET) * 100)
  const over = left < 0
  const toggle = (seat: string, price: number) =>
    setPicks((p) => p.includes(seat) ? p.filter((s) => s !== seat) : p.length >= 4 || spent + price > BUDGET ? p : [...p, seat])

  return (
    <div className="pb-6">
      <div className="sticky top-0 z-10 border-b border-border bg-bg-primary/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary">🚀 Houston Rockets<span className="rounded bg-accent-violet/15 px-1.5 py-0.5 text-[10px] font-bold text-accent-violet">FT Fantasy</span></div>
        <h1 className="mt-0.5 flex items-center gap-2 text-xl font-black tracking-tight"><Layers className="h-5 w-5 text-accent-violet" />WSOP Main FT — Draft</h1>

        <div className="mt-3 rounded-2xl border border-border bg-bg-card p-3">
          <div className="flex items-end justify-between text-xs">
            <div><div className="text-[10px] uppercase tracking-wide text-text-muted">Spent</div><div className="nums text-lg font-bold text-accent-amber">{fmtK(spent)}</div></div>
            <div className="text-center"><div className="text-[10px] uppercase tracking-wide text-text-muted">Drafted</div><div className="font-bold">{picks.length}/4</div></div>
            <div className="text-right"><div className="text-[10px] uppercase tracking-wide text-text-muted">Available</div><div className={cn('nums text-lg font-bold', over ? 'text-accent-red' : 'text-accent-emerald')}>{fmtK(left)}</div></div>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-surface">
            <div className={cn('h-full rounded-full transition-all', over ? 'bg-accent-red' : 'bg-gradient-to-r from-accent-blue to-accent-violet')} style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 text-[10px] text-text-muted">{Math.round(pct)}% of {fmtK(BUDGET)} budget · pick exactly 4 of 9</div>
        </div>
      </div>

      <div className="px-4 pt-3">
        <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wide text-text-muted"><span>Final table — priced by ICM</span><span>BB · price</span></div>
        <div className="flex flex-col gap-1.5">
          {finalists.map((f) => {
            const on = picks.includes(f.seat)
            return (
              <button key={f.seat} onClick={() => toggle(f.seat, f.price)} className={cn('flex items-center gap-3 rounded-xl border p-2.5 text-left transition active:scale-[.99]', on ? 'border-accent-violet/50 bg-accent-violet/10 ring-1 ring-accent-violet/30' : 'border-border bg-bg-card hover:bg-bg-surface')}>
                <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-black', on ? 'bg-accent-violet text-white' : 'bg-bg-surface text-text-muted')}>{on ? <Check className="h-4 w-4" /> : f.seat}</span>
                <span className="text-lg">{f.flag}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{f.name}</span><span className="nums text-[11px] text-text-muted">{f.bb} BB</span></span>
                <span className="nums text-sm font-bold text-accent-violet">{fmtK(f.price)}</span>
              </button>
            )
          })}
        </div>

        <button className="mt-3 flex items-center gap-1 text-[11px] font-bold text-accent-blue"><Info className="h-3.5 w-3.5" />See ICM pricing &amp; scoring details</button>
        <div className="mt-3"><PrimaryBtn className="w-full">{picks.length === 4 ? 'Submit draft' : `Pick ${4 - picks.length} more`}</PrimaryBtn></div>
      </div>
    </div>
  )
}
