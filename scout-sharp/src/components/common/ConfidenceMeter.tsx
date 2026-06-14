import { cn } from '@/lib/utils'

// Visualises sample strength behind the typing decision (how close the typing
// inputs are to a reliable sample). When the player is UNCLASSIFIED there is no
// archetype to be "confident" in, so the same bar is framed as sample strength —
// this avoids the "Unclassified + 90% confidence" contradiction.
export default function ConfidenceMeter({ value, plain = false, unclassified = false, className }: {
  value: number; plain?: boolean; unclassified?: boolean; className?: string
}) {
  const pct = Math.round(value * 100)
  const level = pct >= 80 ? 'high' : pct >= 50 ? 'medium' : 'low'
  const color = level === 'high' ? 'bg-accent-emerald' : level === 'medium' ? 'bg-accent-amber' : 'bg-accent-red'
  const label = plain
    ? (level === 'high' ? 'Strong read' : level === 'medium' ? 'Early read' : 'First impression')
    : unclassified ? `${pct}% sample` : `${pct}% confidence`
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-bg-surface">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${Math.max(6, pct)}%` }} />
      </div>
      <span className="text-[11px] font-medium text-text-secondary">{label}</span>
    </div>
  )
}
