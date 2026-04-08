import type { PlayerStats, Insight, ScoutingText } from '@/types'

export const STATS: Record<string, PlayerStats> = {
  p1: { vpip: 28, pfr: 22, threeBet: 9, af: 2.8, wtsd: 42, wsd: 54, steal: 38, foldToSteal: 55, cbetFlop: 72, cbetTurn: 52, cbetRiver: 38, checkRaiseFlop: 8, afFlop: 3.2, afRiver: 2.1, totalHands: 87 },
  p2: { vpip: 24, pfr: 20, threeBet: 11, af: 3.5, wtsd: 38, wsd: 58, steal: 44, foldToSteal: 48, cbetFlop: 68, cbetTurn: 55, cbetRiver: 42, checkRaiseFlop: 10, afFlop: 3.8, afRiver: 3.1, totalHands: 87 },
  p3: { vpip: 22, pfr: 18, threeBet: 7, af: 2.2, wtsd: 45, wsd: 48, steal: 32, foldToSteal: 62, cbetFlop: 65, cbetTurn: 45, cbetRiver: 30, checkRaiseFlop: 5, afFlop: 2.5, afRiver: 1.8, totalHands: 72 },
  p4: { vpip: 26, pfr: 21, threeBet: 10, af: 2.5, wtsd: 40, wsd: 52, steal: 40, foldToSteal: 52, cbetFlop: 70, cbetTurn: 50, cbetRiver: 35, checkRaiseFlop: 7, afFlop: 2.9, afRiver: 2.0, totalHands: 65 },
  p5: { vpip: 30, pfr: 24, threeBet: 12, af: 3.0, wtsd: 44, wsd: 50, steal: 46, foldToSteal: 45, cbetFlop: 74, cbetTurn: 58, cbetRiver: 40, checkRaiseFlop: 11, afFlop: 3.4, afRiver: 2.5, totalHands: 58 },
  p6: { vpip: 25, pfr: 20, threeBet: 9, af: 2.8, wtsd: 37, wsd: 55, steal: 42, foldToSteal: 50, cbetFlop: 69, cbetTurn: 52, cbetRiver: 36, checkRaiseFlop: 9, afFlop: 3.1, afRiver: 2.4, totalHands: 52 },
  p7: { vpip: 32, pfr: 26, threeBet: 13, af: 3.2, wtsd: 46, wsd: 47, steal: 50, foldToSteal: 42, cbetFlop: 76, cbetTurn: 60, cbetRiver: 44, checkRaiseFlop: 12, afFlop: 3.6, afRiver: 2.8, totalHands: 44 },
  p8: { vpip: 20, pfr: 16, threeBet: 6, af: 1.8, wtsd: 35, wsd: 45, steal: 28, foldToSteal: 65, cbetFlop: 60, cbetTurn: 40, cbetRiver: 25, checkRaiseFlop: 4, afFlop: 2.0, afRiver: 1.5, totalHands: 35 },
  p9: { vpip: 18, pfr: 14, threeBet: 5, af: 4.2, wtsd: 33, wsd: 60, steal: 30, foldToSteal: 60, cbetFlop: 62, cbetTurn: 48, cbetRiver: 32, checkRaiseFlop: 6, afFlop: 4.5, afRiver: 3.8, totalHands: 28 },
}

export const INSIGHTS: Insight[] = [
  { id: 'i1', icon: '\u{1F9E0}', title: "Negreanu's River Edge", text: 'Daniel Negreanu won 73% of pots that reached the river, the highest rate at the final table. His thin value bets averaged 62% pot.', border: 'var(--color-accent-amber)' },
  { id: 'i2', icon: '\u{1F4A1}', title: "Hellmuth's 3-Bet Weakness", text: "Phil Hellmuth's 3-bet frequency of 7% is well below the 10% average. Opponents stole 18% more pots when he was in the blinds.", border: 'var(--color-accent-blue)' },
  { id: 'i3', icon: '\u{1F525}', title: "Selbst's LAG Dominance", text: 'Vanessa Selbst played the widest range (VPIP 30%) yet maintained +EV through aggressive post-flop play with an AF of 3.0.', border: 'var(--color-accent-red)' },
]

export const SCOUTING_TEXT: ScoutingText = {
  p1: "Negreanu combines tight preflop selection with exceptional post-flop reading ability. His river AF of 2.1 suggests some potential for exploitation on later streets, but his overall win rate at showdown (54%) demonstrates strong hand selection. Target his BB defense with wider steals from late position.",
  p2: "Ivey is arguably the most complete player at the table. His AF of 3.5 across all streets makes him extremely difficult to play against. Focus on position advantage and avoid marginal spots. His fold-to-steal of 48% means he defends adequately.",
  p3: "Hellmuth plays an exploitable tight style with low 3-bet frequency (7%). Steal aggressively when he is in the blinds. His check-raise frequency of 5% means you can c-bet with high frequency. Be cautious when he shows aggression \u2014 his range is heavily weighted toward value.",
}
