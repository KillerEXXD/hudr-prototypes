import { ContestRow } from '@/pages/FantasyPage'
import { GameRow } from '@/pages/LastLongerPage'
import { SquaresRow } from '@/components/squares/SquaresRow'
import type { UnifiedGame } from '@/games/useUnifiedGames'
import type { MemberRole } from '@/types'

// Single place that maps a unified game item → its card. Used by the Games
// feed and the club's games section so every surface renders a type the same
// way. Adding a game type = one more case here (plus its registry entry).
// `showType` surfaces the prominent game-type badge — pass it when the list
// mixes types (the "All" filter) so each card is identifiable at a glance.
// `clubRole` shows the player's standing in the game's club (Discover) —
// Owner / Co-host / Member.
export function renderUnifiedGame(g: UnifiedGame, showType = false, clubRole?: MemberRole) {
  switch (g.type) {
    case 'ft_fantasy': return <ContestRow key={`ft_${g.id}`} c={g.ft} showType={showType} clubRole={clubRole} />
    case 'last_longer': return <GameRow key={`ll_${g.id}`} g={g.ll} showType={showType} clubRole={clubRole} />
    case 'football_squares': return <SquaresRow key={`sq_${g.id}`} g={g.sq} showType={showType} clubRole={clubRole} />
  }
}
