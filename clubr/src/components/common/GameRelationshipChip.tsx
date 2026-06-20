import { Shield, CheckCircle2, Eye, UserPlus } from 'lucide-react'
import { Badge, Btn } from './ui'
import type { GameRelationship } from '@/lib/gameRelationship'

/**
 * The relationship chip on a game card (FT Fantasy, Last Longer, Squares):
 * Hosting / Playing / Waiting for approval — or an inline **Join** button (sends
 * a request to join right from the card). Renders nothing for 'none'. The Join
 * button stops click propagation so it doesn't also open the card.
 *
 * `alsoPlaying` — a host who ALSO joined their own game gets BOTH badges
 * (Hosting + Playing), so "you're in this one" is visible on the card too, not
 * just the club-detail Hosting list. Hosting keeps the primary slot.
 */
export function GameRelationshipChip({ rel, alsoPlaying, onJoin, joining }: { rel: GameRelationship; alsoPlaying?: boolean; onJoin?: () => void; joining?: boolean }) {
  if (rel === 'hosting') return (
    <span className="inline-flex items-center gap-1">
      <Badge tone="green"><Shield className="h-3 w-3" />Hosting</Badge>
      {alsoPlaying && <Badge tone="blue"><CheckCircle2 className="h-3 w-3" />Playing</Badge>}
    </span>
  )
  if (rel === 'playing') return <Badge tone="blue"><CheckCircle2 className="h-3 w-3" />Playing</Badge>
  if (rel === 'waiting') return <Badge tone="amber"><Eye className="h-3 w-3" />Waiting for approval</Badge>
  if (rel === 'join') {
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <Btn size="sm" variant="secondary" loading={joining} onClick={onJoin}><UserPlus className="h-3.5 w-3.5" />Join</Btn>
      </div>
    )
  }
  return null
}
