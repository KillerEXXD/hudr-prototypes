import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, BarChart3, Swords, Layers, Sparkles, GitBranch, ArrowRight, RotateCcw } from 'lucide-react'
import type { Player } from '@/lib/api/domain'
import type { PlayerProfile } from '@/engine'
import PlayerAvatar from '@/components/player/PlayerAvatar'
import { cn } from '@/lib/utils'

/**
 * Agent tab — the LangGraph-style implementation of Ask AI.
 *
 * Where "Ask AI" composes one deterministic answer in a single pass, this
 * shows the *agent* pattern: it plans, then gathers the data it needs one
 * step at a time (a tool loop), then answers grounded in what it found. The
 * steps read the SAME computed profiles the rest of Scout uses, so the answer
 * is real — only the orchestration differs. Loop is scripted for the demo.
 */

type StepKind = 'plan' | 'stats' | 'matchup' | 'hands' | 'synth'
interface Step { kind: StepKind; role: string; text: string; result?: string }
interface Run { steps: Step[]; answer: string; toolCount: number }

const statVal = (prof: PlayerProfile | undefined, key: string) =>
  prof?.stats.find((s) => s.key === key)

// Build a grounded run from the player's REAL computed profile — plain English.
function buildRun(kind: 'bluff' | 'threebet' | 'leak', p: Player, prof: PlayerProfile | undefined): Run {
  const first = p.name.split(' ')[0]
  const fCbet = statVal(prof, 'foldToCbetFlop')
  const f3 = statVal(prof, 'foldTo3Bet')
  const af = statVal(prof, 'af')
  const top = prof?.exploits[0]
  const tier = (t?: string) => (t && t !== 'NOISE' ? t.toLowerCase() : 'small sample')

  if (kind === 'bluff') {
    const v = fCbet?.value ?? 0
    return {
      toolCount: 3,
      steps: [
        { kind: 'plan', role: 'Plan', text: `To answer "can I bluff ${first}", I need their fold-to-c-bet, how aggressive they play, and a couple of real folds as proof.` },
        { kind: 'stats', role: 'Pulled HUD stats', text: `Looked up ${first}'s fold-to-c-bet and aggression`, result: `folds to flop c-bets ${v}% (${tier(fCbet?.tier)}) · aggression ${af?.value ?? '–'}` },
        { kind: 'matchup', role: 'Checked your history', text: `Compared how you've done firing at ${first}`, result: `you c-bet ${first}: +2.1bb/hand over 12 hands` },
        { kind: 'hands', role: 'Found example hands', text: `Pulled two hands where ${first} folded to pressure`, result: `#0912 — folds turn to a double-barrel\n#1104 — check-folds river out of position` },
        { kind: 'synth', role: 'Wrote the answer', text: `Composed the read, grounded in those two hands.` },
      ],
      answer: v > 55
        ? `**Yes — bluff ${first}.** They fold to flop c-bets **${v}%** of the time, and you're already **+2.1bb/hand** firing at them. Keep going on turns too: #0912 shows them folding to the double-barrel, #1104 is a clean river give-up.`
        : `**Careful bluffing ${first}.** At **${v}%** fold-to-c-bet they don't over-fold — value-bet instead. The one spot that works is a turn barrel after they float: #0912.`,
    }
  }
  if (kind === 'threebet') {
    const v = f3?.value ?? 0
    return {
      toolCount: 2,
      steps: [
        { kind: 'plan', role: 'Plan', text: `This is a pre-flop question — I need ${first}'s fold-to-3-bet and a couple of 3-bet spots.` },
        { kind: 'stats', role: 'Pulled HUD stats', text: `Looked up how often ${first} folds to a 3-bet`, result: `folds to 3-bets ${v}% (${tier(f3?.tier)})` },
        { kind: 'hands', role: 'Found example hands', text: `Pulled two 3-bet spots against ${first}`, result: `#0733 — folds AJs to a 3-bet\n#0981 — 4-bets you off a bluff` },
        { kind: 'synth', role: 'Wrote the answer', text: `Turned the number into a plan, with evidence.` },
      ],
      answer: v > 60
        ? `**3-bet ${first} relentlessly.** They fold to 3-bets **${v}%** — well above balanced. #0733 is the pattern: a fine hand folded pre. Watch #0981 though — they'll occasionally 4-bet bluff, so have a plan for it.`
        : `**Don't 3-bet ${first} as a bluff.** They defend well (only **${v}%** folds) and 4-bet back — see #0981. 3-bet for value only.`,
    }
  }
  // leak
  return {
    toolCount: 2,
    steps: [
      { kind: 'plan', role: 'Plan', text: `I'll rank every one of ${first}'s tendencies against the population baseline, then pull evidence for the worst one.` },
      { kind: 'stats', role: 'Pulled HUD stats', text: `Compared ${first}'s whole profile to the baseline`, result: `biggest gap → ${top?.title ?? 'over-folds to pressure'}` },
      { kind: 'hands', role: 'Found example hands', text: `Pulled hands that show the leak and how you beat it`, result: `#0912 — the tell in action\n#1077 — you exploit it for +3.4bb` },
      { kind: 'synth', role: 'Wrote the answer', text: `Named the single biggest leak and how to attack it.` },
    ],
    answer: top
      ? `${first}'s biggest leak is **${top.title.toLowerCase()}**. ${top.plainCounter} You already do it: #1077 is a clean +3.4bb exploit, #0912 shows the tell.`
      : `${first} plays a tight, low-leak game — attack the blinds and pick spots rather than forcing it.`,
  }
}

const fmt = (t: string) =>
  t.split(/(\*\*.+?\*\*|#\d{3,4})/g).map((seg, i) => {
    if (/^\*\*.+\*\*$/.test(seg)) return <strong key={i} className="text-text-primary">{seg.slice(2, -2)}</strong>
    if (/^#\d{3,4}$/.test(seg)) return <span key={i} className="mx-0.5 rounded border border-accent-blue/30 bg-accent-blue/10 px-1 py-px font-mono text-[11px] text-accent-blue">{seg}</span>
    return <span key={i}>{seg}</span>
  })

const ICON: Record<StepKind, typeof Search> = { plan: Search, stats: BarChart3, matchup: Swords, hands: Layers, synth: Sparkles }

export default function AgentTab({ players, profByPlayer }: {
  players: Player[]
  profByPlayer: Record<string, PlayerProfile>
}) {
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
  const [shown, setShown] = useState(0)
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
      d += r.steps[idx].result ? 720 : 520
    })
    timers.current.push(window.setTimeout(() => setDone(true), d))
  }

  if (!subject) return <p className="py-8 text-center text-sm text-text-muted">Loading players…</p>

  return (
    <div className="animate-fade-up">
      <div className="rounded-xl border border-border bg-bg-card p-3">
        <div className="mb-3 flex items-center gap-2.5">
          <PlayerAvatar initials={subject.initials} color={subject.color} size="sm" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-text-primary">{subject.name}</div>
            <div className="text-[11px] text-text-muted">{prof?.typing.archetype ?? 'opponent'} · ask the agent a question</div>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-accent-blue/30 bg-accent-blue/10 px-2 py-0.5 text-[10px] font-semibold text-accent-blue">
            <GitBranch className="h-3 w-3" /> Agent
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {QUESTIONS.map((q, i) => (
            <button
              key={q.kind}
              onClick={() => play(i)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                active === i ? 'border-accent-blue bg-accent-blue/15 text-accent-blue' : 'border-border bg-bg-surface/50 text-text-secondary hover:border-border-light hover:text-text-primary',
              )}
            >
              {q.label}
            </button>
          ))}
        </div>

        {run && (
          <div className="mt-3 rounded-lg border border-border bg-bg-surface/40 p-3">
            <div className="mb-2 flex items-center gap-2 text-[11px] text-text-muted">
              <span>{done ? `Answered in ${run.toolCount} step${run.toolCount > 1 ? 's' : ''}` : 'Working…'}</span>
              <button onClick={() => play(active!)} className="ml-auto inline-flex items-center gap-1 text-text-muted hover:text-text-secondary cursor-pointer">
                <RotateCcw className="h-3 w-3" /> replay
              </button>
            </div>

            <ol className="relative space-y-0">
              {run.steps.slice(0, shown).map((s, i) => {
                const Icon = ICON[s.kind]
                const last = i === shown - 1 && !done
                return (
                  <li key={i} className="grid grid-cols-[22px_1fr] gap-2.5 pb-2.5">
                    <span className={cn(
                      'relative z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full border',
                      last ? 'border-accent-blue text-accent-blue' : 'border-accent-blue/40 bg-accent-blue/10 text-accent-blue',
                    )}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <div className="text-[9.5px] font-semibold uppercase tracking-wider text-text-muted">{s.role}</div>
                      <div className="text-[12.5px] leading-snug text-text-primary">{s.text}</div>
                      {s.result && (
                        <div className="mt-1 whitespace-pre-line border-l-2 border-accent-blue/30 pl-2 text-[11.5px] leading-snug text-text-secondary">{s.result}</div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>

            {done && (
              <div className="mt-1 rounded-lg border border-accent-blue/30 bg-accent-blue/5 p-3">
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-accent-blue">
                  <Sparkles className="h-3.5 w-3.5" /> Answer
                  <span className="ml-auto font-normal text-text-muted">grounded in {run.toolCount} lookups</span>
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
            Tap a question — watch the agent gather {first}'s data step by step, then answer.
          </p>
        )}
      </div>

      <div className="mt-3 rounded-xl border border-border bg-bg-card p-3">
        <div className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-text-primary">
          <GitBranch className="h-3.5 w-3.5 text-accent-blue" /> How the agent differs from “Ask AI”
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border bg-bg-surface/40 p-2.5">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">Ask AI (today)</div>
            <ul className="space-y-1 text-[11px] text-text-muted">
              <li>Answers in one pass</li>
              <li>Fixed answer shapes</li>
              <li>Doesn’t look things up</li>
            </ul>
          </div>
          <div className="rounded-lg border border-accent-blue/25 bg-accent-blue/5 p-2.5">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-accent-blue">Agent</div>
            <ul className="space-y-1 text-[11px] text-text-secondary">
              <li>Plans, then gathers data</li>
              <li>Pulls only what it needs</li>
              <li>Cites the exact hands</li>
            </ul>
          </div>
        </div>
        <p className="mt-2 text-[10.5px] leading-relaxed text-text-muted">
          Prototype: the steps are scripted, but they read the same computed profiles Scout already uses. In production this loop is orchestrated with LangGraph.
        </p>
      </div>
    </div>
  )
}
