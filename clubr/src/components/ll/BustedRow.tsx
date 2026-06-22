import type { ReactNode } from 'react'
import { Avatar } from '@/components/common/ui'
import { LpBadge } from '@/components/leaderboard/LpBadge'
import type { LLParticipant } from '@/types/ll'

const ordinal = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`
const fmtStakes = (n: number) => n.toLocaleString('en-US')

// One finished player in the Last Longer standings. We do NOT strike out the name (a
// player who finished earned their place) — the result is shown as their finish
// position instead: "winner 🏆"/"chop 🤝" for 1st, "finished 3rd" otherwise. On a
// completed game we also show what they won from the pool (+N Stakes) and their LP.
export function BustedRow({ p, medalLabel, lpPoints, lpReason, amountWon, chop, canManage, onProfile, action }: {
  p: LLParticipant
  medalLabel: string
  lpPoints?: number
  /** When LP is 0 because the field was too small, the explanation behind a pulsing "?". */
  lpReason?: string
  /** Stakes won from the pool (completed games). Hidden when 0. */
  amountWon?: number
  /** This finisher is a joint winner of a chop (shown as "chop 🤝"). */
  chop?: boolean
  canManage: boolean
  onProfile: () => void
  /** Host-only trailing control (e.g. Reinstate). */
  action?: ReactNode
}) {
  const label = p.finishPos === 1
    ? (chop ? 'chop 🤝' : 'winner 🏆')
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
      <div className="flex shrink-0 flex-col items-end gap-0.5 leading-none">
        {amountWon ? <span className="font-mono text-xs font-bold text-accent-emerald">+{fmtStakes(amountWon)} Stakes</span> : null}
        <div className="flex items-center gap-1.5">
          <LpBadge points={lpPoints} reason={lpReason} />
          <span className="text-[11px] font-medium text-text-secondary">{label}</span>
        </div>
      </div>
      {action}
    </div>
  )
}
