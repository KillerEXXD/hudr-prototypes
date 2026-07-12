import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { useClub } from '@/hooks'
import { Sheet, Btn, Avatar } from '@/components/common/ui'
import { cn } from '@/lib/utils/cn'

// Invite members to a PRIVATE game (FT or LL). Grants view access; they still
// request to join and the host admits (approval stays mandatory).
export function InviteSheet({ open, onClose, clubId, accessUserIds, accent = 'purple', onInvite, isPending }: {
  open: boolean; onClose: () => void; clubId: string; accessUserIds: string[]; accent?: 'purple' | 'amber'; onInvite: (userIds: string[]) => void; isPending?: boolean
}) {
  const { data: club } = useClub(clubId)
  const [sel, setSel] = useState<string[]>([])
  const candidates = (club?.members ?? []).filter((m) => m.status === 'member' && !accessUserIds.includes(m.userId))
  const onCls = accent === 'amber' ? 'border-accent-amber bg-accent-amber/15' : 'border-accent-purple bg-accent-purple/15'

  return (
    <Sheet open={open} onClose={onClose} title="Invite members">
      <p className="mb-2 text-xs text-text-muted">This game is private — pick who can see it. They'll still request to join and you admit them.</p>
      {candidates.length === 0 ? (
        <p className="py-4 text-center text-sm text-text-muted">Everyone's already invited.</p>
      ) : (
        <div className="flex max-h-60 flex-col gap-1 overflow-y-auto scrollbar-thin">
          {candidates.map((m) => {
            const on = sel.includes(m.userId)
            return (
              <button key={m.userId} onClick={() => setSel((s) => on ? s.filter((x) => x !== m.userId) : [...s, m.userId])} className={cn('flex items-center gap-2.5 rounded-xl border p-2 text-left cursor-pointer', on ? onCls : 'border-border hover:bg-bg-surface')}>
                <Avatar name={m.name} color={m.avatarColor} pic={m.avatarUrl} size={30} />
                <span className="flex-1 truncate text-sm text-text-primary">{m.name}</span>
                <input type="checkbox" readOnly checked={on} className="pointer-events-none" />
              </button>
            )
          })}
        </div>
      )}
      {/* processing-exempt: closes the sheet on click (onClose); the invite resolves in the background and the roster updates */}
      <Btn className="mt-3 w-full" disabled={sel.length === 0 || !!isPending} onClick={() => { onInvite(sel); setSel([]); onClose() }}><UserPlus className="h-4 w-4" />Invite{sel.length ? ` ${sel.length}` : ''}</Btn>
    </Sheet>
  )
}
