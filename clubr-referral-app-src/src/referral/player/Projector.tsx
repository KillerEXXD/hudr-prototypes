import { useState } from 'react'
import { Calculator } from 'lucide-react'
import { money } from '@/lib/referralFormat'
import { cn } from '@/lib/utils/cn'

const RATES: Record<number, number> = { 1: 0.5, 2: 0.3, 3: 0.2 }

function Slider({ label, value, onChange, min, max, step, display }: { label: string; value: number; onChange: (n: number) => void; min: number; max: number; step: number; display: string }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between"><span className="text-xs font-bold text-text-secondary">{label}</span><span className="text-base font-extrabold tabular-nums">{display}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full cursor-pointer accent-accent-blue" />
    </div>
  )
}

export function Projector() {
  const [direct, setDirect] = useState(20)
  const [sub, setSub] = useState(10)
  const [coins, setCoins] = useState(100)
  const [packCoins, setPackCoins] = useState(5)
  const [packPrice, setPackPrice] = useState(5)
  const [year, setYear] = useState(1)

  const perCoin = packPrice / (packCoins || 1)
  const spend = coins * perCoin
  const residualPeople = direct * sub
  const directEarn = direct * spend * RATES[year]
  const residEarn = residualPeople * spend * 0.1
  const total = directEarn + residEarn

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-purple/15 text-accent-purple"><Calculator className="h-5 w-5" /></span>
        <div><h1 className="text-lg font-extrabold">Your earning potential</h1><p className="text-xs text-text-muted">See what you could earn — no cap.</p></div>
      </div>

      {/* Big total */}
      <div className="rounded-3xl border border-accent-blue/25 bg-gradient-to-b from-accent-blue/12 to-transparent p-5 text-center">
        <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted">Your potential earnings</div>
        <div className="mt-1 text-4xl font-extrabold tabular-nums text-accent-blue">{money(total)}</div>
        <div className="mt-1 text-xs text-text-muted">{direct} direct + {residualPeople.toLocaleString()} residual = {(direct + residualPeople).toLocaleString()} people buying</div>
      </div>

      {/* Controls */}
      <div className="space-y-4 rounded-2xl border border-border bg-bg-card p-4">
        <Slider label="People you refer directly" value={direct} onChange={setDirect} min={0} max={50} step={1} display={String(direct)} />
        <Slider label="People each of them refers" value={sub} onChange={setSub} min={0} max={50} step={1} display={String(sub)} />
        <Slider label="Coins each person buys (per year)" value={coins} onChange={setCoins} min={0} max={1000} step={5} display={`${coins.toLocaleString()} coins`} />
        <div>
          <div className="mb-1 text-xs font-bold text-text-secondary">Coin price</div>
          <div className="flex items-center gap-2">
            <input type="number" min={1} value={packCoins} onChange={(e) => setPackCoins(Math.max(1, +e.target.value || 1))} className="w-16 rounded-lg border border-border bg-bg-surface px-2 py-1.5 text-sm font-bold" />
            <span className="text-sm text-text-muted">coins = $</span>
            <input type="number" min={0} value={packPrice} onChange={(e) => setPackPrice(Math.max(0, +e.target.value || 0))} className="w-20 rounded-lg border border-border bg-bg-surface px-2 py-1.5 text-sm font-bold" />
            <span className="ml-auto text-xs text-text-muted">{money(perCoin)} / coin</span>
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs font-bold text-text-secondary">Your direct rate (their year)</div>
          <div className="flex gap-1.5">
            {[[1, '50%'], [2, '30%'], [3, '20%']].map(([y, r]) => (
              <button key={y} type="button" onClick={() => setYear(y as number)} className={cn('flex-1 rounded-lg border px-2 py-2 text-xs font-bold transition-colors cursor-pointer', year === y ? 'border-transparent bg-accent-blue text-white' : 'border-border bg-bg-surface text-text-muted hover:bg-bg-elevated')}>Yr {y as number} · {r}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="rounded-2xl border border-border bg-bg-card divide-y divide-border/60">
        <Row k="Spend per person / year" v={money(spend)} tone="text-accent-amber" />
        <Row k="Direct — your cut of the people you refer" v={money(directEarn)} tone="text-accent-blue" />
        <Row k="Residual — 10% of everyone they refer" v={money(residEarn)} tone="text-accent-cyan" />
      </div>
      <p className="px-1 text-[11px] text-text-muted">Direct = people × spend × year rate. Residual = people × their referrals × spend × 10%. Illustrative — real earnings depend on actual purchases. No cap.</p>
    </div>
  )
}
function Row({ k, v, tone }: { k: string; v: string; tone: string }) {
  return <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm"><span className="font-semibold">{k}</span><span className={cn('text-lg font-extrabold tabular-nums', tone)}>{v}</span></div>
}
