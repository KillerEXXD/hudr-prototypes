import { useParams } from 'react-router-dom'
import { usePlayer } from '@/hooks/usePlayers'
import { PLAYER_IDENTITIES, PLAYER_STRENGTHS_DATA, PLAYER_LEAKS_DATA, CAREERS } from '@/data'
import { HIGHLIGHTS } from '@/data'
import { Badge, Card, CardContent, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import { PlayerAvatar, StatsGrid, ScoutingReport } from '@/components/player'
import { RadarChart } from '@/components/charts'
import HandCard from '@/components/hand/HandCard'
import { cn } from '@/lib/utils'
import { fmtChips } from '@/lib/utils'

export default function PlayerProfilePage() {
  const { id } = useParams<{ id: string }>()
  const playerId = id ?? 'p1'
  const { player, stats, dimensions, style, skillRating } = usePlayer(playerId)

  if (!player) {
    return <p className="text-center text-text-muted py-8">Player not found</p>
  }

  const identity = PLAYER_IDENTITIES[playerId]
  const strengths = PLAYER_STRENGTHS_DATA[playerId] ?? []
  const leaks = PLAYER_LEAKS_DATA[playerId] ?? []
  const career = CAREERS[playerId]
  const keyHands = HIGHLIGHTS.filter(h => h.players.includes(playerId))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <PlayerAvatar initials={player.initials} color={player.color} size="lg" />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-text-primary">{player.name}</h1>
            <span>{player.flag}</span>
          </div>
          {style && <p className="text-xs text-text-muted mt-0.5">{style.emoji} {style.label} &mdash; {style.desc}</p>}
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={player.status === 'winner' ? 'success' : 'muted'}>#{player.finish}</Badge>
            {skillRating && (
              <span className="text-xs font-bold" style={{ color: skillRating.color }}>{skillRating.grade}</span>
            )}
            <span className="text-xs text-text-muted">{player.hands} hands</span>
          </div>
        </div>
      </div>

      {identity && <p className="text-sm text-text-secondary italic">{identity}</p>}
      {career && <p className="text-xs text-text-muted">{career}</p>}

      <div className="flex gap-3 text-center">
        <Card className="flex-1 py-2">
          <div className="text-xs text-text-muted">Start</div>
          <div className="text-sm font-semibold text-text-primary">{fmtChips(player.startStack)}</div>
        </Card>
        <Card className="flex-1 py-2">
          <div className="text-xs text-text-muted">End</div>
          <div className="text-sm font-semibold text-text-primary">{fmtChips(player.endStack)}</div>
        </Card>
      </div>

      <Tabs defaultValue="stats">
        <TabsList>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="scout">Scout</TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          {stats && <StatsGrid stats={stats} />}
        </TabsContent>

        <TabsContent value="profile">
          <div className="space-y-4">
            {dimensions && (
              <div className="flex justify-center">
                <RadarChart dimensions={dimensions} color={player.color} />
              </div>
            )}

            {strengths.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-accent-emerald uppercase tracking-wider mb-2">Strengths</h3>
                <div className="space-y-2">
                  {strengths.map((s, i) => (
                    <Card key={i}>
                      <CardContent>
                        <div className="font-medium text-sm text-text-primary">{s.title}</div>
                        <div className="text-xs text-accent-blue mt-0.5">{s.stat}</div>
                        <p className="text-xs text-text-secondary mt-1">{s.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {leaks.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-accent-red uppercase tracking-wider mb-2">Leaks</h3>
                <div className="space-y-2">
                  {leaks.map((l, i) => (
                    <Card key={i} className={cn(
                      'border-l-4',
                      l.severity === 'critical' ? 'border-l-accent-red' : l.severity === 'moderate' ? 'border-l-accent-amber' : 'border-l-border'
                    )}>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-text-primary">{l.title}</span>
                          <Badge variant={l.severity === 'critical' ? 'danger' : l.severity === 'moderate' ? 'warning' : 'muted'}>
                            {l.severity}
                          </Badge>
                        </div>
                        <div className="text-xs text-accent-blue mt-0.5">{l.stat}</div>
                        <p className="text-xs text-text-secondary mt-1">{l.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="scout">
          <ScoutingReport playerId={playerId} />
        </TabsContent>
      </Tabs>

      {keyHands.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Key Hands</h3>
          <div className="space-y-2">
            {keyHands.map(h => (
              <HandCard key={h.id} highlight={h} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
