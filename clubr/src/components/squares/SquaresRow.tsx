import { useNavigate } from 'react-router-dom'
import { Grid3x3, Lock, Trophy } from 'lucide-react'
import { Badge, Card, GameTypeBadge } from '@/components/common/ui'
import { Countdown, regDeadline } from '@/components/common/Countdown'
import { StakePool } from '@/components/common/StakePool'
import type { SquaresGameView } from '@/types/squares'

export function SquaresRow({ g, showType }: { g: SquaresGameView; showType?: boolean }) {
  const navigate = useNavigate()
  const s = g.status === 'live'
    ? { tone: 'green' as const, label: '● Live' }
    : g.status === 'registration' ? { tone: 'blue' as const, label: 'Claiming open' } : { tone: 'neutral' as const, label: 'Completed' }
  return (
    <Card onClick={() => navigate(`/squares/${g.id}`)} className="p-3.5">
      {showType && <div className="mb-2"><GameTypeBadge kind="sq" /></div>}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-xs text-text-muted">
          <span className="text-base">{g.clubEmoji}</span><span className="truncate">{g.clubName}</span>
          {!showType && <Badge tone="green"><Grid3x3 className="h-3 w-3" />Squares</Badge>}
        </div>
        <Badge tone={s.tone}>{s.label}</Badge>
      </div>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm font-bold text-text-primary"><Grid3x3 className="h-4 w-4 shrink-0 text-accent-emerald" /><span className="truncate">{g.title}</span></p>
      <p className="text-[11px] text-text-muted">{g.homeTeam} <span className="text-text-muted/60">vs</span> {g.awayTeam}</p>
      <StakePool stake={g.stake} pool={g.stake * g.claimedCount} right={g.status === 'registration' ? <Countdown deadline={regDeadline(g.id, g.registrationClosesAt)} prefix="Closes" /> : undefined}>· {g.claimedCount}/100 squares</StakePool>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-md bg-bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary"><Trophy className="h-3 w-3 text-accent-amber" />{g.periods.map((p) => p.label).join(' · ')}</span>
        {g.me && <Badge tone="blue">In</Badge>}
        {g.visibility === 'private' && <Badge tone="neutral"><Lock className="h-3 w-3" />Private</Badge>}
      </div>
    </Card>
  )
}
