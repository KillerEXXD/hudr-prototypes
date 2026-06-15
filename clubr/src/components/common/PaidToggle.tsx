import { cn } from '@/lib/utils/cn'

// Subtle green/grey toggle — no label/heading. Tracks "paid" per game entry.
// Host/co-host: editable. Everyone else: read-only (sees the state, can't change).
export function PaidToggle({ paid, editable, onToggle }: { paid: boolean; editable: boolean; onToggle?: () => void }) {
  const track = cn('relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors', paid ? 'bg-accent-emerald' : 'bg-bg-surface border border-border')
  const knob = cn('inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform', paid ? 'translate-x-[18px]' : 'translate-x-0.5')
  const title = paid ? 'Paid' : 'Unpaid'
  if (!editable) return <span className={track} title={title} aria-label={title}><span className={knob} /></span>
  return (
    <button type="button" onClick={onToggle} className={cn(track, 'cursor-pointer')} title={`${title} — tap to toggle`} aria-label={title}>
      <span className={knob} />
    </button>
  )
}
