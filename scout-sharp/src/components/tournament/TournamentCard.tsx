import { Link } from 'react-router-dom'
import type { Tournament } from '@/types'
import { Card, Badge } from '@/components/ui'
import { fmtChips } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface TournamentCardProps {
  tournament: Tournament
  className?: string
}

export default function TournamentCard({ tournament, className }: TournamentCardProps) {
  const statusVariant = tournament.status === 'live' ? 'danger' : tournament.status === 'completed' ? 'success' : 'muted'

  return (
    <Link to={`/tournaments/${tournament.id}`}>
      <Card className={cn('space-y-2 hover:border-border-light transition-colors', className)}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text-primary text-sm truncate">{tournament.name}</h3>
          <Badge variant={statusVariant}>{tournament.status}</Badge>
        </div>
        <div className="text-xs text-text-muted">{tournament.event} &middot; {tournament.venue}</div>
        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <span>{tournament.players} players</span>
          <span>{tournament.hands} hands</span>
          <span className="font-medium text-accent-amber">{fmtChips(tournament.prize)}</span>
        </div>
        {tournament.duration && (
          <div className="text-xs text-text-muted">{tournament.duration}</div>
        )}
      </Card>
    </Link>
  )
}
