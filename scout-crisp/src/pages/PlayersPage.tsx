import { useMemo, useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { useMode } from '@/contexts/ModeContext'
import { usePlayers, useProfiles, careerFilters } from '@/hooks'
import PlayerListItem from '@/components/scout/PlayerListItem'

export default function PlayersPage() {
  const { isPro } = useMode()
  const [q, setQ] = useState('')
  const { data: players = [], isLoading } = usePlayers()
  const { profiles } = useProfiles(players.map((p) => p.id), careerFilters())
  const profileByPlayer = useMemo(() => Object.fromEntries(profiles.map((p) => [p.playerId, p])), [profiles])

  const matches = useMemo(
    () => players.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())),
    [players, q],
  )

  return (
    <div className="animate-fade-up">
      <h1 className="text-xl font-bold tracking-tight">Players</h1>
      <p className="mb-3 mt-0.5 text-sm text-text-secondary">
        {isPro ? 'Archetype & leak count from career stats — tap for the full report.' : 'Tap any player for a plain-English read on how to beat them.'}
      </p>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search players…"
          className="h-11 w-full rounded-xl border border-border bg-bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : matches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-text-muted">No matches.</div>
      ) : (
        <div className="space-y-2">
          {matches.map((p) => <PlayerListItem key={p.id} player={p} profile={profileByPlayer[p.id]} plain={!isPro} />)}
        </div>
      )}
    </div>
  )
}
