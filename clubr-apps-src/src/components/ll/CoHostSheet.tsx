import { Shield } from 'lucide-react'
import { Sheet, Avatar, Badge, Btn, EmptyState, ProcessingOverlay } from '@/components/common/ui'
import { fmtChips } from '@/lib/utils/chipFormat'
import type { LLGameView } from '@/types/ll'

type CoHostMut = {
  isPending: boolean
  variables?: { gameId: string; userId: string }
  mutate: (v: { gameId: string; userId: string }) => void
}

// Host-only sheet to promote/demote co-hosts — replaces the per-row shield so
// the leaderboard rows stay uncluttered and co-hosting is a deliberate act.
// Lists everyone but the host with their chip stack + In/Out status; current
// co-hosts show a badge and a Remove action. Stays open so several can be set.
export function CoHostSheet({ open, onClose, g, assign, remove }: {
  open: boolean; onClose: () => void; g: LLGameView; assign: CoHostMut; remove: CoHostMut
}) {
  const players = g.participants
    .filter((p) => p.userId !== g.hostId)
    .sort((a, b) => (a.status === 'out' ? 1 : 0) - (b.status === 'out' ? 1 : 0) || b.chips - a.chips)

  return (
    <Sheet open={open} onClose={onClose} title="Add a co-host">
      <p className="mb-3 text-xs leading-snug text-text-secondary">Co-hosts help you run the table — admit players, update chips, and bust. Pick anyone below; tap a co-host to remove them.</p>
      {players.length === 0 ? (
        <EmptyState title="No players yet" sub="Players show up here once they've joined the game." />
      ) : (
        <div className="flex flex-col gap-1.5">
          {players.map((p) => {
            const isCo = g.coHostIds.includes(p.userId)
            const adding = assign.isPending && assign.variables?.userId === p.userId
            const removing = remove.isPending && remove.variables?.userId === p.userId
            return (
              <div key={p.userId} className="relative flex items-center gap-2.5 rounded-xl border border-border bg-bg-card px-3 py-2">
                {(adding || removing) && <ProcessingOverlay />}
                <Avatar name={p.name} color={p.avatarColor} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate text-sm font-semibold text-text-primary">{p.name}{isCo && <Badge tone="blue"><Shield className="h-2.5 w-2.5" />Co-host</Badge>}</p>
                  <p className="font-mono text-[11px] text-text-muted">{fmtChips(p.chips)} · <span className={p.status === 'active' ? 'font-semibold text-accent-emerald' : 'text-text-muted'}>{p.status === 'active' ? 'In' : 'Out'}</span></p>
                </div>
                {isCo
                  ? <Btn size="sm" variant="danger" loading={removing} onClick={() => remove.mutate({ gameId: g.id, userId: p.userId })}>Remove</Btn>
                  : <Btn size="sm" loading={adding} onClick={() => assign.mutate({ gameId: g.id, userId: p.userId })}><Shield className="h-3.5 w-3.5" />Make co-host</Btn>}
              </div>
            )
          })}
        </div>
      )}
    </Sheet>
  )
}
