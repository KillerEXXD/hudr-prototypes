import { cn } from '@/lib/utils/cn'
import { Processing } from './ui'

// Subtle green/grey toggle — no label/heading. Tracks "paid" per game entry.
// Host/co-host: editable. Everyone else: read-only (sees the state, can't change).
// `busy` shows the suit indicator on the track while the paid/unpaid mutation runs.
export function PaidToggle({ paid, editable, onToggle, busy }: { paid: boolean; editable: boolean; onToggle?: () => void; busy?: boolean }) {
  const track = cn('relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors', paid ? 'bg-accent-emerald' : 'bg-bg-surface border border-border')
  const knob = cn('inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform', paid ? 'translate-x-[18px]' : 'translate-x-0.5')
  const title = paid ? 'Paid' : 'Unpaid'
  if (!editable) return <span className={track} title={title} aria-label={title}><span className={knob} /></span>
  return (
    <button type="button" onClick={onToggle} disabled={busy} aria-busy={busy} className={cn(track, busy ? 'cursor-wait' : 'cursor-pointer')} title={`${title} — tap to toggle`} aria-label={title}>
      {busy ? <span className="absolute inset-0 flex items-center justify-center"><Processing size={11} count={1} /></span> : <span className={knob} />}
    </button>
  )
}
