import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { Player } from '@/lib/api/domain'
import type { PlayerProfile } from '@/engine'
import PlayerAvatar from '@/components/player/PlayerAvatar'
import ArchetypeBadge from '@/components/common/ArchetypeBadge'

// One player row — shared by Discover, the Players index, and Saved.
// `profile` is optional: when present, shows the archetype badge + leak count.
export default function PlayerListItem({ player: p, profile: prof, plain }: {
  player: Player
  profile?: PlayerProfile
  plain: boolean
}) {
  return (
    <Link
      to={`/player/${p.id}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-bg-card p-3 transition-colors hover:border-border-light hover:bg-bg-surface cursor-pointer"
    >
      <PlayerAvatar initials={p.initials} color={p.color} photoUrl={p.photoUrl} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-semibold text-text-primary">{p.name} <span aria-hidden>{p.flag}</span></h3>
        </div>
        <div className="mt-1 flex items-center gap-2">
          {prof && <ArchetypeBadge archetype={prof.typing.archetype} plain={plain} size="sm" />}
          {prof && prof.exploits.length > 0 && (
            <span className="text-[11px] text-text-muted nums">{prof.exploits.length} leak{prof.exploits.length > 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
    </Link>
  )
}
