import type { ReactNode } from 'react'
import { Avatar } from '@/components/common/ui'
import { LpBadge } from '@/components/leaderboard/LpBadge'
import type { LLParticipant } from '@/types/ll'

// One eliminated player in the Last Longer standings. Readable on the dark theme:
// the row no longer dims to 60% opacity (which washed out the name + points), and the
// muted greys are lifted to primary/secondary. The strikethrough name + finish-place
// medal + "busted" label still clearly convey the "out" state.
export function BustedRow({ p, medalLabel, lpPoints, canManage, onProfile, action }: {
  p: LLParticipant
  medalLabel: string
  lpPoints?: number
  canManage: boolean
  onProfile: () => void
  /** Host-only trailing control (e.g. Reinstate). */
  action?: ReactNode
}) {
  const label = p.finishPos === 1 ? 'winner 🏆' : p.bustedAgo ? `busted ${p.bustedAgo}` : 'out'
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-bg-card px-3 py-2">
      <span className="w-6 text-center text-sm font-bold text-text-secondary">{medalLabel}</span>
      <button type="button" onClick={onProfile} disabled={!canManage} className="flex min-w-0 flex-1 items-center gap-2.5 text-left enabled:cursor-pointer">
        <Avatar name={p.name} color={p.avatarColor} size={28} />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary line-through">{p.name}</span>
      </button>
      {lpPoints ? <LpBadge points={lpPoints} /> : null}
      <span className="shrink-0 text-[11px] font-medium text-text-secondary">{label}</span>
      {action}
    </div>
  )
}
