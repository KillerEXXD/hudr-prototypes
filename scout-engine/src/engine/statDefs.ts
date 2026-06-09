import type { StatKey, StatCategory } from './types'

// =====================================================================
// Stat catalog (spec §2). Each stat has its formal definition, a
// plain-English name + explanation (Normal mode), and what a pro reads
// from it (Pro mode "tells"). Single source of truth for labels.
// =====================================================================

export interface StatDef {
  key: StatKey
  label: string          // short pro label (e.g. "Fold to 3-Bet")
  plainName: string      // friendly name for non-stat players
  unit: '%' | 'ratio'
  category: StatCategory
  definition: string     // numerator / denominator
  tells: string          // what it tells a pro
  plain: string          // what it means in plain English
  /** opportunities ≈ totalHands * this multiplier (mock denominator model). */
  oppMultiplier: number
  /** higher value = more aggressive/looser (used for color heuristics). */
  highIsAggressive?: boolean
}

export const STAT_DEFS: Record<StatKey, StatDef> = {
  vpip: {
    key: 'vpip', label: 'VPIP', plainName: 'How often they play', unit: '%', category: 'preflop',
    definition: 'Hands voluntarily put money in pot / hands dealt',
    tells: 'Looseness — the master frequency stat.',
    plain: 'How many hands they choose to get involved in. High = plays lots of hands; low = picky.',
    oppMultiplier: 1, highIsAggressive: true,
  },
  pfr: {
    key: 'pfr', label: 'PFR', plainName: 'How often they raise first', unit: '%', category: 'preflop',
    definition: 'Hands raised preflop / hands dealt',
    tells: 'Preflop aggression. The gap from VPIP shows passivity.',
    plain: 'How often they come in raising instead of just calling. High = aggressive entry.',
    oppMultiplier: 1, highIsAggressive: true,
  },
  gap: {
    key: 'gap', label: 'VPIP–PFR Gap', plainName: 'Caller vs. raiser', unit: '%', category: 'preflop',
    definition: 'VPIP minus PFR',
    tells: 'Large gap (>8) = passive caller; small gap = aggressive.',
    plain: 'How much they call rather than raise. A big number means a passive caller.',
    oppMultiplier: 1,
  },
  threeBet: {
    key: 'threeBet', label: '3-Bet %', plainName: 'Re-raise rate', unit: '%', category: 'preflop',
    definition: 'Preflop 3-bets / times they faced an open',
    tells: 'Re-raise aggression. Low = exploitable by opening wide.',
    plain: 'How often they re-raise someone who already raised. Low = you can raise freely against them.',
    oppMultiplier: 0.5, highIsAggressive: true,
  },
  foldTo3Bet: {
    key: 'foldTo3Bet', label: 'Fold to 3-Bet', plainName: 'Folds when re-raised', unit: '%', category: 'preflop',
    definition: 'Folds to a 3-bet / times faced a 3-bet after opening',
    tells: 'High = 3-bet their opens light as a bluff.',
    plain: 'How often they give up after raising and getting re-raised. High = bluff re-raise them.',
    oppMultiplier: 0.18,
  },
  fourBet: {
    key: 'fourBet', label: '4-Bet %', plainName: 'Re-re-raise rate', unit: '%', category: 'preflop',
    definition: 'Preflop 4-bets / times faced a 3-bet',
    tells: 'Distinguishes a real 3-bet-back range from a bluff-prone one.',
    plain: 'How often they fire back a third raise. Near zero means their re-raises fold to pressure.',
    oppMultiplier: 0.12, highIsAggressive: true,
  },
  coldCall: {
    key: 'coldCall', label: 'Cold Call %', plainName: 'Flats a raise', unit: '%', category: 'preflop',
    definition: 'Calls of an open (no prior money in) / opportunities',
    tells: 'Flatting tendency; flags squeeze and isolation spots.',
    plain: 'How often they just call a raise instead of folding or re-raising.',
    oppMultiplier: 0.5,
  },
  steal: {
    key: 'steal', label: 'Steal Attempt', plainName: 'Late-position aggression', unit: '%', category: 'preflop',
    definition: 'Open-raise from CO/BTN/SB / opportunities there',
    tells: 'Late-position aggression. High = defend blinds wider vs them.',
    plain: 'How often they try to grab the blinds from late position.',
    oppMultiplier: 0.45, highIsAggressive: true,
  },
  foldToSteal: {
    key: 'foldToSteal', label: 'Fold BB to Steal', plainName: 'Gives up the blind', unit: '%', category: 'preflop',
    definition: 'BB folds vs a steal / times faced a steal in BB',
    tells: 'High = steal their blind relentlessly from late position.',
    plain: 'How often they fold their big blind to a late raise. High = steal from them all day.',
    oppMultiplier: 0.33,
  },
  cbetFlop: {
    key: 'cbetFlop', label: 'C-Bet Flop', plainName: 'Bets the flop after raising', unit: '%', category: 'postflop',
    definition: 'Flop bets as preflop aggressor / flops seen as PF aggressor',
    tells: 'Continuation aggression. Very high = float and raise back.',
    plain: 'After raising before the flop, how often they keep betting the flop.',
    oppMultiplier: 0.4, highIsAggressive: true,
  },
  cbetTurn: {
    key: 'cbetTurn', label: 'C-Bet Turn', plainName: 'Fires a second barrel', unit: '%', category: 'postflop',
    definition: 'Turn bets as aggressor / turns reached having c-bet flop',
    tells: 'Double-barrel frequency. Low = their flop bet is weak/giving up.',
    plain: 'How often they keep betting on the turn after betting the flop.',
    oppMultiplier: 0.25, highIsAggressive: true,
  },
  foldToCbetFlop: {
    key: 'foldToCbetFlop', label: 'Fold to C-Bet (Flop)', plainName: 'Folds to a flop bet', unit: '%', category: 'postflop',
    definition: 'Folds to flop c-bet / times faced a flop c-bet',
    tells: 'High (>55%) = c-bet relentlessly as a bluff vs them.',
    plain: 'How often they fold when the raiser bets the flop. High = keep betting and take it.',
    oppMultiplier: 0.35,
  },
  foldToCbetTurn: {
    key: 'foldToCbetTurn', label: 'Fold to Turn C-Bet', plainName: 'Folds to a turn bet', unit: '%', category: 'postflop',
    definition: 'Folds to turn barrel / times faced one',
    tells: 'High = second barrel prints; low = they float, slow down.',
    plain: 'How often they fold to a second bet on the turn.',
    oppMultiplier: 0.2,
  },
  checkRaise: {
    key: 'checkRaise', label: 'Check-Raise %', plainName: 'Traps with a check-raise', unit: '%', category: 'postflop',
    definition: 'Check-raises / times checked then faced a bet',
    tells: 'Trickiness. High = pot-control; your thin value bets get punished.',
    plain: 'How often they check then raise — a trap move. High = be careful betting into them.',
    oppMultiplier: 0.3, highIsAggressive: true,
  },
  donk: {
    key: 'donk', label: 'Donk Bet %', plainName: 'Leads into the raiser', unit: '%', category: 'postflop',
    definition: 'Bets into the prior-street aggressor / opportunities',
    tells: 'Usually a weakness signal; often a capped/weak range.',
    plain: 'How often they bet out into the person who raised — usually a sign of a weak hand.',
    oppMultiplier: 0.3,
  },
  wtsd: {
    key: 'wtsd', label: 'WTSD %', plainName: 'Goes to showdown', unit: '%', category: 'postflop',
    definition: 'Hands going to showdown / hands seeing the flop',
    tells: 'Showdown willingness. High = value bet thin, don’t bluff.',
    plain: 'How often they stick around to the end to see cards. High = don’t try to bluff them.',
    oppMultiplier: 0.45,
  },
  wsd: {
    key: 'wsd', label: 'W$SD %', plainName: 'Wins at showdown', unit: '%', category: 'postflop',
    definition: 'Showdowns won / showdowns reached',
    tells: 'Showdown hand quality. Low W$SD + high WTSD = calling station.',
    plain: 'When they get to the end, how often they actually win.',
    oppMultiplier: 0.18,
  },
  wwsf: {
    key: 'wwsf', label: 'WWSF %', plainName: 'Wins after seeing the flop', unit: '%', category: 'postflop',
    definition: 'Hands won when saw flop / flops seen',
    tells: 'Overall postflop win-rate; aggression effectiveness.',
    plain: 'Overall, how often they win a pot once they’ve seen the flop.',
    oppMultiplier: 0.45,
  },
  af: {
    key: 'af', label: 'AF', plainName: 'Aggression (ratio)', unit: 'ratio', category: 'postflop',
    definition: '(Bets + Raises) / Calls, postflop',
    tells: '>3 = aggressive; <1 = passive / station.',
    plain: 'How much they bet and raise vs. just call after the flop. High = aggressive.',
    oppMultiplier: 0.4,
  },
  afq: {
    key: 'afq', label: 'AFq', plainName: 'Aggression frequency', unit: '%', category: 'postflop',
    definition: '(Bets + Raises) / (Bets + Raises + Calls + Folds)',
    tells: '% of actions that are aggressive. More stable than AF on small samples.',
    plain: 'Out of everything they do after the flop, how much is betting/raising.',
    oppMultiplier: 0.4, highIsAggressive: true,
  },
  riverBet: {
    key: 'riverBet', label: 'River Bet/Raise %', plainName: 'River pressure', unit: '%', category: 'postflop',
    definition: 'River bets+raises / river decision points',
    tells: 'River polarization; whether big river bets are value-heavy or bluffy.',
    plain: 'How aggressive they are on the final card.',
    oppMultiplier: 0.3, highIsAggressive: true,
  },
}

export const STAT_ORDER: StatKey[] = [
  'vpip', 'pfr', 'gap', 'threeBet', 'foldTo3Bet', 'fourBet', 'coldCall', 'steal', 'foldToSteal',
  'cbetFlop', 'cbetTurn', 'foldToCbetFlop', 'foldToCbetTurn', 'checkRaise', 'donk',
  'wtsd', 'wsd', 'wwsf', 'af', 'afq', 'riverBet',
]
