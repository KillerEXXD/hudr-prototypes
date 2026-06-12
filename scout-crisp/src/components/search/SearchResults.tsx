import type { Player, Tournament } from '@/types'
import { PlayerCard } from '@/components/player'
import { TournamentCard } from '@/components/tournament'

interface SearchResultsProps {
  players: Player[]
  tournaments: Tournament[]
}

export default function SearchResults({ players, tournaments }: SearchResultsProps) {
  if (players.length === 0 && tournaments.length === 0) {
    return <p className="text-center text-text-muted text-sm py-8">No results found</p>
  }

  return (
    <div className="space-y-4">
      {players.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Players</h3>
          <div className="space-y-2">
            {players.map(p => <PlayerCard key={p.id} player={p} />)}
          </div>
        </div>
      )}
      {tournaments.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Tournaments</h3>
          <div className="space-y-2">
            {tournaments.map(t => <TournamentCard key={t.id} tournament={t} />)}
          </div>
        </div>
      )}
    </div>
  )
}
