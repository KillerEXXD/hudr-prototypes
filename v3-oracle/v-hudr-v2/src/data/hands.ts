import type { Highlight, QuizHand, GambitTheme, BluffReport } from '@/types'

export const HIGHLIGHTS: Highlight[] = [
  { id: 'h1', hand: 87, type: 'biggest_pot', tier: 'monster', board: 'Wet Flop', preview: "Negreanu rivers two pair to crack Ivey's pocket kings", pot: 89400000, players: ['p1', 'p2'], ytTime: 4821 },
  { id: 'h2', hand: 73, type: 'bluff', tier: 'air', board: 'Dry Board', preview: 'Hellmuth runs massive triple-barrel bluff on turn', pot: 42000000, players: ['p3', 'p5'], ytTime: 3950 },
  { id: 'h3', hand: 61, type: 'elimination', tier: 'strong', board: 'Paired Board', preview: 'Bonomo eliminated by Ivey with set over set', pot: 35600000, players: ['p2', 'p4'], ytTime: 3120 },
  { id: 'h4', hand: 55, type: 'hero_call', tier: 'medium', board: 'Monotone', preview: 'Selbst makes incredible hero call with second pair', pot: 28000000, players: ['p5', 'p7'], ytTime: 2800 },
  { id: 'h5', hand: 42, type: 'cooler', tier: 'monster', board: 'Wet Flop', preview: 'Holz flops the nut flush, Kenney flops a set', pot: 24000000, players: ['p6', 'p7'], ytTime: 2100 },
  { id: 'h6', hand: 31, type: 'bad_beat', tier: 'strong', board: 'Dry Board', preview: 'Konnikova gets unlucky on the river vs Seidel', pot: 18500000, players: ['p8', 'p9'], ytTime: 1500 },
]

export const QUIZ_HANDS: QuizHand[] = [
  {
    id: 'q1', hand: 55, situation: "4 players remain. You're in the BB with 15BB.", facing: 'CO raises 2.2x.', holeCards: ['Jh', 'Ts'],
    board: ['Kd', 'Qh', '4c'], street: 'Flop', pot: '6.8BB', action: 'Villain bets 3BB into 6.8BB pot.',
    options: ['Fold', 'Call', 'Raise All-In'],
    correct: 2, proAction: 'Raise All-In', proName: 'Selbst', equity: 42,
    explanation: 'Open-ended straight draw + overcards. With 15BB, shoving maximizes fold equity and equity realization. Calling is too passive with this stack depth.',
    proPercent: 72,
  },
  {
    id: 'q2', hand: 73, situation: "3 players remain. You're on BTN with 22BB.", facing: 'You opened 2.2x, BB called.', holeCards: ['9c', '7c'],
    board: ['Ks', '8d', '2h', '6c'], street: 'Turn', pot: '12BB', action: 'BB checks to you.',
    options: ['Check Back', 'Bet 6BB', 'Bet All-In'],
    correct: 1, proAction: 'Bet 6BB', proName: 'Hellmuth', equity: 28,
    explanation: 'Hellmuth fires the triple barrel with 9-high here. The turn 6c gives him a gutshot to go with the bluff. Bold, but only 48% of pros agree \u2014 a controversial play.',
    proPercent: 48,
  },
  {
    id: 'q3', hand: 31, situation: "6 players remain. You're in the SB with 28BB.", facing: 'Folded to you. BB is a tight nit.', holeCards: ['Ah', '3d'],
    board: [], street: 'Preflop', pot: '2.5BB', action: 'Action on you.',
    options: ['Fold', 'Limp', 'Raise 2.5x'],
    correct: 2, proAction: 'Raise 2.5x', proName: 'Negreanu', equity: 60,
    explanation: "Against a nit folding 65%+ to steals, any ace is a profitable steal. Negreanu opens wide here knowing the BB won't defend light.",
    proPercent: 85,
  },
]

export const GAMBIT_THEMES: GambitTheme[] = [
  { id: 'g1', name: 'The River Trap', icon: '\u{1F3AD}', hand: 61, desc: 'Ivey slowplays top set, then check-raises river for max value', color: '#f59e0b' },
  { id: 'g2', name: 'The Squeeze', icon: '\u26A1', hand: 34, desc: 'Selbst 3-bet squeezes with suited connectors vs two callers', color: '#3b82f6' },
  { id: 'g3', name: 'The Stone Cold Bluff', icon: '\u2744\uFE0F', hand: 73, desc: 'Hellmuth fires three barrels with complete air \u2014 nine-high', color: '#ef4444' },
  { id: 'g4', name: 'The Cooler', icon: '\u{1F4A5}', hand: 42, desc: "Holz nut flush vs Kenney flopped set \u2014 an unavoidable collision", color: '#7c3aed' },
]

export const BLUFF_REPORT: BluffReport[] = [
  { hand: 73, bluffer: 'p3', victim: 'p5', street: 'River', sizing: '2.5x pot', holding: '9\u26639\u2660 (nine-high)', board: ['Ks', '8d', '2h', '6c', 'Jh'], result: 'fold', success: true },
  { hand: 45, bluffer: 'p7', victim: 'p4', street: 'Turn', sizing: '75% pot', holding: 'T\u2663 9\u2663 (missed draw)', board: ['Ah', '5d', '3s', '8c'], result: 'call', success: false },
  { hand: 18, bluffer: 'p1', victim: 'p3', street: 'River', sizing: '33% pot', holding: 'A\u2660 4\u2660 (ace-high)', board: ['Kh', 'Qc', '7d', '2s', '9h'], result: 'fold', success: true },
]

export const YT_BASE = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t='
