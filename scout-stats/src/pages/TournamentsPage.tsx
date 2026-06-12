import { useMemo, useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { useTournaments } from '@/hooks'
import TournamentListItem from '@/components/scout/TournamentListItem'

export default function TournamentsPage() {
  const [q, setQ] = useState('')
  const { data: tournaments = [], isLoading } = useTournaments()

  const matches = useMemo(
    () => tournaments.filter((t) => (t.name + t.event + t.venue).toLowerCase().includes(q.toLowerCase())),
    [tournaments, q],
  )

  return (
    <div className="animate-fade-up">
      <h1 className="text-xl font-bold tracking-tight">Tournaments</h1>
      <p className="mb-3 mt-0.5 text-sm text-text-secondary">Every event we've analysed — tap one to scout the table.</p>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tournaments…"
          className="h-11 w-full rounded-xl border border-border bg-bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : matches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-text-muted">No matches.</div>
      ) : (
        <div className="space-y-2">
          {matches.map((t) => <TournamentListItem key={t.id} tournament={t} />)}
        </div>
      )}
    </div>
  )
}
