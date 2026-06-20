import { Trophy, Target, ChevronLeft } from 'lucide-react'
import { FINISH_POINTS } from '@/types/ft'
import type { FTPlayer } from '@/types/ft'
import { fmtK, fmtCash, playerShort } from '@/lib/utils/ftFormat'
import { cn } from '@/lib/utils/cn'

const ord = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`

/**
 * "How ICM pricing & scoring work" — the detailed FT Fantasy explainer.
 * Opened from the "See ICM pricing & scoring details →" link inside the
 * "How game works" walkthrough sheet (see ContestDetailPage), so it renders as
 * plain sheet content (no collapsible wrapper of its own). Two sections:
 *   1. Scoring — points per finish (FINISH_POINTS); score = your 4 players' sum.
 *   2. Pricing — ICM: each seat's price is its fair share of the prize pool,
 *      with a 3-seat compression illustration (chips fall faster than price).
 * `onBack`, when provided, renders a prominent "Back to How game works" button
 * so the user can return to the walkthrough sheet it was opened from.
 */
export function HowScoringPricing({ players, budget, onBack }: { players: FTPlayer[]; budget: number; onBack?: () => void }) {
  // Leader / mid / short by draft price — the spread that shows ICM compression.
  const byPrice = [...players].sort((a, b) => b.icmPrice - a.icmPrice)
  const leader = byPrice[0]
  const short = byPrice[byPrice.length - 1]
  const mid = byPrice[Math.floor((byPrice.length - 1) / 2)]
  const rows = [leader, mid, short].filter(Boolean)
  const chipX = short?.bbStack ? (leader.bbStack / short.bbStack) : 0
  const priceX = short?.icmPrice ? (leader.icmPrice / short.icmPrice) : 0

  return (
    <div className="flex flex-col gap-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 self-start rounded-lg border border-border bg-bg-surface/60 px-3 py-2 text-xs font-bold text-accent-blue hover:bg-bg-surface cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />Back to How game works
        </button>
      )}

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
            <span>Seat</span><span className="text-right">Chips</span><span className="text-right">Price</span><span className="text-right">Stakes</span>
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
    </div>
  )
}
