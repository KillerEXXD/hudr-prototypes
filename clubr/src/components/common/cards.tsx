import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, CheckCircle2, Users, Crown, Shield, MapPin, Lock, UserCheck, X, ChevronDown } from 'lucide-react'
import { Avatar, Badge, Btn, Card, Processing } from './ui'
import { useApproveMember, useRejectMember } from '@/hooks'
import type { ClubView } from '@/types'

export function MembershipBadge({ status, role }: { status: ClubView['myStatus']; role?: ClubView['myRole'] }) {
  if (status === 'pending') return <Badge tone="amber"><Clock className="h-3 w-3" />Pending</Badge>
  if (role === 'owner') return <Badge tone="purple"><Crown className="h-3 w-3" />Owner</Badge>
  if (role === 'host') return <Badge tone="blue"><Shield className="h-3 w-3" />Host</Badge>
  if (status === 'member') return <Badge tone="green"><CheckCircle2 className="h-3 w-3" />Member</Badge>
  return null
}

export function ClubRow({ club, right }: { club: ClubView; right?: React.ReactNode }) {
  const navigate = useNavigate()
  const approve = useApproveMember()
  const reject = useRejectMember()
  const [open, setOpen] = useState(false)
  const memberCount = club.members.filter((m) => m.status === 'member').length
  const pending = club.members.filter((m) => m.status === 'pending')
  // Hosts/admins get an inline "N waiting" affordance to approve from the list.
  const showWaiting = club.canManage && pending.length > 0

  return (
    <div>
      <Card onClick={() => navigate(`/club/${club.id}`)} className="flex items-center gap-3 p-3">
        <Avatar emoji={club.emoji} color={club.color} size={44} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-bold text-text-primary">
            <span className="min-w-0 truncate">{club.name}</span>
            {club.visibility === 'private' && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-amber/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-accent-amber ring-1 ring-accent-amber/40" title="Private — invite-only">
                <Lock className="h-3 w-3" />Private
              </span>
            )}
          </p>
          <p className="truncate text-xs text-text-muted">{club.location ? <><MapPin className="mr-0.5 inline h-3 w-3" />{club.location} · </> : null}<Users className="mr-1 inline h-3 w-3" />{memberCount} members</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {showWaiting && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
              aria-expanded={open}
              className="inline-flex items-center gap-1 rounded-full bg-accent-amber/20 px-2.5 py-1 text-[11px] font-extrabold text-accent-amber ring-1 ring-accent-amber/40 hover:bg-accent-amber/30 cursor-pointer"
            >
              <Clock className="h-3 w-3" />{pending.length} waiting
              <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
          )}
          {right ?? <MembershipBadge status={club.myStatus} role={club.myRole} />}
        </div>
      </Card>

      {showWaiting && open && (
        <div className="mt-1 flex flex-col gap-1.5 rounded-xl border border-accent-amber/30 bg-accent-amber/5 p-2">
          <p className="px-1 text-[10px] font-bold uppercase tracking-wide text-accent-amber">Waiting to be approved</p>
          {pending.map((m) => (
            <div key={m.userId} className="flex items-center gap-2 rounded-lg bg-bg-card px-2 py-1.5">
              <Avatar name={m.name} color={m.avatarColor} size={26} />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">{m.name}</span>
              <Btn size="sm" loading={approve.isPending && approve.variables?.userId === m.userId} onClick={() => approve.mutate({ clubId: club.id, userId: m.userId })}><UserCheck className="h-3.5 w-3.5" />Approve</Btn>
              <button type="button" disabled={reject.isPending && reject.variables?.userId === m.userId} onClick={() => reject.mutate({ clubId: club.id, userId: m.userId })} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-accent-red/10 hover:text-accent-red cursor-pointer" aria-label={`Reject ${m.name}`}>{reject.isPending && reject.variables?.userId === m.userId ? <Processing size={13} /> : <X className="h-3.5 w-3.5" />}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
