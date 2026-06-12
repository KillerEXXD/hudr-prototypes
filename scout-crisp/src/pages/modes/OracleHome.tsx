import { useState, useRef, useEffect, type ReactNode } from 'react'
import { Send, Sparkles } from 'lucide-react'
import {
  PLAYERS, HIGHLIGHTS, INSIGHTS, QUIZ_HANDS, BLUFF_REPORT,
  STATS, PLAYER_DIMENSIONS, PLAYER_IDENTITIES, STYLES,
  PLAYER_STRENGTHS_DATA, PLAYER_LEAKS_DATA, SCOUTING_TEXT,
  AI_COMMENTARY_SEGMENTS,
} from '@/data'
import { Card, Button, Input, Badge } from '@/components/ui'
import { PlayerAvatar, StatsGrid } from '@/components/player'
import { RadarChart } from '@/components/charts'
import { HandCard, CommunityCards } from '@/components/hand'
import { InsightCard, QuizCard } from '@/components/ai'
import { HighlightCard } from '@/components/tournament'
import { cn } from '@/lib/utils'

interface ChatMessage {
  role: 'ai' | 'user'
  text: string
  cards?: ReactNode
  suggestions?: string[]
}

const WELCOME_SUGGESTIONS = [
  'Scout Negreanu',
  'Tournament highlights',
  'Key hands',
  'Quiz me',
  'Bluff report',
  'Compare players',
  'Insights',
]

function matchCommand(text: string): ChatMessage {
  const lower = text.toLowerCase().trim()

  // Scout a player
  if (lower.startsWith('scout')) {
    const nameQuery = lower.replace('scout', '').trim()
    const player = PLAYERS.find(p => p.name.toLowerCase().includes(nameQuery))
    if (player) {
      const dims = PLAYER_DIMENSIONS[player.id]
      const stats = STATS[player.id]
      const identity = PLAYER_IDENTITIES[player.id]
      const style = STYLES[player.id]
      const strengths = PLAYER_STRENGTHS_DATA[player.id] ?? []
      const leaks = PLAYER_LEAKS_DATA[player.id] ?? []
      const scoutText = SCOUTING_TEXT[player.id]

      return {
        role: 'ai',
        text: `Here's my full scouting report on ${player.name}:`,
        cards: (
          <div className="space-y-3">
            <Card className="flex items-center gap-3">
              <PlayerAvatar initials={player.initials} color={player.color} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text-primary">{player.name}</span>
                  <span>{player.flag}</span>
                </div>
                {style && <p className="text-xs text-text-muted">{style.emoji} {style.label}</p>}
                <Badge variant={player.status === 'winner' ? 'success' : 'muted'}>#{player.finish}</Badge>
              </div>
            </Card>
            {identity && <p className="text-xs text-text-secondary italic">{identity}</p>}
            {dims && (
              <div className="flex justify-center bg-bg-card rounded-xl p-2">
                <RadarChart dimensions={dims} color={player.color} size={160} />
              </div>
            )}
            {stats && <StatsGrid stats={stats} />}
            {scoutText && (
              <Card className="border-l-4 border-l-accent-blue">
                <p className="text-xs text-text-secondary leading-relaxed">{scoutText}</p>
              </Card>
            )}
            {strengths.length > 0 && (
              <div className="space-y-1">
                {strengths.slice(0, 2).map((s, i) => (
                  <div key={i} className="text-xs text-text-secondary">
                    <span className="text-accent-emerald font-medium">{s.title}</span>: {s.desc}
                  </div>
                ))}
              </div>
            )}
            {leaks.length > 0 && (
              <div className="space-y-1">
                {leaks.slice(0, 2).map((l, i) => (
                  <div key={i} className="text-xs text-text-secondary">
                    <span className="text-accent-red font-medium">{l.title}</span>: {l.desc}
                  </div>
                ))}
              </div>
            )}
          </div>
        ),
        suggestions: [`Compare ${player.name.split(' ').pop()} vs Ivey`, `${player.name.split(' ').pop()}'s key hands`, 'Quiz me'],
      }
    }
    return {
      role: 'ai',
      text: `I couldn't find a player matching "${nameQuery}". Try one of: ${PLAYERS.map(p => p.name.split(' ').pop()).join(', ')}`,
      suggestions: PLAYERS.slice(0, 3).map(p => `Scout ${p.name.split(' ').pop()}`),
    }
  }

  // Highlights
  if (lower.includes('highlight')) {
    return {
      role: 'ai',
      text: 'Here are the key highlights from the tournament:',
      cards: (
        <div className="space-y-2">
          {HIGHLIGHTS.map(h => <HighlightCard key={h.id} highlight={h} />)}
        </div>
      ),
      suggestions: ['Tell me about the biggest pot', 'Bluff report', 'Quiz me'],
    }
  }

  // Key hands
  if (lower.includes('hand') || lower.includes('key')) {
    return {
      role: 'ai',
      text: 'These were the pivotal hands that shaped the tournament:',
      cards: (
        <div className="space-y-2">
          {HIGHLIGHTS.slice(0, 4).map(h => <HandCard key={h.id} highlight={h} />)}
        </div>
      ),
      suggestions: ['Scout the winner', 'Bluff report', 'Insights'],
    }
  }

  // Quiz
  if (lower.includes('quiz')) {
    const quiz = QUIZ_HANDS[Math.floor(Math.random() * QUIZ_HANDS.length)]
    return {
      role: 'ai',
      text: 'Let\'s test your poker IQ. Here\'s a real situation from the final table:',
      cards: <QuizCard quiz={quiz} />,
      suggestions: ['Another quiz', 'Scout the pro', 'Highlights'],
    }
  }

  // Bluff report
  if (lower.includes('bluff')) {
    return {
      role: 'ai',
      text: `I tracked ${BLUFF_REPORT.length} significant bluffs during the final table:`,
      cards: (
        <div className="space-y-2">
          {BLUFF_REPORT.map((b, i) => {
            const bluffer = PLAYERS.find(p => p.id === b.bluffer)
            const victim = PLAYERS.find(p => p.id === b.victim)
            return (
              <Card key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {bluffer && <PlayerAvatar initials={bluffer.initials} color={bluffer.color} size="sm" />}
                    <span className="text-xs text-text-muted">vs</span>
                    {victim && <PlayerAvatar initials={victim.initials} color={victim.color} size="sm" />}
                  </div>
                  <Badge variant={b.success ? 'success' : 'danger'}>{b.success ? 'Success' : 'Caught'}</Badge>
                </div>
                <div className="flex gap-1">
                  <CommunityCards cards={b.board} />
                </div>
                <div className="text-xs text-text-secondary">
                  <span className="font-medium">{bluffer?.name.split(' ').pop()}</span> held {b.holding} &mdash; {b.sizing} on the {b.street.toLowerCase()}
                </div>
              </Card>
            )
          })}
        </div>
      ),
      suggestions: ['Scout the biggest bluffer', 'Key hands', 'Quiz me'],
    }
  }

  // Compare players
  if (lower.includes('compare')) {
    const p1 = PLAYERS[0]
    const p2 = PLAYERS[1]
    const s1 = STATS[p1.id]
    const s2 = STATS[p2.id]
    return {
      role: 'ai',
      text: `Head-to-head comparison: ${p1.name} vs ${p2.name}`,
      cards: (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Card className="text-center space-y-2">
              <PlayerAvatar initials={p1.initials} color={p1.color} size="lg" className="mx-auto" />
              <div className="text-sm font-bold text-text-primary">{p1.name.split(' ').pop()}</div>
              <Badge variant="success">#{p1.finish}</Badge>
            </Card>
            <Card className="text-center space-y-2">
              <PlayerAvatar initials={p2.initials} color={p2.color} size="lg" className="mx-auto" />
              <div className="text-sm font-bold text-text-primary">{p2.name.split(' ').pop()}</div>
              <Badge variant="warning">#{p2.finish}</Badge>
            </Card>
          </div>
          {s1 && s2 && (
            <div className="space-y-1">
              {[
                { label: 'VPIP', v1: s1.vpip, v2: s2.vpip, fmt: (v: number) => `${v}%` },
                { label: 'PFR', v1: s1.pfr, v2: s2.pfr, fmt: (v: number) => `${v}%` },
                { label: 'AF', v1: s1.af, v2: s2.af, fmt: (v: number) => v.toFixed(1) },
                { label: 'WSD', v1: s1.wsd, v2: s2.wsd, fmt: (v: number) => `${v}%` },
                { label: '3-Bet', v1: s1.threeBet, v2: s2.threeBet, fmt: (v: number) => `${v}%` },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-2 text-xs">
                  <span className={cn('w-12 text-right font-mono', row.v1 > row.v2 ? 'text-accent-emerald' : 'text-text-secondary')}>
                    {row.fmt(row.v1)}
                  </span>
                  <div className="flex-1 text-center text-text-muted">{row.label}</div>
                  <span className={cn('w-12 text-left font-mono', row.v2 > row.v1 ? 'text-accent-emerald' : 'text-text-secondary')}>
                    {row.fmt(row.v2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
      suggestions: [`Scout ${p1.name.split(' ').pop()}`, `Scout ${p2.name.split(' ').pop()}`, 'Key hands'],
    }
  }

  // Insights
  if (lower.includes('insight')) {
    return {
      role: 'ai',
      text: 'Here are the top AI-generated insights from the tournament:',
      cards: (
        <div className="space-y-2">
          {INSIGHTS.map(i => <InsightCard key={i.id} insight={i} />)}
        </div>
      ),
      suggestions: ['Scout the winner', 'Bluff report', 'Compare players'],
    }
  }

  // Commentary
  if (lower.includes('comment') || lower.includes('narrat') || lower.includes('story')) {
    return {
      role: 'ai',
      text: 'Here are key commentary moments from the broadcast:',
      cards: (
        <div className="space-y-2">
          {AI_COMMENTARY_SEGMENTS.map(c => (
            <Card key={c.id} className={cn(
              'border-l-4',
              c.mood === 'dramatic' ? 'border-l-accent-red' : c.mood === 'tense' ? 'border-l-accent-amber' : 'border-l-accent-blue'
            )}>
              <div className="text-[10px] text-text-muted mb-1">Hand #{c.hand} &middot; {c.timestamp}</div>
              <p className="text-xs text-text-secondary leading-relaxed italic">{c.text}</p>
            </Card>
          ))}
        </div>
      ),
      suggestions: ['Key hands', 'Insights', 'Quiz me'],
    }
  }

  // Default
  return {
    role: 'ai',
    text: "I'm not sure what you're looking for. Try asking about a specific player, tournament highlights, hands, or bluffs.",
    suggestions: ['Scout Negreanu', 'Highlights', 'Quiz me'],
  }
}

export default function OracleHome() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'ai',
      text: "I've analyzed the WSOP Main Event 2025 Final Table. 87 hands, 9 players, $93.5M prize pool. What would you like to know?",
      suggestions: WELCOME_SUGGESTIONS,
    },
  ])
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = (text: string) => {
    if (!text.trim()) return
    const userMsg: ChatMessage = { role: 'user', text }
    const aiMsg = matchCommand(text)
    setMessages(prev => [...prev, userMsg, aiMsg])
    setInput('')
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((msg, i) => (
          <div key={i}>
            {/* Message bubble */}
            <div className={cn(
              'flex gap-2',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}>
              {msg.role === 'ai' && (
                <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className={cn(
                'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                msg.role === 'user'
                  ? 'bg-accent-blue text-white rounded-br-md'
                  : 'bg-bg-card border border-border text-text-secondary rounded-bl-md'
              )}>
                {msg.text}
              </div>
            </div>

            {/* Inline cards */}
            {msg.cards && (
              <div className="mt-2 ml-9">
                {msg.cards}
              </div>
            )}

            {/* Follow-up suggestions */}
            {msg.suggestions && (
              <div className="mt-2 ml-9 flex flex-wrap gap-1.5">
                {msg.suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-bg-surface text-accent-blue hover:bg-accent-blue/10 border border-border hover:border-accent-blue/30 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input bar */}
      <div className="shrink-0 flex gap-2 pt-3 border-t border-border">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend(input)}
          placeholder="Ask about the tournament..."
          className="text-sm h-10"
        />
        <Button size="icon" className="h-10 w-10 shrink-0" onClick={() => handleSend(input)}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
