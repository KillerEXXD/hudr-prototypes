import type { ReactNode } from 'react'
import { Ticket, Coins } from 'lucide-react'

// Compact "what's at stake" strip for game cards — buy-in + the live pool it
// builds (stake × entrants), so a member can size up a game before joining.
// `right` holds a trailing slot (e.g. the registration countdown).
export function StakePool({ stake, pool, children, right }: { stake: number; pool: number; children?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[12px]">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-gold/35 bg-bg-surface/60 px-2.5 py-1 font-bold text-accent-gold pill" title="Buy-in per entry">
        <Ticket className="h-3.5 w-3.5" /><span className="font-mono text-text-primary">{stake}</span> <span className="font-medium text-text-muted">buy-in</span>
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-emerald/35 bg-bg-surface/60 px-2.5 py-1 font-bold text-accent-emerald pill" title="Current prize pool (buy-in × entrants)">
        <Coins className="h-3.5 w-3.5" /><span className="font-mono text-text-primary">{pool.toLocaleString('en-US')}</span> <span className="font-medium text-text-muted">pool</span>
      </span>
      {children && <span className="truncate text-text-muted">{children}</span>}
      {right && <span className="ml-auto shrink-0">{right}</span>}
    </div>
  )
}
