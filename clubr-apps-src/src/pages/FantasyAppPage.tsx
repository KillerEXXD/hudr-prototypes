import { useNavigate } from 'react-router-dom'
import { GameAppShell, GameRow, FinishedRow } from '@/components/apps/GameAppShell'
import { APP_REGISTRY } from '@/games/appRegistry'

const FANTASY = APP_REGISTRY.find((a) => a.id === 'fantasy')!

/**
 * Fantasy game-app — list of FT contests filtered from useUnifiedGames().
 * Rows tap straight into the existing `/fantasy/:id` detail page (which is
 * the Golden Real ContestDetailPage, already wired to the mock store).
 */
export function FantasyAppPage() {
  const navigate = useNavigate()
  return (
    <GameAppShell
      app={FANTASY}
      renderRow={(g) => {
        if (g.type !== 'ft_fantasy') return null
        const c = g.ft
        if (g.phase === 'closed') {
          const champ = c.entries[0]
          return (
            <FinishedRow
              key={g.id}
              g={g}
              app={FANTASY}
              onOpen={() => navigate(`/fantasy/${g.id}`)}
              championName={champ?.name}
              championAmount={champ && c.stake ? Math.round(c.stake * c.entries.length * 0.5) : undefined}
            />
          )
        }
        const entries = c.entries.filter((e) => e.status !== 'pending').length
        return (
          <GameRow
            key={g.id}
            g={g}
            app={FANTASY}
            onOpen={() => navigate(`/fantasy/${g.id}`)}
            extra={`${entries} drafted · ${c.format === 'winner_takes_all' ? 'WTA' : 'Points payout'}`}
          />
        )
      }}
      howItWorks={
        <>
          Pick a final-table to "draft" — assemble a 4-player stack within
          your budget, watch the live final unfold, and score points as your
          picks finish in the money. Standings settle the moment the host
          confirms the finishing order; payouts split the pool 50/30/20
          (or 100% in winner-takes-all).
        </>
      }
    />
  )
}
