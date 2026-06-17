import { useState } from 'react'
import { Info, ChevronDown, Trophy, Target } from 'lucide-react'
import { FINISH_POINTS } from '@/types/ft'
import type { FTPlayer } from '@/types/ft'
import { Sheet } from '@/components/common/ui'
import { HowItWorksFT } from './HowItWorks'
import { fmtK, fmtCash, playerShort } from '@/lib/utils/ftFormat'
import { cn } from '@/lib/utils/cn'

const ord = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`

/**
 * Combined "How scoring & pricing work" strip for the FT Fantasy details page.
 * Sits at the top (below buy-in + pool) so a drafter sees BOTH mechanics at the
 * moment of the draft decision:
 *   1. Scoring  — points per finish (FINISH_POINTS), score = your 4 players' sum.
 *   2. Pricing  — ICM: each seat's price is its fair share of the prize pool,
 *      shown with a 3-seat compression illustration (chips fall faster than price).
 * "Full rules →" opens the complete HowItWorksFT walkthrough in a sheet.
 * Replaces the standalone ScoringSchedule.
 */
export function HowScoringPricing({ players, budget, defaultOpen = false }: { players: FTPlayer[]; budget: number; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const [rules, setRules] = useState(false)

  // Leader / mid / short by draft price — the spread that shows ICM compression.
  const byPrice = [...players].sort((a, b) => b.icmPrice - a.icmPrice)
  const leader = byPrice[0]
  const short = byPrice[byPrice.length - 1]
  const mid = byPrice[Math.floor((byPrice.length - 1) / 2)]
  const rows = [leader, mid, short].filter(Boolean)
  const chipX = short?.bbStack ? (leader.bbStack / short.bbStack) : 0
  const priceX = short?.icmPrice ? (leader.icmPrice / short.icmPrice) : 0

  return (
    <div className="rounded-xl border border-border bg-bg-card">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 px-3 py-2 text-left cursor-pointer">
        <Info className="h-4 w-4 shrink-0 text-accent-blue" />
        <span className="flex-1 text-xs font-bold text-text-primary">How scoring &amp; pricing work</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-text-muted transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="flex flex-col gap-3 border-t border-border px-3 py-2.5">
          {/* ---- Scoring ---- */}
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-accent-emerald">
              <Trophy className="h-3.5 w-3.5" />Scoring — points per finish
            </p>
            <div className="flex flex-wrap gap-1">
              {FINISH_POINTS.map((pts, i) => (
                <span key={i} className="inline-flex items-baseline gap-1 rounded-md border border-border bg-bg-surface/60 px-1.5 py-0.5 text-[11px]">
                  <span className="font-semibold text-text-secondary">{ord(i + 1)}</span>
                  <span className="font-mono font-bold text-accent-emerald">{pts}</span>
                </span>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-text-muted">
              Your score = the finish points of your <strong className="text-text-secondary">4 drafted players</strong>; highest total takes the pool (split per the host's payouts).
            </p>
          </div>

          {/* ---- Pricing (ICM) ---- */}
          <div className="border-t border-border/60 pt-2.5">
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-accent-purple">
              <Target className="h-3.5 w-3.5" />Pricing — ICM
            </p>
            <p className="text-[11px] leading-snug text-text-muted">
              Each seat's price is its <strong className="text-text-secondary">ICM equity</strong> — its fair share of the prize pool right now, based on its chip stack. Bigger stacks cost more, but <strong className="text-text-secondary">not chip-for-chip</strong>: ICM compresses the leaders and lifts the short stacks, so a cheap short stack is still live. Spend your <span className="font-mono text-text-secondary">{fmtK(budget)}</span> across exactly 4 of the 9.
            </p>
            {/* Compression illustration — chips fall faster than price */}
            <div className="mt-2 overflow-hidden rounded-lg border border-border">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 bg-bg-surface/60 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-text-muted">
                <span>Seat</span><span className="text-right">Chips</span><span className="text-right">Price</span><span className="text-right">$ now</span>
              </div>
              {rows.map((p, i) => (
                <div key={p.seat} className={cn('grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-2.5 py-1 text-[11px]', i > 0 && 'border-t border-border/60')}>
                  <span className="truncate text-text-secondary">{playerShort(p)}</span>
                  <span className="text-right font-mono text-text-muted">{p.bbStack} BB</span>
                  <span className="text-right font-mono font-bold text-accent-purple">{fmtK(p.icmPrice)}</span>
                  <span className="text-right font-mono text-text-muted">{p.icmCash ? fmtCash(p.icmCash) : '—'}</span>
                </div>
              ))}
            </div>
            {chipX > 1 && priceX > 1 && (
              <p className="mt-1.5 text-[10px] leading-snug text-text-muted">
                Leader to short stack: chips drop <strong className="text-text-secondary">{chipX.toFixed(1)}×</strong> but price only <strong className="text-text-secondary">{priceX.toFixed(1)}×</strong> — that's ICM keeping the cheap seats live.
              </p>
            )}
          </div>

          <button type="button" onClick={() => setRules(true)} className="self-start text-[11px] font-bold text-accent-blue hover:underline cursor-pointer">
            Full rules →
          </button>
        </div>
      )}

      <Sheet open={rules} onClose={() => setRules(false)} title="How FT Fantasy works">
        <HowItWorksFT />
      </Sheet>
    </div>
  )
}
