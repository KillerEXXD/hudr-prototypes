import { useNavigate } from 'react-router-dom'
import { Timer, CheckCircle2, Eye } from 'lucide-react'
import { useGames } from '@/hooks/ll'
import { Badge, Card, Section, Spinner, EmptyState } from '@/components/common/ui'
import type { LLGameView } from '@/types/ll'

function MyBadge({ g }: { g: LLGameView }) {
  if (g.me?.status === 'active') return <Badge tone="green"><CheckCircle2 className="h-3 w-3" />In</Badge>
  if (g.me?.status === 'pending') return <Badge tone="amber"><Eye className="h-3 w-3" />Pending</Badge>
  if (g.me?.status === 'out') return <Badge tone="neutral">Out</Badge>
  return null
}

function GameRow({ g }: { g: LLGameView }) {
  const navigate = useNavigate()
  const s = g.status === 'live' ? { tone: 'green' as const, label: '● Live' } : g.status === 'registration' ? { tone: 'blue' as const, label: 'Registering' } : { tone: 'neutral' as const, label: 'Completed' }
  return (
    <Card onClick={() => navigate(`/lastlonger/${g.id}`)} className="p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-text-muted"><span className="text-base">{g.clubEmoji}</span>{g.clubName}</div>
        <div className="flex items-center gap-1.5"><MyBadge g={g} /><Badge tone={s.tone}>{s.label}</Badge></div>
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
  return (
    <div className="animate-fade-up">
      <h1 className="flex items-center gap-1.5 text-xl font-extrabold tracking-tight text-text-primary"><Timer className="h-5 w-5 text-accent-amber" />Last Longer</h1>
      <p className="mt-1 text-sm text-text-secondary">Your club's live tournament — public count, host-judged eliminations, chip updates, chat &amp; chop. Get admitted, then you're on the board.</p>
      <Section title="Games in your clubs">
        {isLoading ? <Spinner /> : data && data.length > 0 ? (
          <div className="flex flex-col gap-2">{data.map((g) => <GameRow key={g.id} g={g} />)}</div>
        ) : (
          <EmptyState icon={<Timer className="h-7 w-7" />} title="No games yet" sub="Join a club to see its Last Longer games, or ask your host to start one." />
        )}
      </Section>
    </div>
  )
}
