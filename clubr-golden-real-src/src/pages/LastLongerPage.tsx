import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Timer, Plus, Trophy, Lock } from 'lucide-react'
import { useGames, useRequestJoinLL } from '@/hooks/ll'
import { useMyClubs } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Badge, Btn, Card, Section, Spinner, EmptyState, RoleChip } from '@/components/common/ui'
import type { MemberRole } from '@/types'
import { Countdown, regDeadline } from '@/components/common/Countdown'
import { StatusBadge } from '@/components/common/StatusBadge'
import { GameRelationshipChip } from '@/components/common/GameRelationshipChip'
import { gameRelationship, isGameHost, isGameCoHost } from '@/lib/gameRelationship'
import { StakePool } from '@/components/common/StakePool'
import { PayoutBadge } from '@/components/common/GameSetup'
import { CreateGameSheet } from '@/components/ll/CreateGameSheet'
import type { LLGameView } from '@/types/ll'

export function GameRow({ g, showType, clubRole }: { g: LLGameView; showType?: boolean; clubRole?: MemberRole }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const req = useRequestJoinLL()
  const rel = gameRelationship({
    isHost: isGameHost(g, user?.id ?? ''),
    isCoHost: isGameCoHost(g, user?.id ?? ''),
    hasEntry: !!g.me,
    entryPending: g.me?.status === 'pending',
    isMemberOfClub: g.isMemberOfClub,
    registrationOpen: g.status === 'registration',
  })
  return (
    <Card onClick={() => navigate(`/lastlonger/${g.id}`)} className="p-3.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent-amber px-2.5 py-1 text-[12px] font-extrabold uppercase tracking-wide text-bg-primary"><Timer className="h-3.5 w-3.5" strokeWidth={2.5} />Last Longer</span>
        <StatusBadge phase={g.status} />
      </div>
      <div className="flex items-center gap-2 text-[13px] text-text-muted">
        <span className="text-base">{g.clubEmoji}</span><span className="truncate">{g.clubName}</span>
        {clubRole && <RoleChip role={clubRole} />}
      </div>
      <p className="mt-0.5 text-[17px] font-bold leading-tight text-text-primary" style={{ fontFamily: 'var(--font-family-display)' }}><span className="truncate">{g.title}</span></p>
      {(() => {
        const out = g.participants.filter((p) => p.status === 'out').length
        const entered = g.participants.filter((p) => p.status !== 'pending').length
        return (
          <StakePool
            stake={g.stake}
            pool={g.stake * entered}
            right={g.status === 'registration' ? <Countdown deadline={regDeadline(g.registrationClosesAt)} /> : undefined}
          >· {g.activeCount} in{out ? ` · ${out} out` : ''}</StakePool>
        )
      })()}
      <div className="mt-2"><PayoutBadge payouts={g.payouts} /></div>
      {(rel !== 'none' || g.visibility === 'private') && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <GameRelationshipChip rel={rel} alsoPlaying={!!g.me && g.me.status !== 'pending'} onJoin={() => req.mutate(g.id)} joining={req.isPending} />
          {g.visibility === 'private' && <Badge tone="neutral"><Lock className="h-3 w-3" />Private</Badge>}
        </div>
      )}
      {g.status === 'completed' && g.me?.finishPos && (
        <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold text-accent-amber"><Trophy className="h-3 w-3" />{g.me.finishPos === 1 ? 'You won 🏆' : `You finished ${g.me.finishPos}${ord(g.me.finishPos)}`}</div>
      )}
    </Card>
  )
}

function ord(n: number) { return n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th' }

export function LastLongerPage() {
  const { user } = useAuth()
  const me = user?.id ?? ''
  const { data, isLoading } = useGames()
  const myClubs = useMyClubs()
  const canHost = (myClubs.data ?? []).some((c) => c.canManage)
  const [createOpen, setCreateOpen] = useState(false)

  const active = (data ?? []).filter((g) => g.status !== 'completed')
  // Past = completed games YOU were in (played or hosted) — not every finished one.
  const past = (data ?? []).filter((g) => g.status === 'completed' && (g.me != null || hostedByMe(g, me)))
  const hosting = active.filter((g) => hostedByMe(g, me))
  const playing = active.filter((g) => !hostedByMe(g, me))

  return (
    <div className="animate-fade-up">
      <h1 className="flex items-center gap-1.5 text-xl font-extrabold tracking-tight text-text-primary"><Timer className="h-5 w-5 text-accent-amber" />Last Longer</h1>
      <p className="mt-1 text-sm text-text-secondary">Your club's live tournament — public count, host-judged eliminations, chip updates, chat &amp; chop. Get admitted, then you're on the board.</p>

      {canHost && <Btn className="mt-3 w-full" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" />Create a Last Longer</Btn>}

      {isLoading ? <Spinner /> : (
        <>
          {hosting.length > 0 && (
            <Section title="You're hosting"><div className="flex flex-col gap-2">{hosting.map((g) => <GameRow key={g.id} g={g} />)}</div></Section>
          )}
          {playing.length > 0 && (
            <Section title={hosting.length > 0 ? 'Playing in' : 'Live & upcoming'}><div className="flex flex-col gap-2">{playing.map((g) => <GameRow key={g.id} g={g} />)}</div></Section>
          )}
          {active.length === 0 && (
            <Section title="Games"><EmptyState icon={<Timer className="h-7 w-7" />} title="Nothing live right now" sub={canHost ? 'Create one above to get your club playing.' : 'Join a club and check back when your host starts one.'} /></Section>
          )}
          {past.length > 0 && (
            <Section title={`Completed (${past.length})`}>
              <div className="flex flex-col gap-2">{past.map((g) => <GameRow key={g.id} g={g} />)}</div>
            </Section>
          )}
        </>
      )}

      <CreateGameSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
