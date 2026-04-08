import { useParams } from 'react-router-dom'
import { usePlayer } from '@/hooks/usePlayers'
import { PLAYER_IDENTITIES, PLAYER_STRENGTHS_DATA, PLAYER_LEAKS_DATA, CAREERS, HIGHLIGHTS } from '@/data'
import { SCOUTING_TEXT } from '@/data'
import { Badge, Card, CardContent } from '@/components/ui'
import { PlayerAvatar, StatsGrid, ScoutingReport } from '@/components/player'
import { RadarChart } from '@/components/charts'
import { HandCard } from '@/components/hand'
import { cn, fmtChips } from '@/lib/utils'

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
  const scoutingText = SCOUTING_TEXT[playerId]
  const keyHands = HIGHLIGHTS.filter(h => h.players.includes(playerId))

  return (
    <div className="space-y-5">
      {/* Player Header */}
      <div className="flex items-center gap-4">
        <PlayerAvatar initials={player.initials} color={player.color} size="lg" />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-text-primary">{player.name}</h1>
            <span>{player.flag}</span>
          </div>
          {style && <p className="text-xs text-text-muted mt-0.5">{style.emoji} {style.label} &mdash; {style.desc}</p>}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant={player.status === 'winner' ? 'success' : 'muted'}>#{player.finish}</Badge>
            {skillRating && (
              <Badge variant="default">
                <span style={{ color: skillRating.color }} className="font-bold">{skillRating.grade}</span>
              </Badge>
            )}
            <span className="text-xs text-text-muted">{player.hands} hands</span>
          </div>
        </div>
      </div>

      {identity && <p className="text-sm text-text-secondary italic">{identity}</p>}
      {career && <p className="text-xs text-text-muted">{career}</p>}

      {/* Stack Summary */}
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

      {/* Radar Chart — Player Dimensions */}
      {dimensions && (
        <div>
          <h2 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Player Dimensions</h2>
          <div className="flex justify-center">
            <RadarChart dimensions={dimensions} color={player.color} />
          </div>
        </div>
      )}

      {/* Scouting Report */}
      {scoutingText ? (
        <div>
          <h2 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Scouting Report</h2>
          <Card>
            <CardContent>
              <p className="text-sm text-text-secondary leading-relaxed">{scoutingText}</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <ScoutingReport playerId={playerId} />
      )}

      {/* Strengths */}
      {strengths.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-accent-emerald uppercase tracking-wider mb-2">Strengths</h2>
          <div className="space-y-2">
            {strengths.map((s, i) => (
              <Card key={i}>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-text-primary">{s.title}</span>
                    <Badge variant="success">strength</Badge>
                  </div>
                  <div className="text-xs text-accent-blue mt-0.5">{s.stat}</div>
                  <p className="text-xs text-text-secondary mt-1">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Leaks */}
      {leaks.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-accent-red uppercase tracking-wider mb-2">Leaks</h2>
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

      {/* HUD Stats Grid */}
      {stats && (
        <div>
          <h2 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">HUD Stats</h2>
          <StatsGrid stats={stats} />
        </div>
      )}

      {/* Key Hands */}
      {keyHands.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Key Hands</h2>
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
