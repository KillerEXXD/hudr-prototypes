import { useState } from 'react'
import { fromLL } from '@/lib/arena/unifiedGame'
import { FeltGameCard } from '@/components/felt/FeltGame'
import { Timer, Plus } from 'lucide-react'
import { useGames } from '@/hooks/ll'
import { useMyClubs } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Btn, Section, Spinner, EmptyState } from '@/components/common/ui'
import type { MemberRole } from '@/types'
import { CreateGameSheet } from '@/components/ll/CreateGameSheet'
import type { LLGameView } from '@/types/ll'
import { hostedByMe } from '@/lib/gameRelationship'

export function GameRow({ g }: { g: LLGameView; showType?: boolean; clubRole?: MemberRole }) {
  const { user } = useAuth()
  return <FeltGameCard g={fromLL(g, user?.id ?? '')} />
}


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
