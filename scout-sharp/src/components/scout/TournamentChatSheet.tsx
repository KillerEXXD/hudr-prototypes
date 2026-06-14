import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Send, Sparkles, Bot, User, Lightbulb, X } from 'lucide-react'
import { useMode } from '@/contexts/ModeContext'
import { useSuggestedQuestions } from '@/hooks'
import type { PlayerProfile } from '@/engine'
import SuggestedQuestions from './SuggestedQuestions'
import { cn } from '@/lib/utils'

interface Msg { role: 'user' | 'ai'; text: string }

const lastName = (name: string) => name.split(' ').slice(-1)[0]
const byStat = (ps: PlayerProfile[], k: string, dir: 1 | -1 = 1) =>
  [...ps].sort((a, b) => ((b.stats.find((s) => s.key === k)?.value ?? 0) - (a.stats.find((s) => s.key === k)?.value ?? 0)) * dir)[0]

// Deterministic tournament "AI" — answers composed ONLY from the computed
// roster profiles (never invents numbers). Reasons across the whole table.
function answer(q: string, profiles: PlayerProfile[], isPro: boolean): string {
  const ql = q.toLowerCase()
  if (!profiles.length) return 'No player reads for this event yet — it hasn’t been played.'
  const withExploits = profiles.filter((p) => p.exploits.length > 0)
  const topTarget = [...withExploits].sort((a, b) => (b.exploits[0]?.severity ?? 0) - (a.exploits[0]?.severity ?? 0))[0]

  if (/(exploit|weak|target|beat|profit)/.test(ql)) {
    if (!topTarget) return isPro
      ? 'No player at this table has a RELIABLE-tier leak that crosses an exploit threshold yet — samples are still thin. Widen to Career on a player’s report to confirm.'
      : 'Nobody here has shown a clear, repeatable weakness yet — there just aren’t enough hands on them.'
    const e = topTarget.exploits[0]
    const first = topTarget.name.split(' ')[0]
    return isPro
      ? `${topTarget.name} is the prime target (${topTarget.typing.archetype}). Top leak: ${e.title.toLowerCase()} — ${e.triggerStat} ${e.triggerValue}% (severity ${e.severity}, ${e.tier}). Counter: ${e.counterText}`
      : `Go after ${first}. ${e.plainCounter}`
  }
  if (/(avoid|tough|hard|dangerous|best player|respect)/.test(ql)) {
    const solid = [...profiles].sort((a, b) => a.exploits.length - b.exploits.length || b.typing.confidence - a.typing.confidence)[0]
    const first = solid.name.split(' ')[0]
    return isPro
      ? `${solid.name} (${solid.typing.archetype}, sample ${Math.round(solid.typing.confidence * 100)}%) shows the fewest RELIABLE leaks — play straightforward and avoid bloating pots out of position.`
      : `Be careful with ${first} — they don’t give much away. Don’t try anything fancy; only play big pots with strong hands.`
  }
  if (/(most hands|loose|loosest|wide|vpip)/.test(ql)) {
    const loosest = byStat(profiles, 'vpip')
    const vp = loosest.stats.find((s) => s.key === 'vpip')!
    return isPro
      ? `${loosest.name} is widest at VPIP ${vp.value}% (${vp.tier}). Isolate them in position and value-bet relentlessly.`
      : `${loosest.name.split(' ')[0]} plays the most hands. Raise to play pots heads-up with them and bet your good hands hard.`
  }
  if (/(3-?bet|three.?bet|re-?raise|steal|open wide)/.test(ql)) {
    const folder = byStat(profiles, 'foldTo3Bet')
    const f = folder.stats.find((s) => s.key === 'foldTo3Bet')!
    return isPro
      ? `${folder.name} folds to 3-bets ${f.value}% (${f.tier}) — 3-bet their opens light. Conversely, steal widely against the tightest defenders.`
      : `Re-raise ${folder.name.split(' ')[0]} as a bluff — they fold to re-raises a lot.`
  }
  if (/(bluff)/.test(ql)) {
    const f0 = byStat(profiles, 'foldToCbetFlop')
    const f = f0.stats.find((s) => s.key === 'foldToCbetFlop')!
    return isPro
      ? `${f0.name} folds to flop c-bets ${f.value}% (${f.tier}). Bluff-bet flops in position; back off if it’s only TENTATIVE.`
      : `${f0.name.split(' ')[0]} folds to bets a lot — fire a bet on the flop and you’ll often just take the pot.`
  }
  if (/(call|station|showdown|light|pay)/.test(ql)) {
    const station = byStat(profiles, 'wtsd')
    const w = station.stats.find((s) => s.key === 'wtsd')!
    return isPro
      ? `${station.name} has the highest WTSD (${w.value}%). Value-bet thin, never triple-barrel bluff.`
      : `${station.name.split(' ')[0]} calls down the most — bet your good hands for value and skip the bluffs.`
  }
  if (/(aggress|maniac|barrel|fire)/.test(ql)) {
    const aggro = byStat(profiles, 'afq')
    const a = aggro.stats.find((s) => s.key === 'afq')!
    return isPro
      ? `${aggro.name} is the most aggressive (AFq ${a.value}%, ${a.tier}). Trap with strong hands and let them barrel into you; tighten your bluff-catchers.`
      : `${aggro.name.split(' ')[0]} bets and raises the most — let them do the betting when you have a strong hand.`
  }
  if (/(overview|summar|table|read|everyone|who.?s who|lineup|dynamic)/.test(ql)) {
    const archetypes = profiles.map((p) => `${lastName(p.name)}: ${p.typing.archetype}`).join(', ')
    const targets = withExploits.length
    return isPro
      ? `Table read — ${archetypes}. ${targets} of ${profiles.length} players carry a RELIABLE leak right now${topTarget ? `; ${lastName(topTarget.name)} is the softest spot.` : '.'}`
      : `${profiles.length} players at the table. ${targets ? `${targets} have a weakness you can attack — ${topTarget ? topTarget.name.split(' ')[0] : 'one'} is the easiest.` : 'No clear weak spots yet — play solid.'}`
  }
  const archetypes = profiles.map((p) => `${lastName(p.name)}: ${p.typing.archetype}`).join(', ')
  return isPro
    ? `Table read — ${archetypes}. Ask "who's most exploitable", "who do I avoid", "who can I bluff", or about 3-betting / showdown tendencies.`
    : `I’ve sized up the table. Ask me who to target, who to avoid, who you can bluff, or who calls too much.`
}

// Full-screen tournament assistant — same focused sheet as the player chat,
// but scoped to the whole roster so it can compare players and talk lineup.
export default function TournamentChatSheet({ open, onClose, profiles, tournamentName }: {
  open: boolean; onClose: () => void; profiles: PlayerProfile[]; tournamentName: string
}) {
  const { isPro } = useMode()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [pulse, setPulse] = useState(0)
  const [showSuggest, setShowSuggest] = useState(false)
  const [bumps, setBumps] = useState<Record<string, number>>({})
  const listRef = useRef<HTMLDivElement>(null)
  const { data: raw = [] } = useSuggestedQuestions('tournament')
  const questions = useMemo(
    () => raw.map((q) => ({ ...q, askedCount: q.askedCount + (bumps[q.text] || 0) })).sort((a, b) => b.askedCount - a.askedCount),
    [raw, bumps],
  )

  useEffect(() => {
    if (!open || messages.length > 0 || questions.length === 0) return
    const t = setInterval(() => setPulse((p) => (p + 1) % questions.length), 1800)
    return () => clearInterval(t)
  }, [open, messages.length, questions.length])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages, showSuggest])

  function ask(q: string) {
    if (!q.trim()) return
    setMessages((m) => [...m, { role: 'user', text: q }, { role: 'ai', text: answer(q, profiles, isPro) }])
    setInput(''); setShowSuggest(false)
  }
  function pick(q: string) { setBumps((b) => ({ ...b, [q]: (b[q] || 0) + 1 })); ask(q) }

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="animate-fade-up absolute inset-x-0 bottom-0 top-12 mx-auto flex max-w-md flex-col rounded-t-2xl border border-border bg-bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between gap-2 border-b border-border p-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-blue/15 text-accent-blue"><Sparkles className="h-4 w-4" /></span>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-text-primary">Ask AI about this event</div>
              <div className="truncate text-[11px] text-text-muted">{tournamentName}</div>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-bg-surface cursor-pointer" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>

        {/* messages / empty state */}
        <div ref={listRef} className="flex-1 overflow-y-auto scrollbar-thin p-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center px-2 py-6 text-center">
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-accent-blue/15">
                <Sparkles className="h-5 w-5 text-accent-blue" />
              </span>
              <h3 className="text-base font-bold text-text-primary">Ask anything about this table</h3>
              <p className="mt-1 max-w-xs text-xs text-text-muted">
                Answers are composed only from the computed roster profiles — who to target, who to avoid, who you can bluff, lineup dynamics.
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
            </div>
          )}
        </div>

        {showSuggest && messages.length > 0 && (
          <div className="border-t border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-text-secondary">Popular questions about this table</span>
              <button onClick={() => setShowSuggest(false)} className="text-xs text-text-muted hover:text-text-primary cursor-pointer">Close</button>
            </div>
            <SuggestedQuestions questions={questions} onPick={pick} />
          </div>
        )}

        {/* composer */}
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
    </div>,
    document.body,
  )
}
