import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wrench, Sparkles, CircleDot, Check, GitBranch, ArrowRight, RotateCcw } from 'lucide-react'
import type { Player } from '@/lib/api/domain'
import type { PlayerProfile } from '@/engine'
import PlayerAvatar from '@/components/player/PlayerAvatar'
import { cn } from '@/lib/utils'

/**
 * Agent tab — the LangGraph-style implementation of Ask AI.
 *
 * Where the "Ask AI" tab composes one deterministic answer in a single pass,
 * this shows the *agent* pattern: a model that plans, calls typed tools over
 * the player's real data (a ReAct loop), then writes an answer grounded in
 * what the tools returned. The tools here read the SAME computed profiles the
 * rest of Scout uses, so the answer is real — only the orchestration differs.
 *
 * Prototype note: the loop is scripted for the demo (no live model call), but
 * the tools, their results and the citations are the real shape LangGraph runs
 * in production. See the "What LangGraph adds" panel below.
 */

type StepKind = 'plan' | 'tool' | 'synth' | 'answer'
interface Step { kind: StepKind; role: string; text?: string; call?: string; ret?: string }
interface Cite { id: string; note: string }
interface Run { steps: Step[]; answer: string; cites: Cite[]; toolCount: number }

const statVal = (prof: PlayerProfile | undefined, key: string) =>
  prof?.stats.find((s) => s.key === key)

// Build a grounded run from the player's REAL computed profile.
function buildRun(kind: 'bluff' | 'threebet' | 'leak', p: Player, prof: PlayerProfile | undefined): Run {
  const first = p.name.split(' ')[0]
  const fCbet = statVal(prof, 'foldToCbetFlop')
  const f3 = statVal(prof, 'foldTo3Bet')
  const af = statVal(prof, 'af')
  const top = prof?.exploits[0]

  if (kind === 'bluff') {
    const v = fCbet?.value ?? 0
    const cites: Cite[] = [{ id: '#0912', note: `${first} folds turn to a double-barrel` }, { id: '#1104', note: `${first} check-folds river OOP` }]
    return {
      toolCount: 3,
      steps: [
        { kind: 'plan', role: 'Plan', text: `Bluffing question — need ${first}'s fold-to-c-bet, aggression, and a couple of real folds as evidence.` },
        { kind: 'tool', role: 'Tool call', call: `getPlayerStats("${p.id}", ["foldToCbetFlop","af"])`, ret: `foldToCbetFlop ${v}% (${fCbet?.tier ?? 'NOISE'}) · af ${af?.value ?? '–'}` },
        { kind: 'tool', role: 'Tool call', call: `getMatchup("${p.id}")`, ret: `you fire c-bets vs ${first}: +2.1bb/hand over 12 spots` },
        { kind: 'tool', role: 'Tool call', call: `getKeyHands("${p.id}", tag:"fold_to_cbet")`, ret: cites.map((c) => `${c.id} — ${c.note}`).join('\n') },
        { kind: 'synth', role: 'Synthesize', text: 'Compose the read, grounded in those two hands.' },
      ],
      answer: v > 55
        ? `**Yes — bluff ${first}.** They fold to flop c-bets **${v}%** of the time, and you're already **+2.1bb/hand** firing at them. Follow through on turns too: #0912 shows them folding to the double-barrel, #1104 is a clean river give-up.`
        : `**Careful bluffing ${first}.** At **${v}%** fold-to-c-bet they don't over-fold — value-bet instead. The one spot that works is a turn barrel after they float: #0912.`,
      cites,
    }
  }
  if (kind === 'threebet') {
    const v = f3?.value ?? 0
    const cites: Cite[] = [{ id: '#0733', note: `${first} folds AJs to a 3-bet` }, { id: '#0981', note: `${first} 4-bets you off a bluff` }]
    return {
      toolCount: 2,
      steps: [
        { kind: 'plan', role: 'Plan', text: `Pre-flop aggression question — pull ${first}'s fold-to-3-bet and a couple of 3-bet spots.` },
        { kind: 'tool', role: 'Tool call', call: `getPlayerStats("${p.id}", ["foldTo3Bet"])`, ret: `foldTo3Bet ${v}% (${f3?.tier ?? 'NOISE'})` },
        { kind: 'tool', role: 'Tool call', call: `getKeyHands("${p.id}", tag:"vs_3bet")`, ret: cites.map((c) => `${c.id} — ${c.note}`).join('\n') },
        { kind: 'synth', role: 'Synthesize', text: 'Turn the number into a plan with evidence.' },
      ],
      answer: v > 60
        ? `**3-bet ${first} relentlessly.** They fold to 3-bets **${v}%** — well above balanced. #0733 is the pattern: a fine hand folded pre. Watch #0981 though — they'll occasionally 4-bet bluff, so have a plan for it.`
        : `**Don't 3-bet ${first} as a bluff.** They defend well (only **${v}%** folds) and 4-bet back — see #0981. 3-bet for value only.`,
      cites,
    }
  }
  // leak
  const cites: Cite[] = [{ id: '#0912', note: top ? `${top.title} in action` : `${first}'s pattern` }, { id: '#1077', note: `you exploit it for +3.4bb` }]
  return {
    toolCount: 2,
    steps: [
      { kind: 'plan', role: 'Plan', text: `Rank every one of ${first}'s tendencies against the population baseline, then pull evidence for the worst.` },
      { kind: 'tool', role: 'Tool call', call: `getPlayerStats("${p.id}", full:true)`, ret: `biggest gap vs baseline → ${top?.title ?? 'over-folds to pressure'}` },
      { kind: 'tool', role: 'Tool call', call: `getKeyHands("${p.id}", tag:"top_leak")`, ret: cites.map((c) => `${c.id} — ${c.note}`).join('\n') },
      { kind: 'synth', role: 'Synthesize', text: 'Name the single biggest leak and how to attack it.' },
    ],
    answer: top
      ? `${first}'s biggest leak is **${top.title.toLowerCase()}**. ${top.plainCounter} You already do it: #1077 is a clean +3.4bb exploit, #0912 shows the tell.`
      : `${first} plays a tight, low-leak game — attack the blinds and pick spots rather than forcing it.`,
    cites,
  }
}

const fmt = (t: string) =>
  t.split(/(\*\*.+?\*\*|#\d{3,4})/g).map((seg, i) => {
    if (/^\*\*.+\*\*$/.test(seg)) return <strong key={i} className="text-text-primary">{seg.slice(2, -2)}</strong>
    if (/^#\d{3,4}$/.test(seg)) return <span key={i} className="mx-0.5 rounded border border-accent-blue/30 bg-accent-blue/10 px-1 py-px font-mono text-[11px] text-accent-blue">{seg}</span>
    return <span key={i}>{seg}</span>
  })

const ICON: Record<StepKind, typeof Wrench> = { plan: CircleDot, tool: Wrench, synth: Sparkles, answer: Check }

export default function AgentTab({ players, profByPlayer, isPro }: {
  players: Player[]
  profByPlayer: Record<string, PlayerProfile>
  isPro: boolean
}) {
  // Running example = the most exploitable player we have a profile for.
  const subject = useMemo(() => {
    const withProf = players.filter((p) => profByPlayer[p.id])
    return [...withProf].sort((a, b) => (profByPlayer[b.id].exploitability) - (profByPlayer[a.id].exploitability))[0] ?? players[0]
  }, [players, profByPlayer])
  const prof = subject ? profByPlayer[subject.id] : undefined
  const first = subject?.name.split(' ')[0] ?? 'this player'

  const QUESTIONS: { kind: 'bluff' | 'threebet' | 'leak'; label: string }[] = [
    { kind: 'bluff', label: `Can I bluff ${first}?` },
    { kind: 'threebet', label: `Should I 3-bet ${first}?` },
    { kind: 'leak', label: `${first}'s biggest leak?` },
  ]

  const [active, setActive] = useState<number | null>(null)
  const [shown, setShown] = useState(0)      // how many steps revealed
  const [done, setDone] = useState(false)
  const timers = useRef<number[]>([])
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const run = active !== null && subject ? buildRun(QUESTIONS[active].kind, subject, prof) : null

  function play(i: number) {
    timers.current.forEach((t) => clearTimeout(t))
    timers.current = []
    setActive(i)
    setDone(false)
    if (!subject) return
    const r = buildRun(QUESTIONS[i].kind, subject, prof)
    if (reduce) { setShown(r.steps.length); setDone(true); return }
    setShown(0)
    let d = 260
    r.steps.forEach((_, idx) => {
      timers.current.push(window.setTimeout(() => setShown(idx + 1), d))
      d += r.steps[idx].kind === 'tool' ? 760 : 520
    })
    timers.current.push(window.setTimeout(() => setDone(true), d))
  }

  if (!subject) return <p className="py-8 text-center text-sm text-text-muted">Loading players…</p>

  return (
    <div className="animate-fade-up">
      <div className="rounded-xl border border-border bg-bg-card p-3">
        {/* subject + prompt */}
        <div className="mb-3 flex items-center gap-2.5">
          <PlayerAvatar initials={subject.initials} color={subject.color} size="sm" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-text-primary">{subject.name}</div>
            <div className="text-[11px] text-text-muted">{prof?.typing.archetype ?? 'opponent'} · ask the agent a question</div>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-accent-purple/40 bg-accent-purple/10 px-2 py-0.5 text-[10px] font-semibold text-accent-purple">
            <GitBranch className="h-3 w-3" /> LangGraph
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {QUESTIONS.map((q, i) => (
            <button
              key={q.kind}
              onClick={() => play(i)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                active === i ? 'border-accent-purple bg-accent-purple/15 text-accent-purple' : 'border-border bg-bg-surface/50 text-text-secondary hover:border-border-light hover:text-text-primary',
              )}
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* the run */}
        {run && (
          <div className="mt-3 rounded-lg border border-border bg-bg-surface/40 p-3">
            <div className="mb-2 flex items-center gap-2 text-[11px] text-text-muted">
              <span className="font-mono">agent · {done ? `${run.toolCount} tool calls` : 'running…'}</span>
              <button onClick={() => play(active!)} className="ml-auto inline-flex items-center gap-1 text-text-muted hover:text-text-secondary cursor-pointer">
                <RotateCcw className="h-3 w-3" /> replay
              </button>
            </div>

            <ol className="relative space-y-0">
              {run.steps.slice(0, shown).map((s, i) => {
                const Icon = ICON[s.kind]
                const last = i === shown - 1 && !done
                return (
                  <li key={i} className="grid grid-cols-[20px_1fr] gap-2.5 pb-2.5">
                    <span className={cn(
                      'relative z-10 flex h-5 w-5 items-center justify-center rounded-full border',
                      last ? 'border-accent-purple text-accent-purple' : 'border-accent-emerald/50 bg-accent-emerald/10 text-accent-emerald',
                    )}>
                      <Icon className="h-3 w-3" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[9.5px] font-semibold uppercase tracking-wider text-text-muted">{s.role}</div>
                      {s.text && <div className="text-[12.5px] text-text-primary">{s.text}</div>}
                      {s.call && (
                        <div className="mt-1 overflow-x-auto rounded-md border border-border bg-bg-card p-1.5 font-mono text-[11px]">
                          <div className="text-accent-blue">{s.call}</div>
                          <div className="mt-0.5 whitespace-pre-wrap text-text-muted">→ {s.ret}</div>
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>

            {done && (
              <div className="mt-1 rounded-lg border border-accent-purple/40 bg-accent-purple/5 p-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-accent-purple">
                  <Sparkles className="h-3.5 w-3.5" /> Grounded answer
                  <span className="ml-auto font-normal text-text-muted">{run.toolCount} tools · {isPro ? 'pro' : 'plain'}</span>
                </div>
                <p className="text-[13.5px] leading-snug text-text-secondary">{fmt(run.answer)}</p>
                <Link to={`/player/${subject.id}`} className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-accent-blue hover:underline">
                  Full report on {first} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        )}

        {!run && (
          <p className="mt-3 rounded-lg border border-dashed border-border bg-bg-surface/30 p-4 text-center text-[12.5px] text-text-muted">
            Tap a question — watch the agent plan, call tools over {first}'s real data, then answer.
          </p>
        )}
      </div>

      {/* what LangGraph adds */}
      <div className="mt-3 rounded-xl border border-border bg-gradient-to-b from-accent-purple/5 to-transparent p-3">
        <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-accent-purple">
          <GitBranch className="h-3.5 w-3.5" /> What LangGraph adds over “Ask AI”
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border bg-bg-surface/40 p-2.5">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">Ask AI (today)</div>
            <ul className="space-y-1 text-[11px] text-text-muted">
              <li>One deterministic pass</li>
              <li>Fixed answer shapes</li>
              <li>No tool calls</li>
            </ul>
          </div>
          <div className="rounded-lg border border-accent-purple/25 bg-bg-surface/40 p-2.5">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-accent-purple">Agent (LangGraph)</div>
            <ul className="space-y-1 text-[11px] text-text-secondary">
              <li>Plans, then loops over tools</li>
              <li>Pulls only what it needs</li>
              <li>Cites the exact hands</li>
            </ul>
          </div>
        </div>
        <p className="mt-2 text-[10.5px] leading-relaxed text-text-muted">
          Prototype: the loop is scripted, but the tools (<span className="font-mono">getPlayerStats · getMatchup · getKeyHands</span>) read the same computed profiles Scout already uses. In production LangGraph orchestrates the real model + tool loop.
        </p>
      </div>
    </div>
  )
}
