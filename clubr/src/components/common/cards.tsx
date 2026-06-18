import { useNavigate } from 'react-router-dom'
import { Clock, CheckCircle2, Users, Crown, Shield, MapPin } from 'lucide-react'
import { Avatar, Badge, Card } from './ui'
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
  const memberCount = club.members.filter((m) => m.status === 'member').length
  return (
    <Card onClick={() => navigate(`/club/${club.id}`)} className="flex items-center gap-3 p-3">
      <Avatar emoji={club.emoji} color={club.color} size={44} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-text-primary">{club.name}</p>
        <p className="truncate text-xs text-text-muted">{club.location ? <><MapPin className="mr-0.5 inline h-3 w-3" />{club.location} · </> : null}<Users className="mr-1 inline h-3 w-3" />{memberCount} members</p>
      </div>
      {right ?? <MembershipBadge status={club.myStatus} role={club.myRole} />}
    </Card>
  )
}
