import { useState } from 'react'
import { ChevronRight, ChevronLeft, Trophy, Users, CreditCard } from 'lucide-react'
import {
  PLAYERS, TOURNAMENT, INSIGHTS, HIGHLIGHTS, STATS,
  PLAYER_DIMENSIONS, PLAYER_STRENGTHS_DATA, PLAYER_LEAKS_DATA,
  PLAYER_IDENTITIES, STYLES, SKILL_RATINGS,
} from '@/data'
import { Card, CardContent, Badge, Button } from '@/components/ui'
import { PlayerAvatar, StatsGrid, ScoutingReport } from '@/components/player'
import { RadarChart } from '@/components/charts'
import { HandCard } from '@/components/hand'
import { InsightCard } from '@/components/ai'
import { fmtChips } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Player, Highlight } from '@/types'

type DrillLevel = 'tournament' | 'players' | 'player' | 'hand'

interface BreadcrumbItem {
  level: DrillLevel
  label: string
  data?: string // player id or highlight id
}

export default function NexusHome() {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { level: 'tournament', label: 'Tournament' },
  ])

  const current = breadcrumbs[breadcrumbs.length - 1]

  const drillTo = (item: BreadcrumbItem) => {
    setBreadcrumbs(prev => [...prev, item])
  }

  const goBack = () => {
    if (breadcrumbs.length > 1) {
      setBreadcrumbs(prev => prev.slice(0, -1))
    }
  }

  const goToBreadcrumb = (index: number) => {
    setBreadcrumbs(prev => prev.slice(0, index + 1))
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb bar */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {breadcrumbs.length > 1 && (
          <button onClick={goBack} className="p-1 rounded-lg hover:bg-bg-surface shrink-0">
            <ChevronLeft className="w-4 h-4 text-text-muted" />
          </button>
        )}
        {breadcrumbs.map((crumb, i) => (
          <div key={i} className="flex items-center gap-1 shrink-0">
            {i > 0 && <ChevronRight className="w-3 h-3 text-text-muted" />}
            <button
              onClick={() => goToBreadcrumb(i)}
              className={cn(
                'text-xs px-2 py-1 rounded-lg transition-colors',
                i === breadcrumbs.length - 1
                  ? 'bg-accent-blue/20 text-accent-blue font-medium'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {crumb.label}
            </button>
          </div>
        ))}
      </div>

      {/* Content based on drill level */}
      {current.level === 'tournament' && (
        <TournamentLevel
          onViewPlayers={() => drillTo({ level: 'players', label: 'Players' })}
        />
      )}

      {current.level === 'players' && (
        <PlayersLevel
          onSelectPlayer={(p: Player) => drillTo({ level: 'player', label: p.name.split(' ').pop() ?? p.name, data: p.id })}
        />
      )}

      {current.level === 'player' && current.data && (
        <PlayerDetailLevel
          playerId={current.data}
          onSelectHand={(h: Highlight) => drillTo({ level: 'hand', label: `Hand #${h.hand}`, data: h.id })}
        />
      )}

      {current.level === 'hand' && current.data && (
        <HandDetailLevel highlightId={current.data} />
      )}
    </div>
  )
}

function TournamentLevel({ onViewPlayers }: { onViewPlayers: () => void }) {
  return (
    <div className="space-y-4">
      {/* Tournament hero */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/10 to-accent-purple/10" />
        <div className="relative space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent-amber" />
            <h2 className="text-lg font-bold text-text-primary">{TOURNAMENT.name}</h2>
          </div>
          <p className="text-xs text-text-muted">{TOURNAMENT.event} &middot; {TOURNAMENT.venue} &middot; {TOURNAMENT.date}</p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-bg-surface/50 rounded-lg p-2 text-center">
              <div className="text-[10px] text-text-muted">Players</div>
              <div className="text-sm font-bold text-text-primary">{TOURNAMENT.playerCount}</div>
            </div>
            <div className="bg-bg-surface/50 rounded-lg p-2 text-center">
              <div className="text-[10px] text-text-muted">Hands</div>
              <div className="text-sm font-bold text-text-primary">{TOURNAMENT.handCount}</div>
            </div>
            <div className="bg-bg-surface/50 rounded-lg p-2 text-center">
              <div className="text-[10px] text-text-muted">Prize</div>
              <div className="text-sm font-bold text-accent-amber">{fmtChips(TOURNAMENT.prizePool)}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* AI Insights */}
      <div>
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">AI Insights</h3>
        <div className="space-y-2">
          {INSIGHTS.map(i => <InsightCard key={i.id} insight={i} />)}
        </div>
      </div>

      {/* View Players button */}
      <Button onClick={onViewPlayers} className="w-full gap-2">
        <Users className="w-4 h-4" />
        View Players ({PLAYERS.length})
        <ChevronRight className="w-4 h-4 ml-auto" />
      </Button>
    </div>
  )
}

function PlayersLevel({ onSelectPlayer }: { onSelectPlayer: (p: Player) => void }) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
        {PLAYERS.length} Players
      </h2>
      <div className="grid grid-cols-1 gap-2">
        {PLAYERS.map(p => (
          <button key={p.id} onClick={() => onSelectPlayer(p)} className="text-left w-full">
            <Card className="flex items-center gap-3 hover:border-border-light transition-colors">
              <PlayerAvatar initials={p.initials} color={p.color} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary text-sm truncate">{p.name}</span>
                  <span className="text-sm">{p.flag}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={p.status === 'winner' ? 'success' : p.status === 'runner-up' ? 'warning' : 'muted'}>
                    #{p.finish}
                  </Badge>
                  <span className="text-xs text-text-muted">{p.hands} hands</span>
                  {STYLES[p.id] && (
                    <span className="text-xs text-text-muted">{STYLES[p.id].emoji} {STYLES[p.id].label}</span>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
            </Card>
          </button>
        ))}
      </div>
    </div>
  )
}

function PlayerDetailLevel({ playerId, onSelectHand }: { playerId: string; onSelectHand: (h: Highlight) => void }) {
  const player = PLAYERS.find(p => p.id === playerId)
  if (!player) return null

  const stats = STATS[playerId]
  const dims = PLAYER_DIMENSIONS[playerId]
  const identity = PLAYER_IDENTITIES[playerId]
  const strengths = PLAYER_STRENGTHS_DATA[playerId] ?? []
  const leaks = PLAYER_LEAKS_DATA[playerId] ?? []
  const style = STYLES[playerId]
  const rating = SKILL_RATINGS[playerId]
  const playerHands = HIGHLIGHTS.filter(h => h.players.includes(playerId))

  return (
    <div className="space-y-4">
      {/* Player header */}
      <div className="flex items-center gap-4">
        <PlayerAvatar initials={player.initials} color={player.color} size="lg" />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-text-primary">{player.name}</h2>
            <span>{player.flag}</span>
          </div>
          {style && <p className="text-xs text-text-muted">{style.emoji} {style.label} &mdash; {style.desc}</p>}
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={player.status === 'winner' ? 'success' : 'muted'}>#{player.finish}</Badge>
            {rating && <span className="text-xs font-bold" style={{ color: rating.color }}>{rating.grade}</span>}
          </div>
        </div>
      </div>

      {identity && <p className="text-sm text-text-secondary italic">{identity}</p>}

      {/* Radar chart */}
      {dims && (
        <div className="flex justify-center">
          <RadarChart dimensions={dims} color={player.color} size={200} />
        </div>
      )}

      {/* Stats */}
      {stats && <StatsGrid stats={stats} />}

      {/* Scouting report */}
      <ScoutingReport playerId={playerId} />

      {/* Strengths */}
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

      {/* Leaks */}
      {leaks.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-accent-red uppercase tracking-wider mb-2">Leaks</h3>
          <div className="space-y-2">
            {leaks.slice(0, 2).map((l, i) => (
              <Card key={i} className={cn(
                'border-l-4',
                l.severity === 'critical' ? 'border-l-accent-red' : l.severity === 'moderate' ? 'border-l-accent-amber' : 'border-l-border'
              )}>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-text-primary">{l.title}</span>
                    <Badge variant={l.severity === 'critical' ? 'danger' : 'warning'}>{l.severity}</Badge>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">{l.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Key hands */}
      {playerHands.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Key Hands</h3>
          <div className="space-y-2">
            {playerHands.map(h => (
              <button key={h.id} onClick={() => onSelectHand(h)} className="w-full text-left">
                <Card className="flex items-center gap-3 hover:border-border-light transition-colors">
                  <CreditCard className="w-4 h-4 text-text-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-primary truncate">{h.preview}</p>
                    <span className="text-[10px] text-accent-amber">{fmtChips(h.pot)}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
                </Card>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function HandDetailLevel({ highlightId }: { highlightId: string }) {
  const highlight = HIGHLIGHTS.find(h => h.id === highlightId)
  if (!highlight) return null

  const players = highlight.players.map(pid => PLAYERS.find(p => p.id === pid)).filter(Boolean)

  return (
    <div className="space-y-4">
      <HandCard highlight={highlight} />

      {/* Players involved */}
      <div>
        <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Players Involved</h3>
        <div className="space-y-2">
          {players.map(p => p && (
            <Card key={p.id} className="flex items-center gap-3">
              <PlayerAvatar initials={p.initials} color={p.color} size="sm" />
              <div>
                <span className="text-sm font-medium text-text-primary">{p.name}</span>
                <div className="text-xs text-text-muted">
                  {fmtChips(p.startStack)} starting stack
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Hand details */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Hand #{highlight.hand}</h3>
          <Badge variant="warning">{fmtChips(highlight.pot)}</Badge>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Board:</span>
            <span className="text-xs text-text-secondary">{highlight.board}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Type:</span>
            <Badge variant="default">{highlight.type.replace('_', ' ')}</Badge>
          </div>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">{highlight.preview}</p>
      </Card>
    </div>
  )
}
