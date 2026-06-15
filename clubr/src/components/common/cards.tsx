import { useNavigate } from 'react-router-dom'
import { Clock, Lock, CheckCircle2, Users, Target, Timer } from 'lucide-react'
import { Avatar, Badge, Card } from './ui'
import type { ClubView, ContestSummary, LastLongerSummary } from '@/types'

export function MembershipBadge({ status }: { status: ClubView['myStatus'] }) {
  if (status === 'member') return <Badge tone="green"><CheckCircle2 className="h-3 w-3" />Member</Badge>
  if (status === 'pending') return <Badge tone="amber"><Clock className="h-3 w-3" />Pending</Badge>
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
        <p className="truncate text-xs text-text-muted"><Users className="mr-1 inline h-3 w-3" />{memberCount} members · {club.ownerName}</p>
      </div>
      {right ?? <MembershipBadge status={club.myStatus} />}
    </Card>
  )
}

const CONTEST_STATUS: Record<ContestSummary['status'], { tone: 'blue' | 'amber' | 'neutral'; icon: typeof Clock; label: string }> = {
  open: { tone: 'blue', icon: Clock, label: 'Open' },
  locked: { tone: 'amber', icon: Lock, label: 'Locked' },
  settled: { tone: 'neutral', icon: CheckCircle2, label: 'Settled' },
}

export function ContestCard({ c }: { c: ContestSummary }) {
  const navigate = useNavigate()
  const s = CONTEST_STATUS[c.status]
  return (
    <Card onClick={() => navigate('/fantasy')} className="p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-text-muted"><span className="text-base">{c.clubEmoji}</span>{c.clubName}</div>
        <Badge tone={s.tone}><s.icon className="h-3 w-3" />{s.label}</Badge>
      </div>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm font-bold text-text-primary"><Target className="h-4 w-4 text-accent-purple" />{c.ftName}</p>
      <div className="mt-2 flex items-center gap-2 text-xs text-text-secondary">
        <Badge tone="purple">{c.format === 'stack-draft' ? 'Stack Draft' : "Pick'em"}</Badge>
        <span className="font-mono">{c.stake} Stakes</span>
        <span className="text-text-muted">· {c.entries} entries</span>
        <span className="ml-auto text-text-muted">{c.locksAt}</span>
      </div>
    </Card>
  )
}

const LL_STATUS: Record<LastLongerSummary['status'], { tone: 'green' | 'blue' | 'neutral'; label: string }> = {
  live: { tone: 'green', label: '● Live' },
  registration: { tone: 'blue', label: 'Registering' },
  completed: { tone: 'neutral', label: 'Completed' },
}

export function LastLongerCard({ ll }: { ll: LastLongerSummary }) {
  const navigate = useNavigate()
  const s = LL_STATUS[ll.status]
  return (
    <Card onClick={() => navigate('/lastlonger')} className="p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-text-muted"><span className="text-base">{ll.clubEmoji}</span>{ll.clubName}</div>
        <Badge tone={s.tone}>{s.label}</Badge>
      </div>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm font-bold text-text-primary"><Timer className="h-4 w-4 text-accent-amber" />{ll.title}</p>
      <div className="mt-2 flex items-center gap-2 text-xs text-text-secondary">
        <span className="font-mono">{ll.stake} Stakes</span>
        <span className="text-text-muted">· {ll.remaining}/{ll.players} left</span>
      </div>
    </Card>
  )
}
