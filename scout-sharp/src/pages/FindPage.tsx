import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Trophy, Users, Loader2, ArrowRight } from 'lucide-react'
import { useMode } from '@/contexts/ModeContext'
import { useTournaments, usePlayers, useProfiles, careerFilters } from '@/hooks'
import TournamentListItem from '@/components/scout/TournamentListItem'
import PlayerListItem from '@/components/scout/PlayerListItem'

function SectionHeader({ icon, title, count, seeAll }: { icon: React.ReactNode; title: string; count: number; seeAll: string }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="text-accent-blue">{icon}</span>
      <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      <span className="nums text-xs text-text-muted">{count}</span>
      <Link to={seeAll} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-accent-blue hover:underline cursor-pointer">
        See all <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  )
}

const PREVIEW = 3

export default function FindPage() {
  const { isPro } = useMode()
  const [q, setQ] = useState('')

  const { data: tournaments = [], isLoading: tLoading } = useTournaments()
  const { data: players = [], isLoading: pLoading } = usePlayers()
  const { profiles } = useProfiles(players.map((p) => p.id), careerFilters())
  const profileByPlayer = useMemo(() => Object.fromEntries(profiles.map((p) => [p.playerId, p])), [profiles])

  const searching = q.trim().length > 0
  const tournamentMatches = useMemo(
    () => tournaments.filter((t) => (t.name + t.event + t.venue).toLowerCase().includes(q.toLowerCase())),
    [tournaments, q],
  )
  const playerMatches = useMemo(
    () => players.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())),
    [players, q],
  )

  // Idle: lead with live tournaments. Searching: show matches.
  const tList = searching ? tournamentMatches : [...tournaments].sort((a, b) => Number(b.isLive) - Number(a.isLive))
  const pList = searching ? playerMatches : players

  return (
    <div className="animate-fade-up">
      <h1 className="text-xl font-bold tracking-tight">Scout the table</h1>
      <p className="mb-3 mt-0.5 text-sm text-text-secondary">
        {isPro ? 'Deterministic stats, archetypes & exploits — every read gated by sample size.' : 'Find any tournament or player and get a plain-English read.'}
      </p>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tournaments or players…"
          className="h-11 w-full rounded-xl border border-border bg-bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue"
        />
      </div>

      {tLoading || pLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : (
        <div className="space-y-5">
          <section>
            <SectionHeader icon={<Trophy className="h-4 w-4" />} title={searching ? 'Tournaments' : 'Live & recent'} count={tList.length} seeAll="/tournaments" />
            {tList.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border py-6 text-center text-xs text-text-muted">No matching tournaments.</p>
            ) : (
              <div className="space-y-2">
                {tList.slice(0, PREVIEW).map((t) => <TournamentListItem key={t.id} tournament={t} />)}
              </div>
            )}
          </section>

          <section>
            <SectionHeader icon={<Users className="h-4 w-4" />} title={searching ? 'Players' : 'Featured players'} count={pList.length} seeAll="/players" />
            {pList.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border py-6 text-center text-xs text-text-muted">No matching players.</p>
            ) : (
              <div className="space-y-2">
                {pList.slice(0, PREVIEW).map((p) => <PlayerListItem key={p.id} player={p} profile={profileByPlayer[p.id]} plain={!isPro} />)}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
