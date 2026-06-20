import { useNavigate } from 'react-router-dom'
import { Target, Lock, Plus, Trophy } from 'lucide-react'
import { useContests, useRequestEnter } from '@/hooks/ft'
import { useMyClubs } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Badge, Btn, Card, Section, Spinner, EmptyState, RoleChip } from '@/components/common/ui'
import type { MemberRole } from '@/types'
import { Countdown, regDeadline } from '@/components/common/Countdown'
import { formatCloseInZone, detectZone } from '@/lib/gameSetup'
import { ftPhase } from '@/lib/gameStatus'
import { StatusBadge } from '@/components/common/StatusBadge'
import { GameRelationshipChip } from '@/components/common/GameRelationshipChip'
import { gameRelationship, isGameHost, isGameCoHost } from '@/lib/gameRelationship'
import { StakePool } from '@/components/common/StakePool'
import { PayoutBadge } from '@/components/common/GameSetup'
import type { FTContestView } from '@/types/ft'

export function ContestRow({ c, showType, clubRole }: { c: FTContestView; showType?: boolean; clubRole?: MemberRole }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const req = useRequestEnter()
  const rel = gameRelationship({
    isHost: isGameHost(c, user?.id ?? ''),
    isCoHost: isGameCoHost(c, user?.id ?? ''),
    hasEntry: !!c.myEntry,
    entryPending: c.myEntry?.status === 'pending',
    isMemberOfClub: c.isMemberOfClub,
    registrationOpen: c.status === 'open',
  })
  return (
    <Card onClick={() => navigate(`/fantasy/${c.id}`)} className="p-3.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent-purple px-2.5 py-1 text-[12px] font-extrabold uppercase tracking-wide text-bg-primary"><Target className="h-3.5 w-3.5" strokeWidth={2.5} />FT Fantasy</span>
        <StatusBadge phase={ftPhase(c.status)} />
      </div>
      <div className="flex items-center gap-2 text-[13px] text-text-muted">
        <span className="text-base">{c.clubEmoji}</span><span className="truncate">{c.clubName}</span>
        {clubRole && <RoleChip role={clubRole} />}
      </div>
      <p className="mt-0.5 text-[17px] font-bold leading-tight text-text-primary" style={{ fontFamily: 'var(--font-family-display)' }}><span className="truncate">{c.ftName}</span></p>
      {(() => {
        const entered = c.entries.filter((e) => e.status === 'approved').length
        return (
          <StakePool
            stake={c.stake}
            pool={c.stake * entered}
            right={c.status === 'open'
              ? <Countdown deadline={regDeadline(c.locksAtTs ?? c.locksAt)} prefix="Locks" />
              : <span className="text-text-muted">{formatCloseInZone(c.locksAtTs, detectZone()) || c.locksAt}</span>}
          >· {entered} entered</StakePool>
        )
      })()}
      <div className="mt-2"><PayoutBadge payouts={c.payouts ?? (c.format === 'winner_takes_all' ? [100] : undefined)} /></div>
      {(rel !== 'none' || c.visibility === 'private') && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <GameRelationshipChip rel={rel} alsoPlaying={!!c.myEntry && c.myEntry.status !== 'pending'} onJoin={() => req.mutate(c.id)} joining={req.isPending} />
          {c.visibility === 'private' && <Badge tone="neutral"><Lock className="h-3 w-3" />Private</Badge>}
        </div>
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
  const { user } = useAuth()
  const me = user?.id ?? ''
  const { data, isLoading } = useContests()
  const myClubs = useMyClubs()
  const canHost = (myClubs.data ?? []).some((c) => c.canManage)

  const active = (data ?? []).filter((c) => c.status !== 'settled')
  // Past = settled contests YOU were in (entered or hosted) — not every finished one.
  const past = (data ?? []).filter((c) => c.status === 'settled' && (c.myEntry != null || hostedByMe(c, me)))
  const hosting = active.filter((c) => hostedByMe(c, me))
  const playing = active.filter((c) => !hostedByMe(c, me))

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
