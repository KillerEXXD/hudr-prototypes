import type { TypingResult } from '@/engine'
import { STAT_DEFS } from '@/engine'
import TierBadge from '@/components/common/TierBadge'

// Pro-mode "why this label" trace — shows the exact boundary matched and the
// typing inputs with their tiers. NOISE inputs are excluded from typing.
export default function BoundaryTrace({ typing }: { typing: TypingResult }) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-bg-secondary/60 p-3">
        <div className="text-[11px] font-medium uppercase tracking-wide text-text-muted">Matched boundary</div>
        <div className="mt-1 font-mono text-sm text-text-primary">
          {typing.matchedBoundary ?? 'No archetype boundary matched cleanly → UNCLASSIFIED'}
        </div>
      </div>
      <div>
        <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">Typing inputs (NOISE excluded)</div>
        <div className="space-y-1.5">
          {typing.inputsUsed.map((i) => (
            <div key={i.key} className="flex items-center justify-between gap-2 rounded-md bg-bg-surface/60 px-2.5 py-1.5">
              <span className="text-xs text-text-secondary">{STAT_DEFS[i.key].label}</span>
              <span className="flex items-center gap-2">
                <span className="nums text-xs font-semibold text-text-primary">{i.value}{STAT_DEFS[i.key].unit === '%' ? '%' : ''}</span>
                <TierBadge tier={i.tier} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
