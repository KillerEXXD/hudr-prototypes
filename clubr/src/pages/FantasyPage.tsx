import { useNavigate } from 'react-router-dom'
import { Target, Clock, Lock, CheckCircle2, Eye } from 'lucide-react'
import { useContests } from '@/hooks/ft'
import { Badge, Card, Section, Spinner, EmptyState } from '@/components/common/ui'
import type { FTContestView } from '@/types/ft'

function MyEntryBadge({ c }: { c: FTContestView }) {
  if (c.myEntry?.status === 'approved') return <Badge tone="green"><CheckCircle2 className="h-3 w-3" />Entered</Badge>
  if (c.myEntry?.status === 'pending') return <Badge tone="amber"><Eye className="h-3 w-3" />Pending</Badge>
  return null
}

function ContestRow({ c }: { c: FTContestView }) {
  const navigate = useNavigate()
  const s = c.status === 'open' ? { tone: 'blue' as const, icon: Clock, label: 'Open' } : c.status === 'locked' ? { tone: 'amber' as const, icon: Lock, label: 'Locked' } : { tone: 'neutral' as const, icon: CheckCircle2, label: 'Settled' }
  return (
    <Card onClick={() => navigate(`/fantasy/${c.id}`)} className="p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-text-muted"><span className="text-base">{c.clubEmoji}</span>{c.clubName}</div>
        <div className="flex items-center gap-1.5"><MyEntryBadge c={c} /><Badge tone={s.tone}><s.icon className="h-3 w-3" />{s.label}</Badge></div>
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
  return (
    <div className="animate-fade-up">
      <h1 className="flex items-center gap-1.5 text-xl font-extrabold tracking-tight text-text-primary"><Target className="h-5 w-5 text-accent-purple" />FT Fantasy</h1>
      <p className="mt-1 text-sm text-text-secondary">Stack Draft — draft 4 of the 9 finalists within budget, priced by ICM. Get admitted by the host, then draft before the lock.</p>

      <Section title="Contests in your clubs">
        {isLoading ? <Spinner /> : data && data.length > 0 ? (
          <div className="flex flex-col gap-2">{data.map((c) => <ContestRow key={c.id} c={c} />)}</div>
        ) : (
          <EmptyState icon={<Target className="h-7 w-7" />} title="No contests yet" sub="Join a club to see its FT Fantasy contests, or ask your host to open one." />
        )}
      </Section>
    </div>
  )
}
