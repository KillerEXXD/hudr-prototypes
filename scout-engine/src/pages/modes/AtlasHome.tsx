import { useState, useMemo } from 'react'
import { Search, TrendingUp, Trophy, Star } from 'lucide-react'
import {
  PLAYERS, TOURNAMENTS_LIST, HIGHLIGHTS, TOURNAMENT,
  STATS, PLAYER_DIMENSIONS, STYLES, SKILL_RATINGS,
  PLAYER_IDENTITIES, PLAYER_STRENGTHS_DATA, PLAYER_LEAKS_DATA,
} from '@/data'
import { Card, CardContent, Badge, Input, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import { TournamentCard, HighlightCard } from '@/components/tournament'
import { PlayerAvatar, StatsGrid, ScoutingReport } from '@/components/player'
import { HandCard } from '@/components/hand'
import { RadarChart } from '@/components/charts'
import { fmtChips, cn } from '@/lib/utils'
import type { Player } from '@/types'

type DetailView = { type: 'player'; id: string } | { type: 'tournament'; id: string } | null

export default function AtlasHome() {
  const [query, setQuery] = useState('')
  const [detail, setDetail] = useState<DetailView>(null)

  const results = useMemo(() => {
    if (!query.trim()) return null
    const q = query.toLowerCase()
    return {
      players: PLAYERS.filter(p => p.name.toLowerCase().includes(q)),
      tournaments: TOURNAMENTS_LIST.filter(t => t.name.toLowerCase().includes(q) || t.event.toLowerCase().includes(q) || t.venue.toLowerCase().includes(q)),
      hands: HIGHLIGHTS.filter(h =>
        h.preview.toLowerCase().includes(q) ||
        h.type.replace('_', ' ').includes(q) ||
        h.players.some(pid => {
          const p = PLAYERS.find(pl => pl.id === pid)
          return p && p.name.toLowerCase().includes(q)
        })
      ),
    }
  }, [query])

  const hasResults = results && (results.players.length > 0 || results.tournaments.length > 0 || results.hands.length > 0)

  // Detail view
  if (detail) {
    if (detail.type === 'player') {
      const player = PLAYERS.find(p => p.id === detail.id)
      if (!player) return null
      return (
        <PlayerDetail
          player={player}
          onBack={() => setDetail(null)}
        />
      )
    }
  }

  return (
    <div className="space-y-5">
      {/* Hero search */}
      <div className="space-y-2">
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold text-text-primary">Explore</h1>
          <p className="text-xs text-text-muted mt-1">Search tournaments, players, or hands</p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <Input
            value={query}
            onChange={e => { setQuery(e.target.value); setDetail(null) }}
            placeholder="Search players, tournaments, hands..."
            className="pl-12 h-12 text-sm rounded-xl bg-bg-card border-border-light"
          />
        </div>
      </div>

      {/* Search results */}
      {query.trim() && results ? (
        hasResults ? (
          <Tabs defaultValue={results.players.length > 0 ? 'players' : results.tournaments.length > 0 ? 'tournaments' : 'hands'}>
            <TabsList>
              <TabsTrigger value="players">
                Players {results.players.length > 0 && <Badge variant="muted" className="ml-1">{results.players.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="tournaments">
                Events {results.tournaments.length > 0 && <Badge variant="muted" className="ml-1">{results.tournaments.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="hands">
                Hands {results.hands.length > 0 && <Badge variant="muted" className="ml-1">{results.hands.length}</Badge>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="players">
              <div className="space-y-2">
                {results.players.map(p => (
                  <button key={p.id} onClick={() => setDetail({ type: 'player', id: p.id })} className="w-full text-left">
                    <Card className="flex items-center gap-3 hover:border-border-light transition-colors">
                      <PlayerAvatar initials={p.initials} color={p.color} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-text-primary text-sm">{p.name}</span>
                          <span>{p.flag}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant={p.status === 'winner' ? 'success' : 'muted'} className="text-[10px]">#{p.finish}</Badge>
                          {STYLES[p.id] && (
                            <span className="text-[10px] text-text-muted">{STYLES[p.id].emoji} {STYLES[p.id].label}</span>
                          )}
                          {STATS[p.id] && (
                            <span className="text-[10px] text-text-muted">VPIP {STATS[p.id].vpip}%</span>
                          )}
                        </div>
                      </div>
                    </Card>
                  </button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tournaments">
              <div className="space-y-2">
                {results.tournaments.map(t => <TournamentCard key={t.id} tournament={t} />)}
              </div>
            </TabsContent>

            <TabsContent value="hands">
              <div className="space-y-2">
                {results.hands.map(h => <HandCard key={h.id} highlight={h} />)}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <p className="text-center text-text-muted text-sm py-8">No results for "{query}"</p>
        )
      ) : (
        /* Default content when no query */
        <div className="space-y-5">
          {/* Featured tournament */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-accent-amber" />
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Featured Event</h2>
            </div>
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/5 to-accent-purple/5" />
              <div className="relative space-y-2">
                <h3 className="font-bold text-text-primary">{TOURNAMENT.name}</h3>
                <p className="text-xs text-text-muted">{TOURNAMENT.event} &middot; {TOURNAMENT.venue}</p>
                <div className="flex gap-3 text-xs text-text-secondary">
                  <span>{TOURNAMENT.playerCount} players</span>
                  <span>{TOURNAMENT.handCount} hands</span>
                  <span className="text-accent-amber font-medium">{fmtChips(TOURNAMENT.prizePool)}</span>
                </div>
              </div>
            </Card>
          </section>

          {/* Top players horizontal scroll */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-accent-amber" />
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Top Players</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {PLAYERS.slice(0, 6).map(p => (
                <button
                  key={p.id}
                  onClick={() => setDetail({ type: 'player', id: p.id })}
                  className="shrink-0"
                >
                  <Card className="w-28 text-center hover:border-border-light transition-colors space-y-2">
                    <div className="flex justify-center">
                      <PlayerAvatar initials={p.initials} color={p.color} />
                    </div>
                    <div className="text-xs font-medium text-text-primary truncate">{p.name.split(' ').pop()}</div>
                    <Badge variant={p.status === 'winner' ? 'success' : p.status === 'runner-up' ? 'warning' : 'muted'} className="text-[10px]">
                      #{p.finish}
                    </Badge>
                    {STATS[p.id] && (
                      <div className="text-[10px] text-text-muted">
                        VPIP {STATS[p.id].vpip}% &middot; AF {STATS[p.id].af}
                      </div>
                    )}
                  </Card>
                </button>
              ))}
            </div>
          </section>

          {/* Key hands */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-accent-emerald" />
              <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Key Hands</h2>
            </div>
            <div className="space-y-2">
              {HIGHLIGHTS.slice(0, 3).map(h => <HighlightCard key={h.id} highlight={h} />)}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function PlayerDetail({ player, onBack }: { player: Player; onBack: () => void }) {
  const dims = PLAYER_DIMENSIONS[player.id]
  const stats = STATS[player.id]
  const style = STYLES[player.id]
  const rating = SKILL_RATINGS[player.id]
  const identity = PLAYER_IDENTITIES[player.id]
  const strengths = PLAYER_STRENGTHS_DATA[player.id] ?? []
  const leaks = PLAYER_LEAKS_DATA[player.id] ?? []
  const playerHands = HIGHLIGHTS.filter(h => h.players.includes(player.id))

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-xs text-accent-blue hover:text-accent-blue/80 flex items-center gap-1">
        &larr; Back to search
      </button>

      <div className="flex items-center gap-4">
        <PlayerAvatar initials={player.initials} color={player.color} size="lg" />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-text-primary">{player.name}</h1>
            <span>{player.flag}</span>
          </div>
          {style && <p className="text-xs text-text-muted">{style.emoji} {style.label}</p>}
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={player.status === 'winner' ? 'success' : 'muted'}>#{player.finish}</Badge>
            {rating && <span className="text-xs font-bold" style={{ color: rating.color }}>{rating.grade}</span>}
          </div>
        </div>
      </div>

      {identity && <p className="text-sm text-text-secondary italic">{identity}</p>}

      {dims && (
        <div className="flex justify-center">
          <RadarChart dimensions={dims} color={player.color} size={180} />
        </div>
      )}

      {stats && <StatsGrid stats={stats} />}

      <ScoutingReport playerId={player.id} />

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
            {leaks.slice(0, 3).map((l, i) => (
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

      {playerHands.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Key Hands</h3>
          <div className="space-y-2">
            {playerHands.map(h => <HandCard key={h.id} highlight={h} />)}
          </div>
        </div>
      )}
    </div>
  )
}
