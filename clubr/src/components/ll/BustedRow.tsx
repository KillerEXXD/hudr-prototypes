import type { ReactNode } from 'react'
import { Avatar } from '@/components/common/ui'
import { LpBadge } from '@/components/leaderboard/LpBadge'
import type { LLParticipant } from '@/types/ll'

const ordinal = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`

// One finished player in the Last Longer standings. We do NOT strike out the name (a
// player who finished earned their place) — the result is shown as their finish
// position instead: "winner 🏆" for 1st, "finished 3rd" otherwise. Names/points stay at
// readable primary/secondary brightness; the finish-place medal leads the row.
export function BustedRow({ p, medalLabel, lpPoints, canManage, onProfile, action }: {
  p: LLParticipant
  medalLabel: string
  lpPoints?: number
  canManage: boolean
  onProfile: () => void
  /** Host-only trailing control (e.g. Reinstate). */
  action?: ReactNode
}) {
  const label = p.finishPos === 1
    ? 'winner 🏆'
    : typeof p.finishPos === 'number'
      ? `finished ${ordinal(p.finishPos)}`
      : 'out'
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-bg-card px-3 py-2">
      <span className="w-6 text-center text-sm font-bold text-text-secondary">{medalLabel}</span>
      <button type="button" onClick={onProfile} disabled={!canManage} className="flex min-w-0 flex-1 items-center gap-2.5 text-left enabled:cursor-pointer">
        <Avatar name={p.name} color={p.avatarColor} size={28} />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">{p.name}</span>
      </button>
      {lpPoints ? <LpBadge points={lpPoints} /> : null}
      <span className="shrink-0 text-[11px] font-medium text-text-secondary">{label}</span>
      {action}
    </div>
  )
}
