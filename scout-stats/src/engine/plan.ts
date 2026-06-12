import type { Exploit, ExploitPlan, PlanItem, StatKey, StatWithTier, TypingResult } from './types'

// =====================================================================
// Exploit Plan — the actionable game plan, grouped into Preflop / Postflop
// / ICM phases. Derived from the fired exploits (by stat category) and the
// archetype; falls back to type-based defaults when a phase has no leak.
// =====================================================================

const PREFLOP_STATS: StatKey[] = ['vpip', 'pfr', 'gap', 'threeBet', 'foldTo3Bet', 'fourBet', 'coldCall', 'steal', 'foldToSteal']
const isPreflop = (k: StatKey) => PREFLOP_STATS.includes(k)

const fromExploit = (e: Exploit): PlanItem => ({ plain: e.plainCounter, pro: e.counterText })

function defaultPreflop(t: TypingResult): PlanItem {
  switch (t.archetype) {
    case 'Nit': return { plain: 'Steal their blinds relentlessly and fold if they ever raise.', pro: 'Open wide vs their blinds; over-fold to their rare aggression.' }
    case 'LAG': case 'Maniac': return { plain: 'Tighten up and let them keep firing into your strong hands.', pro: 'Flat strong hands, 3-bet for value; avoid light flats out of position.' }
    default: return { plain: 'Open a bit wider in position; respect it when they re-raise.', pro: 'Standard opens; widen in position, fold marginal hands to their 3-bets.' }
  }
}
function defaultPostflop(t: TypingResult): PlanItem {
  switch (t.archetype) {
    case 'Calling Station': case 'Passive Fish': return { plain: 'Never bluff — just bet your good hands bigger.', pro: 'Value-bet thin and large across streets; cut all bluffs.' }
    default: return { plain: 'Bet your good hands for value and keep bluffs honest.', pro: 'Default to a balanced, value-leaning line; barrel only credible runouts.' }
  }
}
function icmDirective(t: TypingResult): PlanItem {
  switch (t.archetype) {
    case 'Nit': case 'TAG': return { plain: 'They get even tighter near pay jumps — steal more, avoid coin-flips.', pro: 'Exploit ICM-induced over-folding: raise/3-bet shove wider, dodge marginal flips.' }
    case 'LAG': case 'Maniac': return { plain: 'Apply pressure when stacks get short — but expect them to gamble back.', pro: 'Apply pressure as stacks compress; widen call-offs vs their shove range.' }
    default: return { plain: 'Apply pressure when stacks compress; expect slightly tighter 3-bets.', pro: 'Standard ICM pressure as stacks shorten; expect modest range tightening.' }
  }
}

export function buildExploitPlan(exploits: Exploit[], typing: TypingResult, _stats: StatWithTier[]): ExploitPlan {
  const pre = exploits.find((e) => isPreflop(e.triggerStat))
  const post = exploits.find((e) => !isPreflop(e.triggerStat))
  return {
    preflop: pre ? fromExploit(pre) : defaultPreflop(typing),
    postflop: post ? fromExploit(post) : defaultPostflop(typing),
    icm: icmDirective(typing),
  }
}
