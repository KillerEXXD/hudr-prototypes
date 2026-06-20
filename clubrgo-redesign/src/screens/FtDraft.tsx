import { useState } from 'react'
import { PrimaryBtn } from '../ui'

const BUDGET = 100000
const FINALISTS = [
  { seat: 'A', name: 'Erik Seidel', flag: '🇺🇸', bb: 172, price: 35000 },
  { seat: 'B', name: 'Tom Dwan', flag: '🇺🇸', bb: 137, price: 31000 },
  { seat: 'C', name: 'Stephen Chidwick', flag: '🇬🇧', bb: 118, price: 28000 },
  { seat: 'D', name: 'Jason Koon', flag: '🇺🇸', bb: 96, price: 24000 },
  { seat: 'E', name: 'Vanessa Selbst', flag: '🇺🇸', bb: 74, price: 21000 },
  { seat: 'F', name: 'Fedor Holz', flag: '🇩🇪', bb: 61, price: 18000 },
  { seat: 'G', name: 'Liv Boeree', flag: '🇬🇧', bb: 48, price: 16000 },
  { seat: 'H', name: 'Daniel Negreanu', flag: '🇨🇦', bb: 33, price: 14000 },
  { seat: 'I', name: 'Phil Ivey', flag: '🇺🇸', bb: 21, price: 13000 },
]
const fmtK = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`)

export function FtDraft() {
  const [picks, setPicks] = useState<string[]>(['A', 'F'])
  const spent = FINALISTS.filter((f) => picks.includes(f.seat)).reduce((s, f) => s + f.price, 0)
  const left = BUDGET - spent
  const pct = Math.min(100, (spent / BUDGET) * 100)
  const over = left < 0
  const toggle = (seat: string, price: number) =>
    setPicks((p) => p.includes(seat) ? p.filter((s) => s !== seat) : p.length >= 4 || spent + price > BUDGET ? p : [...p, seat])

  return (
    <div className="pb-6">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[#0a0a0f]/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400"><span>🚀</span>Houston Rockets<span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-bold text-violet-300">FT Fantasy</span></div>
        <h1 className="mt-0.5 text-xl font-black tracking-tight">🃏 WSOP Main FT — Draft</h1>

        {/* budget meter */}
        <div className="mt-3 rounded-2xl border border-white/10 bg-zinc-900/80 p-3">
          <div className="flex items-end justify-between text-xs">
            <div><div className="text-[10px] uppercase tracking-wide text-zinc-500">Spent</div><div className="font-mono text-lg font-bold text-amber-300">{fmtK(spent)}</div></div>
            <div className="text-center"><div className="text-[10px] uppercase tracking-wide text-zinc-500">Drafted</div><div className="font-bold">{picks.length}/4</div></div>
            <div className="text-right"><div className="text-[10px] uppercase tracking-wide text-zinc-500">Available</div><div className={`font-mono text-lg font-bold ${over ? 'text-rose-400' : 'text-emerald-300'}`}>{fmtK(left)}</div></div>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div className={`h-full rounded-full transition-all ${over ? 'bg-rose-500' : 'bg-gradient-to-r from-sky-500 to-violet-500'}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1 text-[10px] text-zinc-500">{Math.round(pct)}% of {fmtK(BUDGET)} budget · pick exactly 4 of 9</div>
        </div>
      </div>

      <div className="px-4 pt-3">
        <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wide text-zinc-500">
          <span>Final table — priced by ICM</span><span>BB · price</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {FINALISTS.map((f) => {
            const on = picks.includes(f.seat)
            return (
              <button key={f.seat} onClick={() => toggle(f.seat, f.price)}
                className={`flex items-center gap-3 rounded-xl border p-2.5 text-left transition active:scale-[.99] ${on ? 'border-violet-500/50 bg-violet-500/10 ring-1 ring-violet-500/30' : 'border-white/10 bg-zinc-900/60 hover:bg-zinc-900'}`}>
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-black ${on ? 'bg-violet-500 text-white' : 'bg-white/5 text-zinc-400'}`}>{on ? '✓' : f.seat}</span>
                <span className="text-lg">{f.flag}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{f.name}</span><span className="text-[11px] text-zinc-500">{f.bb} BB</span></span>
                <span className="text-right"><span className="block font-mono text-sm font-bold text-violet-300">{fmtK(f.price)}</span></span>
              </button>
            )
          })}
        </div>

        <button className="mt-3 text-[11px] font-bold text-sky-400">See ICM pricing &amp; scoring details →</button>

        <div className="mt-3">
          <PrimaryBtn className="w-full" >{picks.length === 4 ? 'Submit draft' : `Pick ${4 - picks.length} more`}</PrimaryBtn>
        </div>
      </div>
    </div>
  )
}
