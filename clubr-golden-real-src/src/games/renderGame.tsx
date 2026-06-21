import { FeltGameCard } from '@/components/felt/FeltGame'
import { fromFT, fromLL, fromSquares } from '@/lib/arena/unifiedGame'
import { useAuth } from '@/contexts/AuthContext'
import type { UnifiedGame } from '@/games/useUnifiedGames'
import type { MemberRole } from '@/types'

// Single place that maps a unified game item -> its card. Every surface (Games
// feed, club games, Discover) renders the ClubrGo JSX labelled-column card via
// FeltGameCard, by adapting the raw view into the unified ArenaGame shape.
function RenderRow({ g }: { g: UnifiedGame }) {
  const { user } = useAuth()
  const me = user?.id ?? ''
  const a =
    g.type === 'ft_fantasy' ? fromFT(g.ft, me)
    : g.type === 'last_longer' ? fromLL(g.ll, me)
    : fromSquares(g.sq, me)
  return <FeltGameCard g={a} />
}

export function renderUnifiedGame(g: UnifiedGame, _showType = false, _clubRole?: MemberRole) {
  return <RenderRow key={`${g.type}_${g.id}`} g={g} />
}
