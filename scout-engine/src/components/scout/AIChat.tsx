import { useEffect, useMemo, useRef, useState } from 'react'
import { Send, Sparkles, Bot, User } from 'lucide-react'
import { useMode } from '@/contexts/ModeContext'
import { getProfile } from '@/engine'
import type { PlayerProfile } from '@/engine'
import { PLAYERS } from '@/data'
import { cn } from '@/lib/utils'

interface Msg { role: 'user' | 'ai'; text: string }

const SUGGESTIONS = [
  'Who is the most exploitable player?',
  'Who should I avoid tangling with?',
  'Who plays the most hands?',
  'Who can I bluff?',
]

function nameOf(id: string) { return PLAYERS.find((p) => p.id === id)?.name.split(' ').slice(-1)[0] ?? id }

// Deterministic mock "AI" — answers are composed ONLY from computed profiles,
// mirroring the spec rule that the narrative layer never invents numbers.
function answer(q: string, profiles: PlayerProfile[], isPro: boolean): string {
  const ql = q.toLowerCase()
  const withExploits = profiles.filter((p) => p.exploits.length > 0)
  const topTarget = [...withExploits].sort((a, b) => (b.exploits[0]?.severity ?? 0) - (a.exploits[0]?.severity ?? 0))[0]

  if (/(exploit|weak|target|beat)/.test(ql)) {
    if (!topTarget) return isPro
      ? 'No player at this table has a RELIABLE-tier leak that crosses an exploit threshold yet — samples are still thin.'
      : 'Nobody here has shown a clear, repeatable weakness yet — there just aren’t enough hands on them.'
    const e = topTarget.exploits[0]
    const first = topTarget.name.split(' ')[0]
    return isPro
      ? `${topTarget.name} is the prime target (${topTarget.typing.archetype}). Top leak: ${e.title.toLowerCase()} — ${e.triggerStat} ${e.triggerValue}% (severity ${e.severity}). Counter: ${e.counterText}`
      : `Go after ${first}. ${e.plainCounter}`
  }
  if (/(avoid|tough|hard|dangerous|best player)/.test(ql)) {
    const solid = [...profiles].sort((a, b) => a.exploits.length - b.exploits.length || b.typing.confidence - a.typing.confidence)[0]
    const first = solid.name.split(' ')[0]
    return isPro
      ? `${solid.name} (${solid.typing.archetype}, confidence ${Math.round(solid.typing.confidence * 100)}%) shows the fewest RELIABLE leaks — play straightforward and avoid bloating pots out of position.`
      : `Be careful with ${first} — they don’t give much away. Don’t try anything fancy; only play big pots with strong hands.`
  }
  if (/(most hands|loose|wide|vpip)/.test(ql)) {
    const loosest = [...profiles].sort((a, b) => (b.stats.find(s => s.key === 'vpip')?.value ?? 0) - (a.stats.find(s => s.key === 'vpip')?.value ?? 0))[0]
    const vp = loosest.stats.find((s) => s.key === 'vpip')!
    return isPro
      ? `${loosest.name} is widest at VPIP ${vp.value}% (${vp.tier}). Isolate them in position and value-bet relentlessly.`
      : `${loosest.name.split(' ')[0]} plays the most hands. Raise to play pots heads-up with them and bet your good hands hard.`
  }
  if (/(bluff)/.test(ql)) {
    const folder = [...profiles].sort((a, b) => (b.stats.find(s => s.key === 'foldToCbetFlop')?.value ?? 0) - (a.stats.find(s => s.key === 'foldToCbetFlop')?.value ?? 0))[0]
    const f = folder.stats.find((s) => s.key === 'foldToCbetFlop')!
    return isPro
      ? `${folder.name} folds to flop c-bets ${f.value}% (${f.tier}). Bluff-bet flops in position; back off if the sample is only TENTATIVE.`
      : `${folder.name.split(' ')[0]} folds to bets a lot — fire a bet on the flop and you’ll often just take the pot.`
  }
  // fallback summary
  const archetypes = profiles.map((p) => `${nameOf(p.playerId)}: ${p.typing.archetype}`).join(', ')
  return isPro
    ? `Table read — ${archetypes}. Ask about a specific player or "who is most exploitable" to drill in.`
    : `I’ve sized up the table. Ask me who to target, who to avoid, or who you can bluff.`
}

export default function AIChat({ playerIds }: { playerIds: string[] }) {
  const { isPro } = useMode()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [pulse, setPulse] = useState(0)
  const endRef = useRef<HTMLDivElement>(null)

  const profiles = useMemo(
    () => playerIds.map(getProfile).filter((p): p is PlayerProfile => !!p),
    [playerIds],
  )

  useEffect(() => {
    if (messages.length > 0) return
    const t = setInterval(() => setPulse((p) => (p + 1) % SUGGESTIONS.length), 1800)
    return () => clearInterval(t)
  }, [messages.length])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  function ask(q: string) {
    if (!q.trim()) return
    setMessages((m) => [...m, { role: 'user', text: q }, { role: 'ai', text: answer(q, profiles, isPro) }])
    setInput('')
  }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-bg-card">
      <div className="max-h-[46vh] min-h-[200px] flex-1 overflow-y-auto scrollbar-thin p-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center px-2 py-6 text-center">
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent-blue/15">
              <Sparkles className="h-5 w-5 text-accent-blue" />
            </span>
            <h3 className="text-base font-bold text-text-primary">Ask anything or tap a question below</h3>
            <p className="mt-1 max-w-xs text-xs text-text-muted">
              {isPro
                ? 'Answers are composed only from computed stats & exploits — no invented reads.'
                : 'Get plain-English answers about who to target and how to play this table.'}
            </p>
            <div className="mt-4 grid w-full gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-left text-sm transition-all cursor-pointer',
                    pulse === i
                      ? 'border-accent-amber/50 bg-accent-amber/10 text-text-primary scale-[1.02]'
                      : 'border-border bg-bg-surface/60 text-text-secondary hover:text-text-primary hover:border-border-light',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={cn('flex gap-2', m.role === 'user' ? 'flex-row-reverse' : '')}>
                <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', m.role === 'user' ? 'bg-accent-purple/20 text-accent-purple' : 'bg-accent-blue/15 text-accent-blue')}>
                  {m.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </span>
                <div className={cn('max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-snug', m.role === 'user' ? 'bg-accent-blue text-white' : 'bg-bg-surface text-text-primary')}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); ask(input) }}
        className="flex items-center gap-2 border-t border-border p-2.5"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this table…"
          className="flex-1 rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue"
        />
        <button type="submit" className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-blue text-white hover:bg-accent-blue/90 cursor-pointer transition-colors" aria-label="Send">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
