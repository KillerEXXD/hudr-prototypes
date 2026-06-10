import { useEffect, useMemo, useRef, useState } from 'react'
import { Send, Sparkles, Bot, User, Lightbulb } from 'lucide-react'
import { useMode } from '@/contexts/ModeContext'
import { useSuggestedQuestions } from '@/hooks'
import type { PlayerProfile, StatKey } from '@/engine'
import SuggestedQuestions from './SuggestedQuestions'
import { cn } from '@/lib/utils'

interface Msg { role: 'user' | 'ai'; text: string }

// Deterministic per-player "AI" — answers composed ONLY from this player's
// computed profile (mirrors the spec: the narrator never invents numbers).
function answer(q: string, p: PlayerProfile, isPro: boolean): string {
  const ql = q.toLowerCase()
  const first = p.name.split(' ')[0]
  const top = p.exploits[0]
  const stat = (k: StatKey) => p.stats.find((s) => s.key === k)

  if (/(weak|leak|beat|exploit|how do i|counter)/.test(ql)) {
    if (!top) return isPro
      ? 'No leak crosses an exploit threshold at RELIABLE tier under this filter. Widen the scope to Career to confirm, otherwise treat them as solid.'
      : `${first} doesn’t show a clear weakness at this filter. Play straight, value-bet your strong hands, and don’t get fancy.`
    return isPro
      ? `Top leak: ${top.title.toLowerCase()} — ${top.triggerStat} ${top.triggerValue}% (severity ${top.severity}, ${top.tier}). Counter: ${top.counterText} Watch: ${top.confirmationStat}`
      : `${top.plainCounter}`
  }
  if (/(bluff)/.test(ql)) {
    const f = stat('foldToCbetFlop')
    if (!f || f.tier === 'NOISE') return `Not enough hands to know how often ${first} folds yet — widen the scope first.`
    return isPro
      ? `${first} folds to flop c-bets ${f.value}% (${f.tier}). ${f.value > 55 ? 'Bluff-bet flops relentlessly in position.' : 'Be selective — they don’t over-fold.'}`
      : f.value > 55
        ? `Yes — ${first} folds to bets a lot. Fire a bet on the flop and you’ll often just take the pot.`
        : `Not really — ${first} doesn’t fold much, so save bluffs and bet your good hands instead.`
  }
  if (/(style|type|play|aggress|loose|tight|how do they)/.test(ql)) {
    return isPro ? p.narrative.proSummary : p.narrative.typePlain
  }
  if (/(showdown|call|station|wtsd)/.test(ql)) {
    const w = stat('wtsd'); const s = stat('wsd')
    if (!w || w.tier === 'NOISE') return `Not enough showdown hands on ${first} yet at this filter.`
    return isPro
      ? `WTSD ${w.value}% / W$SD ${s?.value ?? '—'}%. ${(s?.value ?? 99) < 52 ? 'Calls too light — value bet thin, never triple-barrel bluff.' : 'Picks showdowns well — respect their calls.'}`
      : `${first} ${w.value > 35 ? 'likes to see the end of the hand' : 'folds before showdown a lot'} — ${(s?.value ?? 99) < 52 ? 'so value-bet your good hands and don’t bluff.' : 'and usually has it when they get there.'}`
  }
  if (/(plan|strategy|approach)/.test(ql)) {
    return (isPro ? p.narrative.gamePlanPro : p.narrative.gamePlanPlain).map((g, i) => `${i + 1}. ${g}`).join('  ')
  }
  return `${p.narrative.summary} Ask me about their biggest weakness, their style, or whether you can bluff them.`
}

export default function PlayerChat({ profile }: { profile: PlayerProfile }) {
  const { isPro } = useMode()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [pulse, setPulse] = useState(0)
  const endRef = useRef<HTMLDivElement>(null)
  const first = profile.name.split(' ')[0]
  const { data: raw = [] } = useSuggestedQuestions('player')
  const [bumps, setBumps] = useState<Record<string, number>>({})
  const [showSuggest, setShowSuggest] = useState(false)
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
    setMessages((m) => [...m, { role: 'user', text: q }, { role: 'ai', text: answer(q, profile, isPro) }])
    setInput(''); setShowSuggest(false)
  }
  function pick(q: string) { setBumps((b) => ({ ...b, [q]: (b[q] || 0) + 1 })); ask(q) }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-bg-card">
      <div className="max-h-[44vh] min-h-[180px] flex-1 overflow-y-auto scrollbar-thin p-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center px-2 py-5 text-center">
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent-blue/15">
              <Sparkles className="h-5 w-5 text-accent-blue" />
            </span>
            <h3 className="text-base font-bold text-text-primary">Ask anything about {first}</h3>
            <p className="mt-1 max-w-xs text-xs text-text-muted">
              {isPro ? 'Answers are composed only from this player’s computed stats & exploits.' : `Plain-English answers about how ${first} plays and how to beat them.`}
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
            <span className="text-xs font-semibold text-text-secondary">Popular questions about {first}</span>
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
          placeholder={`Ask about ${first}…`}
          className="flex-1 rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue"
        />
        <button type="submit" className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-blue text-white hover:bg-accent-blue/90 cursor-pointer transition-colors" aria-label="Send">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
