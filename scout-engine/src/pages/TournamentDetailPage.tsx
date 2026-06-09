import { useParams } from 'react-router-dom'
import { useTournament } from '@/hooks/useTournaments'
import { PLAYERS, HIGHLIGHTS, INSIGHTS, QUIZ_HANDS } from '@/data'
import { Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import { PlayerCard } from '@/components/player'
import { ChipChart } from '@/components/charts'
import { HandCard } from '@/components/hand'
import { InsightCard, QuizCard, AIChatInterface } from '@/components/ai'
import { HighlightCard } from '@/components/tournament'
import { fmtChips } from '@/lib/utils'

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { tournament } = useTournament(id ?? 't1')

  if (!tournament) {
    return <p className="text-center text-text-muted py-8">Tournament not found</p>
  }

  const statusVariant = tournament.status === 'live' ? 'danger' : tournament.status === 'completed' ? 'success' : 'muted'

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-text-primary">{tournament.name}</h1>
          <Badge variant={statusVariant}>{tournament.status}</Badge>
        </div>
        <p className="text-xs text-text-muted mt-1">{tournament.event} &middot; {tournament.venue} &middot; {tournament.date}</p>
        <div className="flex gap-4 mt-2 text-xs text-text-secondary">
          <span>{tournament.players} players</span>
          <span>{tournament.hands} hands</span>
          <span className="text-accent-amber font-medium">{fmtChips(tournament.prize)}</span>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="hands">Hands</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-4">
            <ChipChart players={PLAYERS.slice(0, 3)} />
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider">Highlights</h3>
            {HIGHLIGHTS.slice(0, 3).map(h => <HighlightCard key={h.id} highlight={h} />)}
          </div>
        </TabsContent>

        <TabsContent value="players">
          <div className="space-y-2">
            {PLAYERS.map(p => <PlayerCard key={p.id} player={p} />)}
          </div>
        </TabsContent>

        <TabsContent value="hands">
          <div className="space-y-2">
            {HIGHLIGHTS.map(h => <HandCard key={h.id} highlight={h} />)}
          </div>
        </TabsContent>

        <TabsContent value="ai">
          <div className="space-y-4">
            {INSIGHTS.map(i => <InsightCard key={i.id} insight={i} />)}
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider">Quiz</h3>
            {QUIZ_HANDS.slice(0, 1).map(q => <QuizCard key={q.id} quiz={q} />)}
            <AIChatInterface />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
