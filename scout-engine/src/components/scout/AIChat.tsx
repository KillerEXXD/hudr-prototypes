import { useEffect, useMemo, useRef, useState } from 'react'
import { Send, Sparkles, Bot, User, Lightbulb } from 'lucide-react'
import { useMode } from '@/contexts/ModeContext'
import { useSuggestedQuestions } from '@/hooks'
import type { PlayerProfile } from '@/engine'
import SuggestedQuestions from './SuggestedQuestions'
import { cn } from '@/lib/utils'

interface Msg { role: 'user' | 'ai'; text: string }

const lastName = (name: string) => name.split(' ').slice(-1)[0]

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
  if (/(most hands|loose|wide|vpip|steal)/.test(ql)) {
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
  if (/(call|station|showdown|light)/.test(ql)) {
    const station = [...profiles].sort((a, b) => (b.stats.find(s => s.key === 'wtsd')?.value ?? 0) - (a.stats.find(s => s.key === 'wtsd')?.value ?? 0))[0]
    const w = station.stats.find((s) => s.key === 'wtsd')!
    return isPro
      ? `${station.name} has the highest WTSD (${w.value}%). Value bet thin, never triple-barrel bluff.`
      : `${station.name.split(' ')[0]} calls down the most — bet your good hands for value and skip the bluffs.`
  }
  const archetypes = profiles.map((p) => `${lastName(p.name)}: ${p.typing.archetype}`).join(', ')
  return isPro
    ? `Table read — ${archetypes}. Ask about a specific player or "who is most exploitable" to drill in.`
    : `I’ve sized up the table. Ask me who to target, who to avoid, or who you can bluff.`
}

export default function AIChat({ profiles }: { profiles: PlayerProfile[] }) {
  const { isPro } = useMode()
  const { data: raw = [] } = useSuggestedQuestions('tournament')
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [pulse, setPulse] = useState(0)
  const [bumps, setBumps] = useState<Record<string, number>>({})
  const [showSuggest, setShowSuggest] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const questions = useMemo(
    () => raw.map((q) => ({ ...q, askedCount: q.askedCount + (bumps[q.text] || 0) })).sort((a, b) => b.askedCount - a.askedCount),
    [raw, bumps],
  )

  useEffect(() => {
    if (messages.length > 0 || questions.length === 0) return
    const t = setInterval(() => setPulse((p) => (p + 1) % questions.length), 1800)
    return () => clearInterval(t)
  }, [messages.length, questions.length])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, showSuggest])

  function ask(q: string) {
    if (!q.trim()) return
    setMessages((m) => [...m, { role: 'user', text: q }, { role: 'ai', text: answer(q, profiles, isPro) }])
    setInput(''); setShowSuggest(false)
  }
  function pick(q: string) { setBumps((b) => ({ ...b, [q]: (b[q] || 0) + 1 })); ask(q) }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-bg-card">
      <div className="max-h-[46vh] min-h-[200px] flex-1 overflow-y-auto scrollbar-thin p-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center px-2 py-6 text-center">
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent-blue/15">
              <Sparkles className="h-5 w-5 text-accent-blue" />
            </span>
            <h3 className="text-base font-bold text-text-primary">Ask anything or tap a popular question</h3>
            <p className="mt-1 max-w-xs text-xs text-text-muted">
              {isPro ? 'Answers are composed only from computed stats & exploits — no invented reads.' : 'Get plain-English answers about who to target and how to play this table.'}
            </p>
            <SuggestedQuestions className="mt-4 w-full" questions={questions} onPick={pick} pulseIndex={pulse} />
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div key={i}>
                <div className={cn('flex gap-2', m.role === 'user' ? 'flex-row-reverse' : '')}>
                  <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', m.role === 'user' ? 'bg-accent-purple/20 text-accent-purple' : 'bg-accent-blue/15 text-accent-blue')}>
                    {m.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                  </span>
                  <div className={cn('max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-snug', m.role === 'user' ? 'bg-accent-blue text-white' : 'bg-bg-surface text-text-primary')}>
                    {m.text}
                  </div>
                </div>
                {m.role === 'ai' && (
                  <button type="button" onClick={() => setShowSuggest(true)} className="ml-9 mt-1 flex items-center gap-1 text-[11px] font-medium text-accent-blue hover:underline cursor-pointer">
                    <Lightbulb className="h-3 w-3" /> Suggested questions
                  </button>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {showSuggest && messages.length > 0 && (
        <div className="border-t border-border p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-text-secondary">Popular questions</span>
            <button onClick={() => setShowSuggest(false)} className="text-xs text-text-muted hover:text-text-primary cursor-pointer">Close</button>
          </div>
          <SuggestedQuestions questions={questions} onPick={pick} />
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); ask(input) }} className="flex items-center gap-2 border-t border-border p-2.5">
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => setShowSuggest((s) => !s)}
            title="Suggested questions"
            aria-label="Suggested questions"
            className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border transition-colors cursor-pointer', showSuggest ? 'bg-accent-blue/15 text-accent-blue' : 'text-text-muted hover:text-text-primary')}
          >
            <Lightbulb className="h-4 w-4" />
          </button>
        )}
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
