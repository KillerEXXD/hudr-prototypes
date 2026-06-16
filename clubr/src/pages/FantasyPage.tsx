import { useNavigate } from 'react-router-dom'
import { Target, Clock, Lock, CheckCircle2, Eye, Shield, Plus, Trophy } from 'lucide-react'
import { useContests } from '@/hooks/ft'
import { useMyClubs } from '@/hooks'
import { Badge, Btn, Card, Section, Spinner, EmptyState } from '@/components/common/ui'
import { Countdown, regDeadline } from '@/components/common/Countdown'
import { StakePool } from '@/components/common/StakePool'
import { PayoutBadge } from '@/components/common/GameSetup'
import type { FTContestView } from '@/types/ft'

function RoleBadges({ c }: { c: FTContestView }) {
  return (
    <>
      {c.canManage && <Badge tone="green"><Shield className="h-3 w-3" />Hosting</Badge>}
      {c.myEntry?.status === 'approved' && <Badge tone="blue"><CheckCircle2 className="h-3 w-3" />Entered</Badge>}
      {c.myEntry?.status === 'pending' && <Badge tone="amber"><Eye className="h-3 w-3" />Pending</Badge>}
    </>
  )
}

export function ContestRow({ c }: { c: FTContestView }) {
  const navigate = useNavigate()
  const s = c.status === 'open' ? { tone: 'blue' as const, icon: Clock, label: 'Open' } : c.status === 'locked' ? { tone: 'amber' as const, icon: Lock, label: 'Locked' } : { tone: 'neutral' as const, icon: CheckCircle2, label: 'Settled' }
  return (
    <Card onClick={() => navigate(`/fantasy/${c.id}`)} className="p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-xs text-text-muted"><span className="text-base">{c.clubEmoji}</span><span className="truncate">{c.clubName}</span></div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge tone={s.tone}><s.icon className="h-3 w-3" />{s.label}</Badge>
        </div>
      </div>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm font-bold text-text-primary"><Target className="h-4 w-4 shrink-0 text-accent-purple" /><span className="truncate">{c.ftName}</span></p>
      {(() => {
        const entered = c.entries.filter((e) => e.status === 'approved').length
        return (
          <StakePool
            stake={c.stake}
            pool={c.stake * entered}
            right={c.status === 'open'
              ? <Countdown deadline={regDeadline(c.id, c.locksAtTs)} prefix="Locks" />
              : <span className="text-text-muted">{c.locksAt}</span>}
          >· {entered} entered</StakePool>
        )
      })()}
      <div className="mt-2"><PayoutBadge payouts={c.payouts ?? (c.format === 'winner_takes_all' ? [100] : undefined)} /></div>
      {(c.canManage || c.myEntry || c.visibility === 'private') && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5"><RoleBadges c={c} />{c.visibility === 'private' && <Badge tone="neutral"><Lock className="h-3 w-3" />Private</Badge>}</div>
      )}
      {c.status === 'settled' && c.myEntry?.rank && (
        <div className={`mt-1.5 flex items-center gap-1 text-[11px] font-bold ${c.myEntry.rank === 1 ? 'text-accent-amber' : 'text-accent-purple'}`}>
          <Trophy className="h-3 w-3" />
          {c.format === 'winner_takes_all' && c.myEntry.rank === 1
            ? `You won — winner takes all · ${c.myEntry.score} pts 🏆`
            : `You finished ${c.myEntry.rank}${ord(c.myEntry.rank)} · ${c.myEntry.score} pts`}
        </div>
      )}
    </Card>
  )
}

function ord(n: number) { return n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th' }

export function FantasyPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useContests()
  const myClubs = useMyClubs()
  const canHost = (myClubs.data ?? []).some((c) => c.canManage)

  const active = (data ?? []).filter((c) => c.status !== 'settled')
  // Past = settled contests YOU were in (entered or hosted) — not every finished one.
  const past = (data ?? []).filter((c) => c.status === 'settled' && (c.myEntry != null || c.canManage))
  const hosting = active.filter((c) => c.canManage)
  const playing = active.filter((c) => !c.canManage)

  return (
    <div className="animate-fade-up">
      <h1 className="flex items-center gap-1.5 text-xl font-extrabold tracking-tight text-text-primary"><Target className="h-5 w-5 text-accent-purple" />FT Fantasy</h1>
      <p className="mt-1 text-sm text-text-secondary">Stack Draft — draft 4 of the 9 finalists within budget, priced by ICM. Get admitted by the host, then draft before the lock.</p>

      {canHost && <Btn className="mt-3 w-full" onClick={() => navigate('/host-ft')}><Plus className="h-4 w-4" />Host a contest</Btn>}

      {isLoading ? <Spinner /> : (
        <>
          {hosting.length > 0 && (
            <Section title="You're hosting"><div className="flex flex-col gap-2">{hosting.map((c) => <ContestRow key={c.id} c={c} />)}</div></Section>
          )}
          {playing.length > 0 && (
            <Section title={hosting.length > 0 ? 'Playing in' : 'Open contests'}><div className="flex flex-col gap-2">{playing.map((c) => <ContestRow key={c.id} c={c} />)}</div></Section>
          )}
          {active.length === 0 && (
            <Section title="Contests"><EmptyState icon={<Target className="h-7 w-7" />} title="Nothing open right now" sub={canHost ? 'Host one above, or check back when a final table is coming up.' : 'Join a club and check back when your host opens one.'} /></Section>
          )}
          {past.length > 0 && (
            <Section title={`Completed (${past.length})`}>
              <div className="flex flex-col gap-2">{past.map((c) => <ContestRow key={c.id} c={c} />)}</div>
            </Section>
          )}
        </>
      )}

    </div>
  )
}
