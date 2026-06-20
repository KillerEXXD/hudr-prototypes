import { useNavigate } from 'react-router-dom'
import { Grid3x3, Lock, Trophy } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRequestJoinSquares } from '@/hooks/squares'
import { Badge, Card, RoleChip } from '@/components/common/ui'
import { Countdown, regDeadline } from '@/components/common/Countdown'
import { StakePool } from '@/components/common/StakePool'
import { StatusBadge } from '@/components/common/StatusBadge'
import { GameRelationshipChip } from '@/components/common/GameRelationshipChip'
import { gameRelationship, isGameHost, isGameCoHost } from '@/lib/gameRelationship'
import type { SquaresGameView } from '@/types/squares'
import type { MemberRole } from '@/types'

export function SquaresRow({ g, showType, clubRole }: { g: SquaresGameView; showType?: boolean; clubRole?: MemberRole }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const req = useRequestJoinSquares()
  const rel = gameRelationship({
    isHost: isGameHost(g, user?.id ?? ''),
    isCoHost: isGameCoHost(g, user?.id ?? ''),
    hasEntry: !!g.me,
    entryPending: g.me?.status === 'pending',
    isMemberOfClub: g.isMemberOfClub,
    registrationOpen: g.status === 'registration',
  })
  return (
    <Card onClick={() => navigate(`/squares/${g.id}`)} className="p-3.5">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent-emerald px-2.5 py-1 text-[12px] font-extrabold uppercase tracking-wide text-bg-primary"><Grid3x3 className="h-3.5 w-3.5" strokeWidth={2.5} />Squares</span>
        <StatusBadge phase={g.status} />
      </div>
      {clubRole && <div className="mb-1.5"><RoleChip role={clubRole} /></div>}
      <div className="flex min-w-0 items-center gap-2 text-[13px] text-text-muted">
        <span className="text-base">{g.clubEmoji}</span><span className="truncate">{g.clubName}</span>
      </div>
      <p className="mt-0.5 text-[17px] font-bold leading-tight text-text-primary" style={{ fontFamily: 'var(--font-family-display)' }}><span className="truncate">{g.title}</span></p>
      <p className="text-[11px] text-text-muted">{g.homeTeam} <span className="text-text-muted/60">vs</span> {g.awayTeam}</p>
      <StakePool stake={g.stake} pool={g.stake * g.claimedCount} right={g.status === 'registration' ? <Countdown deadline={regDeadline(g.registrationClosesAt)} /> : undefined}>· {g.claimedCount}/100 squares</StakePool>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-md bg-bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary"><Trophy className="h-3 w-3 text-accent-amber" />{g.periods.map((p) => p.label).join(' · ')}</span>
        <GameRelationshipChip rel={rel} alsoPlaying={!!g.me && g.me.status !== 'pending'} onJoin={() => req.mutate(g.id)} joining={req.isPending} />
        {g.visibility === 'private' && <Badge tone="neutral"><Lock className="h-3 w-3" />Private</Badge>}
      </div>
    </Card>
  )
}
