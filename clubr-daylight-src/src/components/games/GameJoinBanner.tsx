import { useLocation } from 'react-router-dom'
import { Check, PartyPopper } from 'lucide-react'
import { Card } from '@/components/common/ui'

/** Shown at the top of a game page when arrived via a game invite link
 *  (state.gameJoin set by useApplyInviteOnLogin): confirms the request or welcomes
 *  someone already in. Transient — clears on the next navigation. */
export function GameJoinBanner() {
  const gameJoin = (useLocation().state as { gameJoin?: 'game-open' | 'game-requested' } | null)?.gameJoin
  if (gameJoin === 'game-requested') {
    return (
      <Card className="mb-3 flex items-start gap-2.5 border-accent-emerald/30 bg-accent-emerald/10">
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-emerald" />
        <p className="text-xs leading-snug text-text-secondary"><span className="font-bold text-text-primary">Request sent.</span> The game host has been notified — you'll be able to play once they admit you.</p>
      </Card>
    )
  }
  if (gameJoin === 'game-open') {
    return (
      <Card className="mb-3 flex items-start gap-2.5 border-accent-emerald/30 bg-accent-emerald/10">
        <PartyPopper className="mt-0.5 h-4 w-4 shrink-0 text-accent-emerald" />
        <p className="text-xs leading-snug text-text-secondary"><span className="font-bold text-text-primary">You're in this game.</span> Jump back in below.</p>
      </Card>
    )
  }
  return null
}
