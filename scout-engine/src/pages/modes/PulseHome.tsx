import { Skull, Star, Theater, TrendingUp, TrendingDown, Minus, Zap, Users, Layers, Clock } from 'lucide-react'
import { PLAYERS, HIGHLIGHTS, TOURNAMENT, STATS } from '@/data'
import { Card, Badge } from '@/components/ui'
import { ChipChart } from '@/components/charts'
import { PlayerAvatar } from '@/components/player'
import { fmtChips } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Highlight } from '@/types'

const typeIcons: Record<string, typeof Skull> = {
  biggest_pot: Star,
  bluff: Theater,
  elimination: Skull,
  hero_call: Zap,
  cooler: Layers,
  bad_beat: TrendingDown,
}

const typeColors: Record<string, string> = {
  biggest_pot: 'text-accent-amber',
  bluff: 'text-accent-purple',
  elimination: 'text-accent-red',
  hero_call: 'text-accent-emerald',
  cooler: 'text-accent-blue',
  bad_beat: 'text-accent-red',
}

function EventFeedItem({ highlight }: { highlight: Highlight }) {
  const Icon = typeIcons[highlight.type] ?? Star
  const color = typeColors[highlight.type] ?? 'text-text-muted'
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-b-0">
      <div className={cn('mt-0.5 p-1.5 rounded-lg bg-bg-surface', color)}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-primary leading-relaxed">{highlight.preview}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-text-muted">Hand #{highlight.hand}</span>
          <span className="text-[10px] font-medium text-accent-amber">{fmtChips(highlight.pot)}</span>
        </div>
      </div>
    </div>
  )
}

function TickerBar() {
  const avgPot = Math.round(HIGHLIGHTS.reduce((s, h) => s + h.pot, 0) / HIGHLIGHTS.length)
  const items = [
    { label: 'Hands', value: String(TOURNAMENT.handCount), pulse: false },
    { label: 'Players', value: `${TOURNAMENT.playerCount}`, pulse: false },
    { label: 'Avg Pot', value: fmtChips(avgPot), pulse: true },
    { label: 'Prize', value: fmtChips(TOURNAMENT.prizePool), pulse: false },
  ]

  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-hide">
      {items.map(item => (
        <div key={item.label} className="flex-1 min-w-0 bg-bg-surface rounded-lg px-2.5 py-2 text-center">
          <div className="text-[10px] text-text-muted uppercase tracking-wider">{item.label}</div>
          <div className={cn('text-sm font-bold text-text-primary mt-0.5', item.pulse && 'text-accent-amber')}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  )
}

function PlayerStatusGrid() {
  // Calculate stack change for each player
  const playersWithChange = PLAYERS.map(p => {
    const stats_p = STATS[p.id]
    const stackDiff = p.endStack - p.startStack
    const pctChange = p.startStack > 0 ? (stackDiff / p.startStack) * 100 : 0
    return { ...p, stackDiff, pctChange, stats: stats_p }
  })

  return (
    <div className="grid grid-cols-3 gap-2">
      {playersWithChange.map(p => {
        const isEliminated = p.status === 'eliminated' && p.endStack === 0
        const isPositive = p.stackDiff > 0
        const style_data = (() => {
          const vpip = p.stats?.vpip ?? 0
          if (vpip >= 28) return { label: 'LAG', color: 'text-accent-red' }
          if (vpip >= 22) return { label: 'TAG', color: 'text-accent-blue' }
          return { label: 'Nit', color: 'text-accent-purple' }
        })()

        return (
          <div
            key={p.id}
            className={cn(
              'rounded-xl border border-border bg-bg-card p-2.5 text-center transition-all',
              isEliminated && 'opacity-50'
            )}
          >
            <div className="flex justify-center mb-1.5">
              <PlayerAvatar initials={p.initials} color={p.color} size="sm" />
            </div>
            <div className="text-xs font-medium text-text-primary truncate">{p.name.split(' ').pop()}</div>
            <div className="flex items-center justify-center gap-1 mt-1">
              {isEliminated ? (
                <span className="text-[10px] text-accent-red font-medium">OUT</span>
              ) : (
                <>
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3 text-accent-emerald" />
                  ) : p.stackDiff < 0 ? (
                    <TrendingDown className="w-3 h-3 text-accent-red" />
                  ) : (
                    <Minus className="w-3 h-3 text-text-muted" />
                  )}
                  <span className={cn(
                    'text-[10px] font-medium',
                    isPositive ? 'text-accent-emerald' : 'text-accent-red'
                  )}>
                    {isPositive ? '+' : ''}{p.pctChange.toFixed(0)}%
                  </span>
                </>
              )}
            </div>
            <div className={cn('text-[10px] mt-1 font-medium', style_data.color)}>
              {style_data.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function PulseHome() {
  return (
    <div className="space-y-4">
      {/* Ticker strip */}
      <TickerBar />

      {/* Status indicator */}
      <div className="flex items-center gap-2 px-1">
        <div className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
        <span className="text-[10px] text-text-muted uppercase tracking-widest font-medium">
          WSOP Main Event 2025 &mdash; Final Table
        </span>
      </div>

      {/* Two-column layout on larger screens */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Chip chart */}
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Stack Progression</h3>
            <Badge variant="muted">{TOURNAMENT.handCount} hands</Badge>
          </div>
          <ChipChart players={PLAYERS.slice(0, 5)} className="mt-2" />
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {PLAYERS.slice(0, 5).map(p => (
              <div key={p.id} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-[10px] text-text-muted">{p.name.split(' ').pop()}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Live event feed */}
        <Card className="space-y-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Event Feed</h3>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-text-muted" />
              <span className="text-[10px] text-text-muted">Latest</span>
            </div>
          </div>
          {HIGHLIGHTS.map(h => (
            <EventFeedItem key={h.id} highlight={h} />
          ))}
        </Card>
      </div>

      {/* Player status grid */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-3.5 h-3.5 text-text-muted" />
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Player Status</h3>
        </div>
        <PlayerStatusGrid />
      </div>
    </div>
  )
}
