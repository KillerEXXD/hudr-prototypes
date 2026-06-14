import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, Users, Trophy, Loader2 } from 'lucide-react'
import { useMode } from '@/contexts/ModeContext'
import { useCurrentUser, usePlayers, useTournaments, useProfiles, careerFilters } from '@/hooks'
import PlayerListItem from '@/components/scout/PlayerListItem'
import TournamentListItem from '@/components/scout/TournamentListItem'

export default function SavedPage() {
  const { isPro } = useMode()
  const { data: user, isLoading: uLoading } = useCurrentUser()
  const { data: players = [] } = usePlayers()
  const { data: tournaments = [] } = useTournaments()
  const { profiles } = useProfiles(players.map((p) => p.id), careerFilters())
  const profByPlayer = useMemo(() => Object.fromEntries(profiles.map((p) => [p.playerId, p])), [profiles])

  const savedPlayers = useMemo(
    () => players.filter((p) => user?.savedPlayerIds.includes(p.id)),
    [players, user],
  )
  const savedTournaments = useMemo(
    () => tournaments.filter((t) => user?.savedTournamentIds.includes(t.id)),
    [tournaments, user],
  )

  if (uLoading) {
    return <div className="flex items-center justify-center gap-2 py-16 text-sm text-text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
  }

  const empty = savedPlayers.length === 0 && savedTournaments.length === 0

  return (
    <div className="animate-fade-up">
      <h1 className="text-xl font-bold tracking-tight">Saved</h1>
      <p className="mb-4 mt-0.5 text-sm text-text-secondary">Your favourites & watchlist — players and events you're tracking.</p>

      {empty ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-12 text-center">
          <Bookmark className="mb-2 h-6 w-6 text-text-muted" />
          <p className="text-sm text-text-muted">Nothing saved yet.</p>
          <Link to="/players" className="mt-3 text-sm font-semibold text-accent-blue hover:underline cursor-pointer">Browse players →</Link>
        </div>
      ) : (
        <div className="space-y-5">
          {savedPlayers.length > 0 && (
            <section>
              <div className="mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-accent-blue" />
                <h2 className="text-sm font-semibold text-text-primary">Players</h2>
                <span className="nums text-xs text-text-muted">{savedPlayers.length}</span>
              </div>
              <div className="space-y-2">
                {savedPlayers.map((p) => <PlayerListItem key={p.id} player={p} profile={profByPlayer[p.id]} plain={!isPro} />)}
              </div>
            </section>
          )}
          {savedTournaments.length > 0 && (
            <section>
              <div className="mb-2 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-accent-amber" />
                <h2 className="text-sm font-semibold text-text-primary">Tournaments</h2>
                <span className="nums text-xs text-text-muted">{savedTournaments.length}</span>
              </div>
              <div className="space-y-2">
                {savedTournaments.map((t) => <TournamentListItem key={t.id} tournament={t} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
