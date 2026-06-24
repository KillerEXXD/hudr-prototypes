import { useNavigate } from 'react-router-dom'
import { GameAppShell, GameRow, FinishedRow } from '@/components/apps/GameAppShell'
import { APP_REGISTRY } from '@/games/appRegistry'

const SQ = APP_REGISTRY.find((a) => a.id === 'squares')!

/**
 * Squares game-app — lists Squares boards (registration / live / finished)
 * filtered from useUnifiedGames(). Rows tap into the existing
 * `/squares/:id` detail page.
 */
export function SquaresPage() {
  const navigate = useNavigate()
  return (
    <GameAppShell
      app={SQ}
      renderRow={(g) => {
        if (g.type !== 'football_squares') return null
        const sq = g.sq
        if (g.phase === 'closed') {
          // Top earner across periods is our "champion" line.
          const pool = sq.stake * sq.claimedCount
          const totals = new Map<string, number>()
          for (const p of sq.periods) {
            if (!p.winnerUserId || p.homeScore == null) continue
            totals.set(p.winnerUserId, (totals.get(p.winnerUserId) ?? 0) + Math.round((pool * p.pct) / 100))
          }
          const top = [...totals.entries()].sort((a, b) => b[1] - a[1])[0]
          const name = top ? (sq.cells.find((c) => c.userId === top[0])?.name ?? sq.participants.find((p) => p.userId === top[0])?.name) : undefined
          return (
            <FinishedRow
              key={g.id}
              g={g}
              app={SQ}
              onOpen={() => navigate(`/squares/${g.id}`)}
              championName={name}
              championAmount={top?.[1]}
            />
          )
        }
        return (
          <GameRow
            key={g.id}
            g={g}
            app={SQ}
            onOpen={() => navigate(`/squares/${g.id}`)}
            extra={g.phase === 'live'
              ? `Q${(sq.periods.filter((p) => p.homeScore != null).length)} scored`
              : `${sq.claimedCount}/100 squares claimed`}
          />
        )
      }}
      howItWorks={
        <>
          Players claim cells on a 10×10 board. When the host locks the
          board, digits are assigned to the rows and columns. Whoever
          owns the square at the matching last-digit of each period's
          score wins the period payout. Final period typically pays the
          most — clubs set the per-period split when they create the game.
        </>
      }
    />
  )
}
