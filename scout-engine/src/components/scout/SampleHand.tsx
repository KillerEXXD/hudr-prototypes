import { Clapperboard } from 'lucide-react'
import type { SampleHand as SampleHandType } from '@/engine'
import MiniCard from '@/components/common/MiniCard'
import { cn } from '@/lib/utils'

// "Pulled from real hands, not invented" — the spec's sample-hand illustration.
export default function SampleHand({ hand, className }: { hand: SampleHandType; className?: string }) {
  return (
    <div className={cn('rounded-lg border border-border/70 bg-bg-secondary/60 p-3', className)}>
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">
        <Clapperboard className="h-3.5 w-3.5" /> Real hand · {hand.label}
      </div>
      <div className="flex items-center gap-3">
        {hand.board.length > 0 ? (
          <div className="flex gap-1">{hand.board.map((c, i) => <MiniCard key={i} card={c} />)}</div>
        ) : (
          <span className="rounded bg-bg-surface px-2 py-1 text-[10px] font-medium text-text-muted">Preflop</span>
        )}
      </div>
      <p className="mt-2 text-xs leading-snug text-text-secondary">{hand.desc}</p>
    </div>
  )
}
