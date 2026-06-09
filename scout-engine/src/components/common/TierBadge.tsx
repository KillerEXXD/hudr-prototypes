import { CheckCircle2, AlertTriangle, CircleHelp } from 'lucide-react'
import type { Tier } from '@/engine'
import { TIER_META } from '@/engine'
import { cn } from '@/lib/utils'

const ICONS = { RELIABLE: CheckCircle2, TENTATIVE: AlertTriangle, NOISE: CircleHelp }
const STYLES: Record<Tier, string> = {
  RELIABLE: 'text-tier-reliable bg-tier-reliable/10 border-tier-reliable/25',
  TENTATIVE: 'text-tier-tentative bg-tier-tentative/10 border-tier-tentative/25',
  NOISE: 'text-tier-noise bg-tier-noise/10 border-tier-noise/25',
}

/** Reliability tier chip. `plain` shows friendly copy, otherwise the pro label. */
export default function TierBadge({ tier, plain = false, withOpps, className }: {
  tier: Tier; plain?: boolean; withOpps?: number; className?: string
}) {
  const Icon = ICONS[tier]
  const meta = TIER_META[tier]
  return (
    <span
      title={meta.note + (withOpps != null ? ` (${withOpps} opportunities)` : '')}
      className={cn('inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold', STYLES[tier], className)}
    >
      <Icon className="h-3 w-3" />
      {plain ? meta.short : meta.label}
      {withOpps != null && <span className="nums opacity-70">·{withOpps}</span>}
    </span>
  )
}
