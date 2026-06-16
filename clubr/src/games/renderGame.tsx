import { ContestRow } from '@/pages/FantasyPage'
import { GameRow } from '@/pages/LastLongerPage'
import { SquaresRow } from '@/components/squares/SquaresRow'
import type { UnifiedGame } from '@/games/useUnifiedGames'

// Single place that maps a unified game item → its card. Used by the Games
// feed and the club's games section so every surface renders a type the same
// way. Adding a game type = one more case here (plus its registry entry).
export function renderUnifiedGame(g: UnifiedGame) {
  switch (g.type) {
    case 'ft_fantasy': return <ContestRow key={`ft_${g.id}`} c={g.ft} />
    case 'last_longer': return <GameRow key={`ll_${g.id}`} g={g.ll} />
    case 'football_squares': return <SquaresRow key={`sq_${g.id}`} g={g.sq} />
  }
}
