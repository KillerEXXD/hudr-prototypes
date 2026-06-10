import { Clapperboard } from 'lucide-react'
import type { SampleHand as SampleHandType } from '@/engine'
import MiniCard from '@/components/common/MiniCard'
import HandViewerButton from './HandViewer'
import { cn } from '@/lib/utils'

// "Pulled from real hands, not invented" — the spec's sample-hand illustration.
// Each opens the shared HandViewer (YouTube clip ⇆ replayer).
export default function SampleHand({ hand, className }: { hand: SampleHandType; className?: string }) {
  const handNumber = parseInt(hand.label.replace(/\D/g, ''), 10) || 0
  return (
    <div className={cn('rounded-lg border border-border/70 bg-bg-secondary/60 p-3', className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">
          <Clapperboard className="h-3.5 w-3.5" /> Real hand · {hand.label}
        </div>
        <HandViewerButton label="View" hand={{ handNumber, title: hand.desc, board: hand.board, note: hand.desc, hasReplay: true }} />
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
