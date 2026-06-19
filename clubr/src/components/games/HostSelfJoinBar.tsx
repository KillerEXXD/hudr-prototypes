import { CheckCircle2, UserPlus } from 'lucide-react'
import { Btn } from '@/components/common/ui'
import { useRequestEnter } from '@/hooks/ft'
import { useRequestJoinLL } from '@/hooks/ll'
import { useRequestJoinSquares } from '@/hooks/squares'
import type { UnifiedGame } from '@/games/useUnifiedGames'

/**
 * For the host's own game (the "Hosting" filter on a club): says whether the
 * host is also PLAYING, and — when they aren't, and the game is still joinable —
 * offers an inline self-join. The backend auto-approves a host's own join, so a
 * tap puts them straight into their own game. Renders below the game card.
 */
export function HostSelfJoinBar({ g }: { g: UnifiedGame }) {
  // Hooks must run unconditionally; only the matching one is invoked.
  const ft = useRequestEnter()
  const ll = useRequestJoinLL()
  const sq = useRequestJoinSquares()

  if (g.mine) {
    return (
      <div className="flex items-center gap-1.5 px-1 text-[11px] font-semibold text-accent-emerald">
        <CheckCircle2 className="h-3.5 w-3.5" />You're playing in this one
      </div>
    )
  }
  // A finished game can't be joined — nothing to offer.
  if (g.finished) return null

  const join =
    g.type === 'ft_fantasy' ? () => ft.mutate(g.id)
    : g.type === 'last_longer' ? () => ll.mutate(g.id)
    : () => sq.mutate(g.id)
  const pending = ft.isPending || ll.isPending || sq.isPending

  return (
    <div className="flex items-center justify-between gap-2 px-1">
      <span className="text-[11px] text-text-muted">You host this — you're not playing.</span>
      <Btn size="sm" variant="secondary" loading={pending} onClick={join}><UserPlus className="h-3.5 w-3.5" />Join as player</Btn>
    </div>
  )
}
