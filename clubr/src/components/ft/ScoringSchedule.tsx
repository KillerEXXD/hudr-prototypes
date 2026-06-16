import { useState } from 'react'
import { Award, ChevronDown } from 'lucide-react'
import { FINISH_POINTS } from '@/types/ft'
import { cn } from '@/lib/utils/cn'

const ord = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`

// Collapsible "points per finish" schedule — shows what each FT finishing
// position is worth so a drafter can see scoring WHILE drafting (not just after
// the contest settles). Single source of truth = FINISH_POINTS.
export function ScoringSchedule({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl border border-border bg-bg-card">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 px-3 py-2 text-left cursor-pointer">
        <Award className="h-4 w-4 shrink-0 text-accent-emerald" />
        <span className="flex-1 text-xs font-bold text-text-primary">How scoring works — points per finish</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-text-muted transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="border-t border-border px-3 py-2">
          <div className="flex flex-wrap gap-1">
            {FINISH_POINTS.map((pts, i) => (
              <span key={i} className="inline-flex items-baseline gap-1 rounded-md border border-border bg-bg-surface/60 px-1.5 py-0.5 text-[11px]">
                <span className="font-semibold text-text-secondary">{ord(i + 1)}</span>
                <span className="font-mono font-bold text-accent-emerald">{pts}</span>
              </span>
            ))}
          </div>
          <p className="mt-1.5 text-[10px] leading-snug text-text-muted">
            Your score = the finish points of your <strong className="text-text-secondary">4 drafted players</strong>; highest total takes the pool (split per the host's payouts).
          </p>
        </div>
      )}
    </div>
  )
}
