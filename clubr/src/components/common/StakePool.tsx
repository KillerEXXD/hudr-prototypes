import type { ReactNode } from 'react'
import { Ticket, Coins } from 'lucide-react'

// Compact "what's at stake" strip for game cards — buy-in + the live pool it
// builds (stake × entrants), so a member can size up a game before joining.
// `right` holds a trailing slot (e.g. the registration countdown).
export function StakePool({ stake, pool, children, right }: { stake: number; pool: number; children?: ReactNode; right?: ReactNode }) {
  return (
    // Wraps instead of clipping: on a narrow phone the entrants count and the
    // countdown drop to a second line rather than getting truncated. `gap-y`
    // keeps the rows breathing when they wrap.
    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px]">
      <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-bg-surface/60 px-1.5 py-1 font-semibold text-text-secondary" title="Buy-in per entry">
        <Ticket className="h-3 w-3 text-accent-amber" /><span className="font-mono">{stake}</span> buy-in
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-accent-emerald/30 bg-accent-emerald/10 px-1.5 py-1 font-bold text-accent-emerald" title="Current prize pool (buy-in × entrants)">
        <Coins className="h-3 w-3" /><span className="font-mono">{pool.toLocaleString('en-US')}</span> pool
      </span>
      {children && <span className="text-text-muted">{children}</span>}
      {right && <span className="ml-auto shrink-0">{right}</span>}
    </div>
  )
}
