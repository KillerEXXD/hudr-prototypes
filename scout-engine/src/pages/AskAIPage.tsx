import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Send, Bot, User, ArrowRight, ChevronUp, Flame, Trophy } from 'lucide-react'
import { useMode } from '@/contexts/ModeContext'
import { usePlayers, useTournaments, useProfiles, useTrendingQueries, careerFilters } from '@/hooks'
import type { Player, Tournament } from '@/lib/api/domain'
import type { PlayerProfile } from '@/engine'
import PlayerAvatar from '@/components/player/PlayerAvatar'
import { cn } from '@/lib/utils'

type TrendFilter = 'all' | 'player' | 'tournament'

interface Link2 { to: string; label: string }
interface Msg { role: 'user' | 'ai'; text: string; link?: Link2 }
interface Target { kind: 'player' | 'tournament'; id: string }

const ai = (text: string, link?: Link2): Msg => ({ role: 'ai', text, link })
const statVal = (prof: PlayerProfile, key: string) => prof.stats.find((s) => s.key === key)

// Best player named in free text — scored by matched-token length so "Hellmuth"
// (8) beats a stray "Phil" (4); avoids matching the wrong same-first-name player.
function bestPlayerMatch(q: string, players: Player[]): Player | null {
  const ql = q.toLowerCase()
  let best: Player | null = null, bestScore = 0
  for (const p of players) {
    const tokens = p.name.toLowerCase().split(' ').filter((w) => w.length > 3)
    const score = tokens.reduce((s, w) => (ql.includes(w) ? s + w.length : s), 0)
    if (score > bestScore) { bestScore = score; best = p }
  }
  return bestScore > 0 ? best : null
}

// Entity-specific read on one player, sensitive to what was asked.
function readForPlayer(p: Player, prof: PlayerProfile | undefined, isPro: boolean, ql: string): Msg {
  const first = p.name.split(' ')[0]
  const link = { to: `/player/${p.id}`, label: `Full report on ${first}` }
  if (!prof) return ai(`Here's ${p.name}.`, { to: `/player/${p.id}`, label: `Scout ${first}` })

  if (/bluff/.test(ql)) {
    const f = statVal(prof, 'foldToCbetFlop')
    const txt = !f || f.tier === 'NOISE'
      ? `Not enough hands on ${first} to know how often they fold yet.`
      : f.value > 55
        ? `Yes — ${first} folds to flop bets ${isPro ? `${f.value}% ` : 'a lot '}— fire c-bets and take it down.`
        : `Not really — ${first} doesn't over-fold, so value-bet instead of bluffing.`
    return ai(txt, link)
  }
  if (/(3-?bet|three-?bet)/.test(ql)) {
    const f = statVal(prof, 'foldTo3Bet')
    const txt = !f || f.tier === 'NOISE'
      ? `Not enough hands to know how ${first} reacts to 3-bets yet.`
      : f.value > 60
        ? `${first} folds to 3-bets ${isPro ? `${f.value}% ` : 'too often '}— 3-bet them light and often.`
        : `${first} defends 3-bets ${isPro ? `(only ${f.value}% folds) ` : 'well '}— 3-bet for value, not as a bluff.`
    return ai(txt, link)
  }
  if (/(aggress|postflop|value bet|thin|call down|station|showdown)/.test(ql)) {
    const af = statVal(prof, 'af'); const w = statVal(prof, 'wtsd')
    const txt = af && af.tier !== 'NOISE'
      ? `${first} runs ${isPro ? `AF ${af.value}` : af.value > 2.5 ? 'very aggressive' : 'fairly passive'} postflop${w ? `, gets to showdown ${isPro ? `${w.value}% ` : w.value > 30 ? 'a lot ' : 'rarely '}` : ''}— ${af.value > 2.5 ? 'expect barrels, pick off with strong hands.' : 'value-bet relentlessly, they call too much.'}`
      : `${first} — ${prof.typing.archetype}. ${prof.narrative.summary}`
    return ai(txt, link)
  }
  const top = prof.exploits[0]
  return ai(
    top
      ? `${p.name} — ${prof.typing.archetype}. Biggest leak: ${top.title.toLowerCase()}. ${isPro ? top.counterText : top.plainCounter}`
      : `${p.name} — ${prof.typing.archetype}. ${prof.narrative.summary}`,
    link,
  )
}

// Entity-specific answer about one tournament — names the softest/toughest seat
// from THAT event's roster.
function answerForTournament(t: Tournament, players: Player[], profByPlayer: Record<string, PlayerProfile>, isPro: boolean, ql: string): Msg {
  const ids = t.topPlayerIds.length ? t.topPlayerIds : players.map((p) => p.id)
  const roster = ids
    .map((id) => ({ p: players.find((x) => x.id === id), prof: profByPlayer[id] }))
    .filter((x): x is { p: Player; prof: PlayerProfile } => !!x.p && !!x.prof)
  if (roster.length) {
    const avoid = /(avoid|toughest|hardest|tough|stay away|best player)/.test(ql)
    const pick = [...roster].sort((a, b) => avoid ? a.prof.exploitability - b.prof.exploitability : b.prof.exploitability - a.prof.exploitability)[0]
    const txt = avoid
      ? `Toughest seat at ${t.name}: ${pick.p.name}${isPro ? ` (exploitability ${pick.prof.exploitability})` : ''}. Give them room and pick your spots.`
      : `Softest seat at ${t.name}: ${pick.p.name}${isPro ? ` (exploitability ${pick.prof.exploitability})` : ''}. ${pick.prof.exploits[0]?.plainCounter ?? 'Attack their leaks.'}`
    return ai(txt, { to: `/player/${pick.p.id}`, label: `Scout ${pick.p.name.split(' ')[0]}` })
  }
  return ai(`${t.name} — ${t.exploitableCount} exploitable players flagged.`, { to: `/tournament/${t.id}`, label: `Open ${t.name}` })
}

// Deterministic global "AI" — composes answers only from computed mock profiles,
// deep-linking to the relevant player/tournament. A `target` (from tapping a
// trending item) gives an exact entity answer; typed text falls back to parsing.
function answer(
  q: string,
  players: Player[],
  tournaments: Tournament[],
  profByPlayer: Record<string, PlayerProfile>,
  isPro: boolean,
  target?: Target,
): Msg {
  const ql = q.toLowerCase()

  if (target?.kind === 'player') {
    const p = players.find((x) => x.id === target.id)
    if (p) return readForPlayer(p, profByPlayer[p.id], isPro, ql)
  }
  if (target?.kind === 'tournament') {
    const t = tournaments.find((x) => x.id === target.id)
    if (t) return answerForTournament(t, players, profByPlayer, isPro, ql)
  }

  // ---- free text ----
  const named = bestPlayerMatch(q, players)
  if (named) return readForPlayer(named, profByPlayer[named.id], isPro, ql)

  const withProf = players.map((p) => ({ p, prof: profByPlayer[p.id] })).filter((x): x is { p: Player; prof: PlayerProfile } => !!x.prof)
  if (/(avoid|toughest|hardest|best player|stay away|who.*tough)/.test(ql) && withProf.length) {
    const { p, prof } = [...withProf].sort((a, b) => a.prof.exploitability - b.prof.exploitability)[0]
    return ai(`Avoid tangling with ${p.name} — ${isPro ? `skill grade ${prof.skill.grade}, ` : ''}few exploitable leaks. Play straight and pick your spots.`, { to: `/player/${p.id}`, label: `Scout ${p.name.split(' ')[0]}` })
  }
  if (/(most exploitable|weakest|easiest|softest|who can i (beat|target)|biggest fish)/.test(ql) && withProf.length) {
    const { p, prof } = [...withProf].sort((a, b) => b.prof.exploitability - a.prof.exploitability)[0]
    return ai(`${p.name} is the most exploitable${isPro ? ` (exploitability ${prof.exploitability})` : ''} — ${prof.exploits[0]?.title.toLowerCase() ?? 'several leaks to attack'}.`, { to: `/player/${p.id}`, label: `Scout ${p.name.split(' ')[0]}` })
  }
  if (/(field|tournament|event|softest seat)/.test(ql)) {
    const soft = [...tournaments].sort((a, b) => b.exploitableCount - a.exploitableCount)[0]
    if (soft) return ai(`${soft.name} has the softest field — ${soft.exploitableCount} exploitable players flagged.`, { to: `/tournament/${soft.id}`, label: `Open ${soft.name}` })
  }

  return ai('Ask me about a specific player or tournament — try one of the trending questions, or type a name.')
}

export default function AskAIPage() {
  const { isPro } = useMode()
  const { data: players = [] } = usePlayers()
  const { data: tournaments = [] } = useTournaments()
  const { data: trending = [] } = useTrendingQueries()
  const { profiles } = useProfiles(players.map((p) => p.id), careerFilters())
  const profByPlayer = useMemo(() => Object.fromEntries(profiles.map((p) => [p.playerId, p])), [profiles])
  const playerById = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players])
  const tournamentById = useMemo(() => Object.fromEntries(tournaments.map((t) => [t.id, t])), [tournaments])

  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState<TrendFilter>('all')
  const [votes, setVotes] = useState<Record<string, number>>({})   // local upvote bumps
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const trendingSorted = useMemo(
    () => trending
      .filter((t) => filter === 'all' || t.kind === filter)
      .map((t) => ({ ...t, votes: t.votes + (votes[t.id] || 0) }))
      .sort((a, b) => b.votes - a.votes),
    [trending, filter, votes],
  )
  function upvote(id: string) { setVotes((v) => ({ ...v, [id]: (v[id] || 0) + 1 })) }

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages])

  function ask(q: string, target?: Target) {
    if (!q.trim()) return
    setMessages((m) => [...m, { role: 'user', text: q }, answer(q, players, tournaments, profByPlayer, isPro, target)])
    setInput('')
    inputRef.current?.focus()
  }

  return (
    <div className="animate-fade-up">
      <h1 className="text-xl font-bold tracking-tight">Ask AI</h1>
      <p className="mb-3 mt-0.5 text-sm text-text-secondary">
        {isPro ? 'Answers composed from computed stats across every player & event.' : 'Ask anything about the players and tournaments — in plain English.'}
      </p>

      <div className="flex flex-col rounded-xl border border-border bg-bg-card">
        <div ref={listRef} className="max-h-[52vh] min-h-[220px] flex-1 overflow-y-auto scrollbar-thin p-3">
          {messages.length === 0 ? (
            <div className="px-1 py-1">
              <div className="mb-3 flex items-center gap-2">
                <Flame className="h-4 w-4 text-accent-amber" />
                <h3 className="text-sm font-bold text-text-primary">Trending now</h3>
                <span className="text-[11px] text-text-muted">Tap to ask · ▲ to upvote</span>
              </div>

              <div className="mb-3 inline-flex rounded-lg border border-border bg-bg-surface/60 p-0.5 text-xs">
                {(['all', 'player', 'tournament'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      'rounded-md px-2.5 py-1 font-medium capitalize transition-colors cursor-pointer',
                      filter === f ? 'bg-accent-blue text-white' : 'text-text-muted hover:text-text-secondary',
                    )}
                  >
                    {f === 'player' ? 'Players' : f === 'tournament' ? 'Tournaments' : 'All'}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                {trendingSorted.map((t) => {
                  const player = t.kind === 'player' ? playerById[t.targetId] : undefined
                  const tournament = t.kind === 'tournament' ? tournamentById[t.targetId] : undefined
                  const label = player?.name ?? tournament?.name
                  if (!label) return null
                  const voted = (votes[t.id] || 0) > 0
                  return (
                    <div key={t.id} className="flex items-center gap-2.5 rounded-xl border border-border bg-bg-surface/40 p-2.5">
                      {player ? (
                        <PlayerAvatar initials={player.initials} color={player.color} size="sm" />
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-amber/15 text-accent-amber"><Trophy className="h-4 w-4" /></span>
                      )}
                      <button onClick={() => ask(t.question, { kind: t.kind, id: t.targetId })} className="min-w-0 flex-1 text-left cursor-pointer">
                        <div className="truncate text-sm font-medium text-text-primary">{t.question}</div>
                        <div className="truncate text-[11px] text-text-muted">{label}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => upvote(t.id)}
                        aria-label="Upvote"
                        className={cn(
                          'flex shrink-0 flex-col items-center rounded-lg border px-2 py-1 transition-colors cursor-pointer',
                          voted ? 'border-accent-blue/40 bg-accent-blue/10 text-accent-blue' : 'border-border text-text-muted hover:text-text-secondary',
                        )}
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                        <span className="nums text-[11px] font-bold leading-none">{t.votes}</span>
                      </button>
                    </div>
                  )
                })}
              </div>
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
                  {m.role === 'ai' && m.link && (
                    <Link to={m.link.to} className="ml-9 mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-accent-blue hover:underline cursor-pointer">
                      {m.link.label} <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); ask(input) }} className="flex items-center gap-2 border-t border-border p-2.5">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about any player or tournament…"
            className="flex-1 rounded-lg border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue"
          />
          <button type="submit" className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-blue text-white hover:bg-accent-blue/90 cursor-pointer transition-colors" aria-label="Send">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
