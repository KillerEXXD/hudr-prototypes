import { useState } from 'react'
import { Heart, Share2, Bookmark, Play, Trophy, Sparkles, Brain, Eye } from 'lucide-react'
import {
  PLAYERS, TOURNAMENT, HIGHLIGHTS, INSIGHTS, QUIZ_HANDS, BLUFF_REPORT,
  STATS, PLAYER_DIMENSIONS, PLAYER_IDENTITIES, STYLES, SKILL_RATINGS,
} from '@/data'
import { Card, Badge, Button } from '@/components/ui'
import { PlayerAvatar } from '@/components/player'
import { RadarChart } from '@/components/charts'
import { CommunityCards } from '@/components/hand'
import { QuizCard } from '@/components/ai'
import { fmtChips, cn } from '@/lib/utils'

function SocialActions(_props: { id: string }) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)

  return (
    <div className="flex items-center gap-1 pt-2 border-t border-border/50">
      <button
        onClick={() => setLiked(!liked)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors',
          liked ? 'text-accent-red bg-accent-red/10' : 'text-text-muted hover:text-text-secondary hover:bg-bg-surface'
        )}
      >
        <Heart className={cn('w-3.5 h-3.5', liked && 'fill-current')} />
        {liked ? 'Liked' : 'Like'}
      </button>
      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-secondary hover:bg-bg-surface transition-colors">
        <Share2 className="w-3.5 h-3.5" />
        Share
      </button>
      <button
        onClick={() => setSaved(!saved)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ml-auto',
          saved ? 'text-accent-amber bg-accent-amber/10' : 'text-text-muted hover:text-text-secondary hover:bg-bg-surface'
        )}
      >
        <Bookmark className={cn('w-3.5 h-3.5', saved && 'fill-current')} />
      </button>
    </div>
  )
}

function TournamentHeroCard() {
  return (
    <Card className="relative overflow-hidden p-0">
      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-accent-amber" />
          <Badge variant="success">Completed</Badge>
        </div>
        <h2 className="text-lg font-bold text-white">{TOURNAMENT.name}</h2>
        <p className="text-xs text-gray-400 mt-1">{TOURNAMENT.event} &middot; {TOURNAMENT.venue}</p>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div>
            <div className="text-[10px] text-gray-500 uppercase">Players</div>
            <div className="text-lg font-bold text-white">{TOURNAMENT.playerCount}</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase">Hands</div>
            <div className="text-lg font-bold text-white">{TOURNAMENT.handCount}</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase">Prize</div>
            <div className="text-lg font-bold text-accent-amber">{fmtChips(TOURNAMENT.prizePool)}</div>
          </div>
        </div>
        {/* Winner bar */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-3">
          <PlayerAvatar initials={PLAYERS[0].initials} color={PLAYERS[0].color} size="sm" />
          <div>
            <div className="text-xs text-gray-400">Winner</div>
            <div className="text-sm font-bold text-white">{PLAYERS[0].name}</div>
          </div>
        </div>
      </div>
      <div className="px-5 py-3">
        <SocialActions id="hero" />
      </div>
    </Card>
  )
}

function PlayerSpotlightCard({ player }: { player: typeof PLAYERS[0] }) {
  const dims = PLAYER_DIMENSIONS[player.id]
  const style = STYLES[player.id]
  const rating = SKILL_RATINGS[player.id]
  const identity = PLAYER_IDENTITIES[player.id]
  const stats = STATS[player.id]

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PlayerAvatar initials={player.initials} color={player.color} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-text-primary">{player.name}</span>
              <span>{player.flag}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {style && <span className="text-xs text-text-muted">{style.emoji} {style.label}</span>}
              {rating && <span className="text-xs font-bold" style={{ color: rating.color }}>{rating.grade}</span>}
            </div>
          </div>
        </div>
        <Badge variant={player.status === 'winner' ? 'success' : player.status === 'runner-up' ? 'warning' : 'muted'}>
          #{player.finish}
        </Badge>
      </div>

      {identity && <p className="text-xs text-text-secondary italic leading-relaxed">{identity}</p>}

      <div className="flex items-center gap-4">
        {dims && (
          <div className="shrink-0">
            <RadarChart dimensions={dims} color={player.color} size={120} />
          </div>
        )}
        {stats && (
          <div className="flex-1 grid grid-cols-2 gap-1.5">
            {[
              { label: 'VPIP', value: `${stats.vpip}%` },
              { label: 'PFR', value: `${stats.pfr}%` },
              { label: 'AF', value: stats.af.toFixed(1) },
              { label: 'WSD', value: `${stats.wsd}%` },
            ].map(s => (
              <div key={s.label} className="bg-bg-surface rounded-lg px-2 py-1.5 text-center">
                <div className="text-[10px] text-text-muted">{s.label}</div>
                <div className="text-xs font-bold text-text-primary">{s.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SocialActions id={`player-${player.id}`} />
    </Card>
  )
}

function HandHighlightCard({ highlight }: { highlight: typeof HIGHLIGHTS[0] }) {
  const players = highlight.players.map(pid => PLAYERS.find(p => p.id === pid)).filter(Boolean)

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-accent-amber" />
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Hand #{highlight.hand}</span>
        </div>
        <span className="text-sm font-bold text-accent-amber">{fmtChips(highlight.pot)}</span>
      </div>

      <p className="text-sm text-text-primary font-medium leading-relaxed">{highlight.preview}</p>

      <div className="flex items-center gap-2">
        {players.map(p => p && (
          <div key={p.id} className="flex items-center gap-1.5 bg-bg-surface rounded-full px-2 py-1">
            <PlayerAvatar initials={p.initials} color={p.color} size="sm" />
            <span className="text-xs text-text-secondary">{p.name.split(' ').pop()}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={
          highlight.type === 'biggest_pot' ? 'warning' :
          highlight.type === 'bluff' ? 'danger' :
          highlight.type === 'elimination' ? 'purple' :
          highlight.type === 'hero_call' ? 'success' :
          'default'
        }>
          {highlight.type.replace('_', ' ')}
        </Badge>
        <span className="text-xs text-text-muted">{highlight.board}</span>
      </div>

      <Button variant="secondary" size="sm" className="w-full gap-2">
        <Play className="w-3.5 h-3.5" />
        Watch Hand
      </Button>

      <SocialActions id={`hand-${highlight.id}`} />
    </Card>
  )
}

function AIInsightFeedCard({ insight }: { insight: typeof INSIGHTS[0] }) {
  return (
    <Card className="space-y-2 border-l-4" style={{ borderLeftColor: insight.border }}>
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-accent-blue" />
        <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">AI Insight</span>
      </div>
      <h3 className="text-sm font-bold text-text-primary">{insight.icon} {insight.title}</h3>
      <p className="text-xs text-text-secondary leading-relaxed">{insight.text}</p>
      <SocialActions id={`insight-${insight.id}`} />
    </Card>
  )
}

function BluffReportCard({ bluff }: { bluff: typeof BLUFF_REPORT[0] }) {
  const bluffer = PLAYERS.find(p => p.id === bluff.bluffer)
  const victim = PLAYERS.find(p => p.id === bluff.victim)

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-accent-purple" />
        <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">Bluff Report</span>
        <Badge variant={bluff.success ? 'success' : 'danger'} className="ml-auto">
          {bluff.success ? 'Success' : 'Caught'}
        </Badge>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {bluffer && <PlayerAvatar initials={bluffer.initials} color={bluffer.color} />}
          <div>
            <div className="text-xs font-medium text-text-primary">{bluffer?.name.split(' ').pop()}</div>
            <div className="text-[10px] text-text-muted">Bluffer</div>
          </div>
        </div>
        <span className="text-lg text-text-muted font-light">vs</span>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-xs font-medium text-text-primary">{victim?.name.split(' ').pop()}</div>
            <div className="text-[10px] text-text-muted">Target</div>
          </div>
          {victim && <PlayerAvatar initials={victim.initials} color={victim.color} />}
        </div>
      </div>

      <div className="flex gap-1">
        <CommunityCards cards={bluff.board} />
      </div>

      <div className="bg-bg-surface rounded-lg p-2 space-y-1">
        <div className="text-xs text-text-secondary">
          <span className="text-text-muted">Holding:</span> {bluff.holding}
        </div>
        <div className="text-xs text-text-secondary">
          <span className="text-text-muted">Sizing:</span> {bluff.sizing} on the {bluff.street.toLowerCase()}
        </div>
      </div>

      <SocialActions id={`bluff-${bluff.hand}`} />
    </Card>
  )
}

export default function PrismHome() {
  // Interleave different card types for feed variety
  const feedItems: { type: string; key: string; node: React.ReactNode }[] = [
    { type: 'hero', key: 'hero', node: <TournamentHeroCard /> },
    { type: 'player', key: 'p1', node: <PlayerSpotlightCard player={PLAYERS[0]} /> },
    { type: 'hand', key: 'h1', node: <HandHighlightCard highlight={HIGHLIGHTS[0]} /> },
    { type: 'insight', key: 'i1', node: <AIInsightFeedCard insight={INSIGHTS[0]} /> },
    { type: 'player', key: 'p2', node: <PlayerSpotlightCard player={PLAYERS[1]} /> },
    { type: 'hand', key: 'h2', node: <HandHighlightCard highlight={HIGHLIGHTS[2]} /> },
    { type: 'quiz', key: 'q1', node: (
      <Card className="space-y-2">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-accent-purple" />
          <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">Test Your Skills</span>
        </div>
        <QuizCard quiz={QUIZ_HANDS[0]} />
        <SocialActions id="quiz-1" />
      </Card>
    )},
    { type: 'bluff', key: 'b1', node: <BluffReportCard bluff={BLUFF_REPORT[0]} /> },
    { type: 'player', key: 'p3', node: <PlayerSpotlightCard player={PLAYERS[2]} /> },
    { type: 'insight', key: 'i2', node: <AIInsightFeedCard insight={INSIGHTS[1]} /> },
    { type: 'hand', key: 'h3', node: <HandHighlightCard highlight={HIGHLIGHTS[3]} /> },
    { type: 'bluff', key: 'b2', node: <BluffReportCard bluff={BLUFF_REPORT[1]} /> },
  ]

  return (
    <div className="space-y-4">
      {/* Stories-style dot indicators */}
      <div className="flex items-center justify-center gap-1.5">
        {PLAYERS.slice(0, 7).map((p, i) => (
          <div
            key={p.id}
            className={cn(
              'rounded-full border-2 p-0.5 transition-all',
              i === 0 ? 'border-accent-blue' : 'border-border'
            )}
          >
            <PlayerAvatar initials={p.initials} color={p.color} size="sm" />
          </div>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {feedItems.map(item => (
          <div key={item.key}>
            {item.node}
          </div>
        ))}
      </div>
    </div>
  )
}
