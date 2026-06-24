import { useNavigate } from 'react-router-dom'
import { GameAppShell, GameRow, FinishedRow } from '@/components/apps/GameAppShell'
import { APP_REGISTRY } from '@/games/appRegistry'

const LL = APP_REGISTRY.find((a) => a.id === 'last-longer')!

/**
 * Last Longer game-app — lists LL games (registration / live / finished)
 * filtered from useUnifiedGames(). Rows tap into the existing
 * `/lastlonger/:id` detail page.
 */
export function LastLongerAppPage() {
  const navigate = useNavigate()
  return (
    <GameAppShell
      app={LL}
      renderRow={(g) => {
        if (g.type !== 'last_longer') return null
        const ll = g.ll
        if (g.phase === 'closed') {
          const winner = ll.participants.find((p) => p.finishPos === 1)
          const entrants = ll.participants.length
          return (
            <FinishedRow
              key={g.id}
              g={g}
              app={LL}
              onOpen={() => navigate(`/lastlonger/${g.id}`)}
              championName={winner?.name ?? ll.winnerName}
              championAmount={winner ? ll.stake * entrants : undefined}
            />
          )
        }
        const active = ll.participants.filter((p) => p.status === 'active').length
        return (
          <GameRow
            key={g.id}
            g={g}
            app={LL}
            onOpen={() => navigate(`/lastlonger/${g.id}`)}
            extra={g.phase === 'live' ? `${active} still in` : `${active} joined`}
          />
        )
      }}
      howItWorks={
        <>
          Everyone buys in, plays the tournament IRL, and the LAST player
          to bust wins. The app tracks who's in and who's busted so the
          host can run the table without spreadsheets. Settles instantly
          when the winner is confirmed; pool splits per your club's payout
          schedule.
        </>
      }
    />
  )
}
