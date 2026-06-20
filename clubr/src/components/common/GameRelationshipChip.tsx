import { Shield, ShieldHalf, CheckCircle2, Eye, UserPlus } from 'lucide-react'
import { Badge, Btn } from './ui'
import type { GameRelationship } from '@/lib/gameRelationship'

/**
 * The relationship chip on a game card (FT Fantasy, Last Longer, Squares):
 * Hosting / Co-host / Playing / Waiting for approval — or an inline **Join**
 * button (sends a request to join right from the card). Renders nothing for
 * 'none'. The Join button stops click propagation so it doesn't also open the card.
 *
 * `alsoPlaying` — when you HOST or CO-host a game you ALSO joined as a player,
 * the card shows the Playing badge too (e.g. "Hosting + Playing" / "Co-host +
 * Playing"), so "you're in this one" is visible on the card. Hosting/Co-host keep
 * the primary slot.
 */
export function GameRelationshipChip({ rel, alsoPlaying, onJoin, joining }: { rel: GameRelationship; alsoPlaying?: boolean; onJoin?: () => void; joining?: boolean }) {
  const playing = <Badge tone="blue"><CheckCircle2 className="h-3 w-3" />Playing</Badge>
  if (rel === 'hosting') return (
    <span className="inline-flex items-center gap-1">
      <Badge tone="green"><Shield className="h-3 w-3" />Hosting</Badge>
      {alsoPlaying && playing}
    </span>
  )
  if (rel === 'cohost') return (
    <span className="inline-flex items-center gap-1">
      <Badge tone="purple"><ShieldHalf className="h-3 w-3" />Co-host</Badge>
      {alsoPlaying && playing}
    </span>
  )
  if (rel === 'playing') return playing
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
