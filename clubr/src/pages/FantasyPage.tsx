import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, Clock, Lock, CheckCircle2, Eye, Shield, Plus, ChevronDown } from 'lucide-react'
import { useContests } from '@/hooks/ft'
import { useMyClubs } from '@/hooks'
import { Badge, Btn, Card, Section, Spinner, EmptyState } from '@/components/common/ui'
import { CreateContestSheet } from '@/components/ft/CreateContestSheet'
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
        <div className="flex items-center gap-2 text-xs text-text-muted"><span className="text-base">{c.clubEmoji}</span>{c.clubName}</div>
        <div className="flex flex-wrap items-center justify-end gap-1.5"><RoleBadges c={c} /><Badge tone={s.tone}><s.icon className="h-3 w-3" />{s.label}</Badge></div>
      </div>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm font-bold text-text-primary"><Target className="h-4 w-4 text-accent-purple" />{c.ftName}</p>
      <div className="mt-2 flex items-center gap-2 text-xs text-text-secondary">
        <span className="font-mono">{c.stake} Stakes</span>
        <span className="text-text-muted">· {c.entries.filter((e) => e.status === 'approved').length} entered</span>
        <span className="ml-auto text-text-muted">{c.locksAt}</span>
      </div>
    </Card>
  )
}

export function FantasyPage() {
  const { data, isLoading } = useContests()
  const myClubs = useMyClubs()
  const canHost = (myClubs.data ?? []).some((c) => c.canManage)
  const [createOpen, setCreateOpen] = useState(false)
  const [pastOpen, setPastOpen] = useState(false)

  const active = (data ?? []).filter((c) => c.status !== 'settled')
  // Past = settled contests YOU were in (entered or hosted) — not every finished one.
  const past = (data ?? []).filter((c) => c.status === 'settled' && (c.myEntry != null || c.canManage))
  const hosting = active.filter((c) => c.canManage)
  const playing = active.filter((c) => !c.canManage)

  return (
    <div className="animate-fade-up">
      <h1 className="flex items-center gap-1.5 text-xl font-extrabold tracking-tight text-text-primary"><Target className="h-5 w-5 text-accent-purple" />FT Fantasy</h1>
      <p className="mt-1 text-sm text-text-secondary">Stack Draft — draft 4 of the 9 finalists within budget, priced by ICM. Get admitted by the host, then draft before the lock.</p>

      {canHost && <Btn className="mt-3 w-full" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" />Host a contest</Btn>}

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
            <div className="mt-5">
              <button onClick={() => setPastOpen((o) => !o)} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-bg-card px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-bg-surface cursor-pointer">
                {pastOpen ? 'Hide' : 'Show'} your past contests ({past.length}) <ChevronDown className={`h-3.5 w-3.5 transition-transform ${pastOpen ? 'rotate-180' : ''}`} />
              </button>
              {pastOpen && <div className="mt-2 flex flex-col gap-2">{past.map((c) => <ContestRow key={c.id} c={c} />)}</div>}
            </div>
          )}
        </>
      )}

      <CreateContestSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
