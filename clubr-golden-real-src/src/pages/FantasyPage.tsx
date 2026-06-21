import { useNavigate } from 'react-router-dom'
import { Target, Plus } from 'lucide-react'
import { useContests } from '@/hooks/ft'
import { useMyClubs } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { fromFT } from '@/lib/arena/unifiedGame'
import { FeltGameCard } from '@/components/felt/FeltGame'
import { Btn, Section, Spinner, EmptyState } from '@/components/common/ui'
import type { MemberRole } from '@/types'
import type { FTContestView } from '@/types/ft'
import { hostedByMe } from '@/lib/gameRelationship'

export function ContestRow({ c }: { c: FTContestView; showType?: boolean; clubRole?: MemberRole }) {
  const { user } = useAuth()
  return <FeltGameCard g={fromFT(c, user?.id ?? '')} />
}


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
