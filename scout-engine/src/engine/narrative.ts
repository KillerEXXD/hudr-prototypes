import type { Exploit, Narrative, StatWithTier, TypingResult } from './types'

// =====================================================================
// Layer 4 — Narrative Synthesis (the only LLM layer in production).
// In this prototype the prose is generated DETERMINISTICALLY from the
// structured profile (typing + ranked exploits + tiers), exactly
// mirroring the constraint that the narrator may only reference numbers
// already computed. No raw hands, no invented reads. TENTATIVE stats are
// hedged; NOISE stats never reach this layer.
// =====================================================================

const NICKNAMES: Record<string, string> = {
  fold_bb_to_steal_high: 'The Blind Donor',
  fold_to_3bet_high: 'The Folder',
  fold_to_cbet_high: 'The Flop Folder',
  cbet_flop_too_high: 'The One-Trick Barreler',
  station: 'The Calling Station',
  wtsd_high_low_wsd: 'The Curious Caller',
  check_raise_high: 'The Trapper',
  donk_high: 'The Donk Leader',
  nit_no_3bet: 'The Pushover',
  fold_to_turn_cbet_high: 'The Turn Quitter',
}

const ARCHETYPE_NICK: Record<string, string> = {
  TAG: 'The Surgeon',
  LAG: 'The Bulldozer',
  Nit: 'The Vault',
  'Calling Station': 'The Calling Station',
  Maniac: 'The Hurricane',
  'Passive Fish': 'The Easy Money',
  UNCLASSIFIED: 'The Wildcard',
}

// Plain-English description of each archetype (no jargon) for casual players.
const PLAIN_TYPE: Record<string, string> = {
  TAG: 'careful but aggressive — they don’t play many hands, but when they do, they come out firing',
  LAG: 'aggressive and active — they play a lot of hands and keep you under constant pressure',
  Nit: 'extremely tight — they fold almost everything and only bet with strong hands',
  'Calling Station': 'a caller — they hate folding and will pay you off with weak hands',
  Maniac: 'wild — they raise and bet relentlessly with a huge range of hands',
  'Passive Fish': 'loose but passive — they play lots of hands but mostly call instead of raising',
  UNCLASSIFIED: 'hard to pin down — their style doesn’t fit one of the usual boxes',
}

function confidenceCaveat(typing: TypingResult): string {
  if (typing.confidence >= 0.8) return 'This read is built on a solid sample, so you can lean on it.'
  if (typing.confidence >= 0.5) return 'This is an early read — directionally right, but don’t bet your stack on it alone.'
  return 'Treat this as a first impression only — the sample is thin.'
}

export function buildNarrative(args: {
  name: string
  typing: TypingResult
  exploits: Exploit[]
  stats: StatWithTier[]
}): Narrative {
  const { name, typing, exploits } = args
  const top = exploits[0]
  const first = name.split(' ')[0]

  const nickname = top ? (NICKNAMES[top.leakId] ?? ARCHETYPE_NICK[typing.archetype]) : ARCHETYPE_NICK[typing.archetype]

  const summary = top
    ? `${first}’s biggest tell: ${top.title.toLowerCase()} — that’s where your profit comes from.`
    : `${first} is a tough, well-rounded opponent with no easy leaks. Play straight and pick your spots.`

  const typePlain = `${first} is ${PLAIN_TYPE[typing.archetype]}. ${confidenceCaveat(typing)}`

  const reliableStats = args.stats.filter((s) => s.tier === 'RELIABLE')
  const vpip = reliableStats.find((s) => s.key === 'vpip')
  const pfr = reliableStats.find((s) => s.key === 'pfr')
  const af = reliableStats.find((s) => s.key === 'af')
  const proBits: string[] = []
  if (vpip && pfr) proBits.push(`VPIP ${vpip.value}/PFR ${pfr.value} (gap ${vpip.value - pfr.value})`)
  if (af) proBits.push(`AF ${af.value}`)
  const proSummary = `${typing.archetype === 'UNCLASSIFIED' ? 'Unclassified' : typing.archetype}` +
    (typing.matchedBoundary ? ` — matched on ${typing.matchedBoundary}.` : '.') +
    (proBits.length ? ` Core line: ${proBits.join(', ')}.` : '') +
    ` Typing confidence ${Math.round(typing.confidence * 100)}% (${typing.inputsUsed.filter(i => i.tier === 'RELIABLE').length}/${typing.inputsUsed.length} inputs reliable).`

  const topThree = exploits.slice(0, 3)
  const gamePlanPlain = topThree.length
    ? topThree.map((e) => e.plainCounter)
    : ['No obvious weakness — don’t hand them chips with fancy bluffs.', 'Play your strong hands fast for value.', 'Stay patient and wait for a clearer spot.']
  const gamePlanPro = topThree.length
    ? topThree.map((e) => `${e.counterText} (watch: ${e.confirmationStat})`)
    : ['Few RELIABLE leaks — default to a balanced, value-leaning line.', 'Avoid thin bluffs without a confirmed read.', 'Re-evaluate once the sample grows.']

  return { nickname, summary, typePlain, proSummary, gamePlanPlain, gamePlanPro }
}
