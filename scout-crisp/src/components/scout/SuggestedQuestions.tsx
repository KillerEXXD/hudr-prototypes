import { Flame } from 'lucide-react'
import type { SuggestedQuestion } from '@/lib/api/domain'
import { cn, fmtCount } from '@/lib/utils'

// Reusable list of popular questions with "asked N times" social-proof counts.
// Used in the empty state, the input-bar popover, and the after-reply expander.
export default function SuggestedQuestions({ questions, onPick, pulseIndex, className }: {
  questions: SuggestedQuestion[]
  onPick: (text: string) => void
  pulseIndex?: number
  className?: string
}) {
  return (
    <div className={cn('grid gap-1.5', className)}>
      {questions.map((q, i) => (
        <button
          key={q.text}
          onClick={() => onPick(q.text)}
          className={cn(
            'flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all cursor-pointer',
            pulseIndex === i
              ? 'border-accent-amber/50 bg-accent-amber/10 text-text-primary scale-[1.01]'
              : 'border-border bg-bg-surface/60 text-text-secondary hover:text-text-primary hover:border-border-light',
          )}
        >
          <span className="min-w-0 flex-1">{q.text}</span>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-bg-card px-1.5 py-0.5 text-[10px] font-semibold text-text-muted" title={`${q.askedCount.toLocaleString()} players asked this`}>
            <Flame className="h-3 w-3 text-accent-amber" /> {fmtCount(q.askedCount)}
          </span>
        </button>
      ))}
    </div>
  )
}
