import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Timer, CheckCircle2, Eye, Shield, Plus, ChevronDown } from 'lucide-react'
import { useGames } from '@/hooks/ll'
import { useMyClubs } from '@/hooks'
import { Badge, Btn, Card, Section, Spinner, EmptyState } from '@/components/common/ui'
import { CreateGameSheet } from '@/components/ll/CreateGameSheet'
import type { LLGameView } from '@/types/ll'

function RoleBadges({ g }: { g: LLGameView }) {
  return (
    <>
      {g.canManage && <Badge tone="green"><Shield className="h-3 w-3" />Hosting</Badge>}
      {g.me?.status === 'active' && <Badge tone="blue"><CheckCircle2 className="h-3 w-3" />In</Badge>}
      {g.me?.status === 'pending' && <Badge tone="amber"><Eye className="h-3 w-3" />Pending</Badge>}
      {g.me?.status === 'out' && <Badge tone="neutral">Out</Badge>}
    </>
  )
}

export function GameRow({ g }: { g: LLGameView }) {
  const navigate = useNavigate()
  const s = g.status === 'live' ? { tone: 'green' as const, label: '● Live' } : g.status === 'registration' ? { tone: 'blue' as const, label: 'Registering' } : { tone: 'neutral' as const, label: 'Completed' }
  return (
    <Card onClick={() => navigate(`/lastlonger/${g.id}`)} className="p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-text-muted"><span className="text-base">{g.clubEmoji}</span>{g.clubName}</div>
        <div className="flex flex-wrap items-center justify-end gap-1.5"><RoleBadges g={g} /><Badge tone={s.tone}>{s.label}</Badge></div>
      </div>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm font-bold text-text-primary"><Timer className="h-4 w-4 text-accent-amber" />{g.title}</p>
      <div className="mt-2 flex items-center gap-2 text-xs text-text-secondary">
        <span className="font-mono">{g.stake} Stakes</span>
        <span className="text-text-muted">· {g.activeCount} in · {g.participants.filter((p) => p.status === 'out').length} out</span>
      </div>
    </Card>
  )
}

export function LastLongerPage() {
  const { data, isLoading } = useGames()
  const myClubs = useMyClubs()
  const canHost = (myClubs.data ?? []).some((c) => c.canManage)
  const [createOpen, setCreateOpen] = useState(false)
  const [pastOpen, setPastOpen] = useState(false)

  const active = (data ?? []).filter((g) => g.status !== 'completed')
  const past = (data ?? []).filter((g) => g.status === 'completed')
  const hosting = active.filter((g) => g.canManage)
  const playing = active.filter((g) => !g.canManage)

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
            <div className="mt-5">
              <button onClick={() => setPastOpen((o) => !o)} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-bg-card px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-bg-surface cursor-pointer">
                {pastOpen ? 'Hide' : 'Show'} past games ({past.length}) <ChevronDown className={`h-3.5 w-3.5 transition-transform ${pastOpen ? 'rotate-180' : ''}`} />
              </button>
              {pastOpen && <div className="mt-2 flex flex-col gap-2">{past.map((g) => <GameRow key={g.id} g={g} />)}</div>}
            </div>
          )}
        </>
      )}

      <CreateGameSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
