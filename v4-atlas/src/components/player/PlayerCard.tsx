import { Link } from 'react-router-dom'
import type { Player } from '@/types'
import { Card } from '@/components/ui'
import PlayerAvatar from './PlayerAvatar'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils'

interface PlayerCardProps {
  player: Player
  className?: string
}

export default function PlayerCard({ player, className }: PlayerCardProps) {
  const statusVariant = player.status === 'winner' ? 'success' : player.status === 'runner-up' ? 'warning' : 'muted'

  return (
    <Link to={`/players/${player.id}`}>
      <Card className={cn('flex items-center gap-3 hover:border-border-light transition-colors', className)}>
        <PlayerAvatar initials={player.initials} color={player.color} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-primary truncate">{player.name}</span>
            <span className="text-sm">{player.flag}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant={statusVariant}>#{player.finish}</Badge>
            <span className="text-xs text-text-muted">{player.hands} hands</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
