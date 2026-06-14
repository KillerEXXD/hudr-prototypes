import type { Player, PlayerDimensions, PlayerStyle, SkillRating, Rivalry, PlayerStrength, PlayerLeak, PlayerTrend, CareerSparkline } from '@/types'

// Real headshots bundled under public/players/ (served same-origin — no hotlink/rate-limit
// issues). PlayerAvatar falls back to the initials circle if an image is missing.
const IMG = (id: string) => `${import.meta.env.BASE_URL}players/${id}.jpg`
export const PLAYERS: Player[] = [
  { id: 'p1', name: 'Daniel Negreanu', flag: '\u{1F1E8}\u{1F1E6}', initials: 'DN', color: '#ea580c', finish: 1, status: 'winner', hands: 87, startStack: 4500000, endStack: 9350000, photoUrl: IMG('p1') },
  { id: 'p2', name: 'Phil Ivey', flag: '\u{1F1FA}\u{1F1F8}', initials: 'PI', color: '#2563eb', finish: 2, status: 'runner-up', hands: 87, startStack: 3200000, endStack: 0, photoUrl: IMG('p2') },
  { id: 'p3', name: 'Phil Hellmuth', flag: '\u{1F1FA}\u{1F1F8}', initials: 'PH', color: '#7c3aed', finish: 3, status: 'eliminated', hands: 72, startStack: 2800000, endStack: 0, photoUrl: IMG('p3') },
  { id: 'p4', name: 'Justin Bonomo', flag: '\u{1F1FA}\u{1F1F8}', initials: 'JB', color: '#059669', finish: 4, status: 'eliminated', hands: 65, startStack: 2100000, endStack: 0, photoUrl: IMG('p4') },
  { id: 'p5', name: 'Vanessa Selbst', flag: '\u{1F1FA}\u{1F1F8}', initials: 'VS', color: '#dc2626', finish: 5, status: 'eliminated', hands: 58, startStack: 1800000, endStack: 0, photoUrl: IMG('p5') },
  { id: 'p6', name: 'Fedor Holz', flag: '\u{1F1E9}\u{1F1EA}', initials: 'FH', color: '#0891b2', finish: 6, status: 'eliminated', hands: 52, startStack: 1500000, endStack: 0, photoUrl: IMG('p6') },
  { id: 'p7', name: 'Bryn Kenney', flag: '\u{1F1FA}\u{1F1F8}', initials: 'BK', color: '#d97706', finish: 7, status: 'eliminated', hands: 44, startStack: 1200000, endStack: 0, photoUrl: IMG('p7') },
  { id: 'p8', name: 'Maria Konnikova', flag: '\u{1F1FA}\u{1F1F8}', initials: 'MK', color: '#e11d48', finish: 8, status: 'eliminated', hands: 35, startStack: 900000, endStack: 0, photoUrl: IMG('p8') },
  { id: 'p9', name: 'Erik Seidel', flag: '\u{1F1FA}\u{1F1F8}', initials: 'ES', color: '#6366f1', finish: 9, status: 'eliminated', hands: 28, startStack: 600000, endStack: 0, photoUrl: IMG('p9') },
]

export const PLAYER_DIMENSIONS: Record<string, PlayerDimensions> = {
  p1: { aggression: 72, risk: 58, icm: 78, precision: 82, adaptability: 75, clutch: 88 },
  p2: { aggression: 85, risk: 65, icm: 72, precision: 90, adaptability: 88, clutch: 92 },
  p3: { aggression: 48, risk: 38, icm: 85, precision: 65, adaptability: 52, clutch: 60 },
  p4: { aggression: 68, risk: 55, icm: 70, precision: 78, adaptability: 72, clutch: 76 },
  p5: { aggression: 88, risk: 78, icm: 45, precision: 72, adaptability: 82, clutch: 70 },
  p6: { aggression: 70, risk: 52, icm: 75, precision: 80, adaptability: 78, clutch: 82 },
  p7: { aggression: 92, risk: 85, icm: 35, precision: 62, adaptability: 70, clutch: 58 },
  p8: { aggression: 35, risk: 28, icm: 90, precision: 55, adaptability: 40, clutch: 45 },
  p9: { aggression: 42, risk: 30, icm: 88, precision: 75, adaptability: 48, clutch: 85 },
}

export const PLAYER_IDENTITIES: Record<string, string> = {
  p1: 'A calculated predator who picks spots with surgical precision \u2014 patient, reads the table, strikes on rivers.',
  p2: 'The most complete player at the table \u2014 relentless across all streets, impossible to put on a hand.',
  p3: 'Plays like a loaded spring \u2014 ultra-tight, ultra-predictable, but devastating when he wakes up with a hand.',
  p4: 'A balanced technician who grinds edges through positional play and well-timed aggression.',
  p5: 'A fearless LAG who bulldozes through tables \u2014 high variance, high reward, always in the mix.',
  p6: 'GTO robot with a human touch \u2014 exploits small edges across thousands of decisions.',
  p7: 'A volatile force of nature \u2014 either stacking everyone or busting first. No in-between.',
  p8: 'A glacier at the poker table \u2014 waits endlessly, then strikes once with overwhelming force.',
  p9: 'The silent assassin \u2014 plays the fewest hands but wins the biggest pots through sheer aggression when committed.',
}

export const STYLES: Record<string, PlayerStyle> = {
  p1: { label: 'TAG', emoji: '\u{1F3AF}', desc: 'Tight-Aggressive \u2014 selective but assertive' },
  p2: { label: 'TAG', emoji: '\u{1F3AF}', desc: 'Tight-Aggressive \u2014 precision and aggression' },
  p3: { label: 'TAG', emoji: '\u{1F3AF}', desc: 'Tight-Aggressive \u2014 exploitative tendencies' },
  p4: { label: 'TAG', emoji: '\u{1F3AF}', desc: 'Tight-Aggressive \u2014 balanced and solid' },
  p5: { label: 'LAG', emoji: '\u{1F525}', desc: 'Loose-Aggressive \u2014 wide ranges, high aggression' },
  p6: { label: 'TAG', emoji: '\u{1F3AF}', desc: 'Tight-Aggressive \u2014 GTO-oriented' },
  p7: { label: 'LAG', emoji: '\u{1F525}', desc: 'Loose-Aggressive \u2014 relentless pressure' },
  p8: { label: 'Nit', emoji: '\u{1F9CA}', desc: 'Very tight \u2014 folds most, plays premium only' },
  p9: { label: 'Nit', emoji: '\u{1F9CA}', desc: 'Ultra-tight \u2014 maximum aggression when committed' },
}

export const SKILL_RATINGS: Record<string, SkillRating> = {
  p1: { grade: 'A+', color: '#059669' },
  p2: { grade: 'A', color: '#16a34a' },
  p3: { grade: 'B', color: '#2563eb' },
  p4: { grade: 'A', color: '#16a34a' },
  p5: { grade: 'A', color: '#16a34a' },
  p6: { grade: 'A', color: '#16a34a' },
  p7: { grade: 'B', color: '#2563eb' },
  p8: { grade: 'C', color: '#d97706' },
  p9: { grade: 'B', color: '#2563eb' },
}

export const LUCK_SCORES: Record<string, number> = {
  p1: 12, p2: 5, p3: -3, p4: 2, p5: -8, p6: 1, p7: -12, p8: -5, p9: 15,
}

export const CAREERS: Record<string, string> = {
  p1: '6 FTs | 2 Wins | Avg Finish: 2.1',
  p2: '5 FTs | 3 Wins | Avg Finish: 1.8',
  p3: '8 FTs | 1 Win | Avg Finish: 3.2',
  p4: '4 FTs | 1 Win | Avg Finish: 2.5',
  p5: '3 FTs | 1 Win | Avg Finish: 2.3',
  p6: '4 FTs | 2 Wins | Avg Finish: 2.0',
  p7: '3 FTs | 0 Wins | Avg Finish: 4.1',
  p8: '2 FTs | 0 Wins | Avg Finish: 5.5',
  p9: '7 FTs | 1 Win | Avg Finish: 3.0',
}

export const RIVALRIES: Record<string, Rivalry[]> = {
  p1: [
    { opponentId: 'p2', score: 82, label: 'Arch-Nemesis', color: '#dc2626' },
    { opponentId: 'p3', score: 65, label: 'Major Rival', color: '#ea580c' },
  ],
  p2: [
    { opponentId: 'p1', score: 82, label: 'Arch-Nemesis', color: '#dc2626' },
    { opponentId: 'p5', score: 58, label: 'Major Rival', color: '#ea580c' },
  ],
}

export const PLAYER_STRENGTHS_DATA: Record<string, PlayerStrength[]> = {
  p1: [
    { title: 'Selective Aggressor', stat: 'PFR/VPIP: 0.79', desc: 'Enters pots with raises not calls \u2014 strong hand selection with assertive entry.' },
    { title: 'River Value Extraction', stat: 'WSD: 54%', desc: 'Wins 54% at showdown \u2014 consistently picks the right spots to go to war.' },
    { title: 'Profitable Stealer', stat: 'Steal: 38%, Fold-to-Resteal: 55%', desc: 'Active stealer with adequate defense when challenged on steals.' },
  ],
  p2: [
    { title: 'Balanced Street Aggression', stat: 'AF Flop/Turn/River: 3.8/3.2/3.1', desc: 'Maintains aggression across all streets \u2014 relentless, consistent pressure.' },
    { title: 'Active 3-Bettor', stat: '3-Bet: 11%, Fold-to-4Bet: <55%', desc: 'Aggressive 3-bettor who defends vs 4-bets \u2014 not a one-and-done raiser.' },
    { title: 'Showdown Warrior', stat: 'WSD: 58%, WTSD: 38%', desc: 'Picks showdown spots carefully and wins at an elite rate.' },
    { title: 'Effective Check-Raiser', stat: 'CR Flop: 10%', desc: 'Uses check-raises to trap aggressive opponents \u2014 multi-dimensional.' },
  ],
  p3: [
    { title: 'ICM Awareness', stat: 'VPIP: 22%, Fold-to-3B: 62%', desc: 'Plays a disciplined, survival-oriented style well-suited for deep tournament runs.' },
    { title: 'C-Bet Continuation', stat: 'Flop/Turn/River: 65/45/30%', desc: 'Measured c-bet frequencies that avoid overcommitting to weak boards.' },
  ],
  p4: [
    { title: 'Selective Aggressor', stat: 'PFR/VPIP: 0.81', desc: 'One of the highest PFR-to-VPIP ratios at the table \u2014 enters pots aggressively.' },
    { title: 'Showdown Winner', stat: 'WSD: 52%', desc: 'Above-average showdown conversion rate shows strong hand reading ability.' },
    { title: 'Profitable Stealer', stat: 'Steal: 40%, Fold-to-Resteal: 52%', desc: 'Steals actively and defends well when three-bet.' },
  ],
  p5: [
    { title: 'Maximum Pressure', stat: 'AF: 3.0, 3-Bet: 12%', desc: 'Puts opponents in high-pressure situations constantly with wide aggression.' },
    { title: 'Effective Check-Raiser', stat: 'CR Flop: 11%', desc: 'Traps aggressors with well-timed check-raises on the flop.' },
    { title: 'Squeeze Play User', stat: '3-Bet: 12%, Wide Steal: 46%', desc: 'Punishes flat-callers with squeeze plays \u2014 a multi-bet weapon.' },
  ],
  p6: [
    { title: 'Balanced Fundamentals', stat: 'VPIP:25/PFR:20/AF:2.8', desc: 'Well-balanced core stats \u2014 near-optimal ranges across all situations.' },
    { title: 'Won Without Showdown', stat: 'WSD: 55%, Low WTSD: 37%', desc: 'Wins pots without needing to show cards \u2014 aggressive postflop forcing folds.' },
    { title: 'Check-Raise Game', stat: 'CR Flop: 9%', desc: 'Healthy check-raise frequency adds deception to defensive play.' },
  ],
  p7: [
    { title: 'Maximum Street Aggression', stat: 'AF Flop: 3.6, Triple Barrel', desc: 'The most aggressive player at the table \u2014 fires on every street relentlessly.' },
    { title: 'Highest Check-Raise Frequency', stat: 'CR Flop: 12%', desc: 'Uses check-raises more than anyone \u2014 opponents can never feel safe betting into him.' },
  ],
  p8: [
    { title: 'ICM Discipline', stat: 'VPIP: 20%, Fold-to-Steal: 65%', desc: 'Maximum patience \u2014 survives by avoiding marginal spots and preserving stack.' },
  ],
  p9: [
    { title: 'River Closer', stat: 'AF River: 3.8', desc: 'Highest river aggression at the table \u2014 applies maximum pressure at the final decision point.' },
    { title: 'Showdown Precision', stat: 'WSD: 60%, WTSD: 33%', desc: 'Rarely goes to showdown but wins 60% when he does \u2014 elite hand selection.' },
    { title: 'ICM Mastery', stat: 'VPIP: 18%, Tight + Deadly', desc: 'Plays the fewest hands but makes every one count with extreme conviction.' },
  ],
}

export const PLAYER_LEAKS_DATA: Record<string, PlayerLeak[]> = {
  p1: [
    { title: 'River Aggression Drop', severity: 'moderate', stat: 'AF River: 2.1 (vs 3.2 flop)', desc: 'Aggression drops significantly on later streets \u2014 opponents can call turns knowing the river is safe.' },
    { title: 'Overfolds BB Defense', severity: 'moderate', stat: 'Fold-to-Steal: 55%', desc: 'Folds slightly too much in blinds \u2014 can be exploited with wider late-position steals.' },
  ],
  p2: [
    { title: 'Limited ICM Adjustment', severity: 'minor', stat: 'Same ranges regardless of stack depth', desc: 'Plays the same regardless of ICM pressure \u2014 exploitable near bubble situations.' },
  ],
  p3: [
    { title: 'Overfolds to 3-Bets', severity: 'critical', stat: 'Fold-to-3B: 62%', desc: 'Folds way too much to 3-bets \u2014 free money for opponents who 3-bet light.' },
    { title: 'Low Check-Raise Frequency', severity: 'moderate', stat: 'CR Flop: 5%', desc: 'Virtually never check-raises \u2014 one-dimensional postflop play that\u2019s easy to exploit.' },
    { title: 'Passive on River', severity: 'moderate', stat: 'AF River: 1.8', desc: 'Shuts down on the river \u2014 opponents can bluff rivers profitably knowing he won\u2019t fight back.' },
    { title: 'Never 3-Bets Light', severity: 'minor', stat: '3-Bet: 7%', desc: '3-bet range is exclusively premium \u2014 opponents always know where they stand.' },
  ],
  p4: [
    { title: 'Low Check-Raise', severity: 'minor', stat: 'CR Flop: 7%', desc: 'Below-average check-raise frequency makes postflop play slightly predictable.' },
    { title: 'C-Bet Decline', severity: 'moderate', stat: 'Flop 70% \u2192 River 35%', desc: 'Gives up too easily on later streets \u2014 opponents float flop c-bets profitably.' },
  ],
  p5: [
    { title: 'Too Many Hands', severity: 'moderate', stat: 'VPIP: 30%, Negative ICM', desc: 'Plays too wide for a tournament setting \u2014 high-variance approach bleeds chips in marginal spots.' },
    { title: 'Low ICM Awareness', severity: 'critical', stat: 'No tightening near bubble', desc: 'Doesn\u2019t adjust for tournament pressure \u2014 can be trapped in ICM spots.' },
  ],
  p6: [
    { title: 'Predictable Turn Behavior', severity: 'minor', stat: 'C-Bet Turn: 52% (textbook)', desc: 'Turn play is somewhat formulaic \u2014 experienced opponents can read the pattern.' },
  ],
  p7: [
    { title: 'Goes to Showdown Too Often', severity: 'critical', stat: 'WTSD: 46%, WSD: 47%', desc: 'Goes to showdown too often and doesn\u2019t win enough \u2014 classic calling station tendency on later streets.' },
    { title: 'Low Showdown Win Rate', severity: 'critical', stat: 'WSD: 47%', desc: 'Reaches showdown frequently but loses more than wins \u2014 poor hand reading or stubbornness.' },
    { title: 'Zero ICM Awareness', severity: 'critical', stat: 'VPIP: 32%, Widest at table', desc: 'Plays as if it\u2019s a cash game \u2014 ignores tournament life preservation entirely.' },
  ],
  p8: [
    { title: 'Excessive Passivity', severity: 'critical', stat: 'AF: 1.8, PFR/VPIP: 0.80', desc: 'Plays too passively overall \u2014 misses value and allows opponents to see cheap cards.' },
    { title: 'Overfolds to Steals', severity: 'critical', stat: 'Fold-to-Steal: 65%', desc: 'Folds 65% to steals \u2014 opponents print money by opening wide against this player.' },
    { title: 'No Check-Raise Game', severity: 'moderate', stat: 'CR Flop: 4%', desc: 'Virtually never check-raises \u2014 entirely one-dimensional defensive strategy.' },
    { title: 'River Shutdown', severity: 'moderate', stat: 'AF River: 1.5, C-Bet River: 25%', desc: 'Completely passive on rivers \u2014 never bluffs, rarely value bets thin.' },
  ],
  p9: [
    { title: 'Ultra-Tight Entry', severity: 'moderate', stat: 'VPIP: 18%', desc: 'Folds too many playable hands \u2014 opponents can steal blinds constantly against this player.' },
    { title: 'Low Adaptability', severity: 'moderate', stat: 'Narrow action variety', desc: 'Plays the same style regardless of dynamics \u2014 easily adjustable to by observant opponents.' },
  ],
}

export const PLAYER_TRENDS: Record<string, PlayerTrend> = {
  p1: { vpip: 'stable', pfr: 'stable', af: 'decreasing', overall: 'stable', note: 'Consistent across 6 FTs' },
  p2: { vpip: 'decreasing', pfr: 'stable', af: 'increasing', overall: 'tightening', note: 'Getting more selective and aggressive' },
  p3: { vpip: 'decreasing', pfr: 'decreasing', af: 'stable', overall: 'tightening', note: 'Increasingly conservative over 8 FTs' },
  p4: { vpip: 'stable', pfr: 'increasing', af: 'stable', overall: 'stable', note: 'Becoming slightly more aggressive preflop' },
  p5: { vpip: 'increasing', pfr: 'increasing', af: 'stable', overall: 'loosening', note: 'Playing wider over recent FTs' },
  p6: { vpip: 'stable', pfr: 'stable', af: 'stable', overall: 'stable', note: 'Remarkably consistent GTO approach' },
  p7: { vpip: 'increasing', pfr: 'increasing', af: 'increasing', overall: 'loosening', note: 'Becoming more reckless' },
  p8: { vpip: 'decreasing', pfr: 'decreasing', af: 'decreasing', overall: 'tightening', note: 'Regressing into extreme nittery' },
  p9: { vpip: 'stable', pfr: 'stable', af: 'increasing', overall: 'stable', note: 'Same tight range but more aggressive postflop' },
}

export const CAREER_SPARKLINES: Record<string, CareerSparkline> = {
  p1: { vpip: [30, 29, 28, 27, 28, 28], pfr: [23, 22, 22, 21, 22, 22], af: [3.1, 2.9, 2.8, 2.7, 2.8, 2.8] },
  p2: { vpip: [24, 25, 26, 25, 26, 26], pfr: [20, 21, 22, 21, 22, 22], af: [3.5, 3.3, 3.4, 3.5, 3.2, 3.4] },
  p3: { vpip: [22, 24, 25, 23, 24, 24], pfr: [18, 20, 21, 19, 20, 20], af: [2.4, 2.2, 2.3, 2.5, 2.2, 2.3] },
  p4: { vpip: [30, 32, 31, 33, 32, 32], pfr: [20, 19, 18, 19, 18, 18], af: [2.0, 1.8, 1.9, 1.7, 1.8, 1.8] },
  p5: { vpip: [30, 29, 31, 30, 30, 30], pfr: [22, 23, 24, 23, 24, 24], af: [3.0, 2.8, 3.1, 2.9, 3.0, 3.0] },
  p6: { vpip: [19, 18, 17, 18, 17, 17], pfr: [16, 15, 14, 15, 14, 14], af: [2.5, 2.6, 2.4, 2.5, 2.5, 2.5] },
  p7: { vpip: [27, 28, 26, 27, 27, 27], pfr: [20, 21, 19, 20, 20, 20], af: [2.2, 2.0, 2.1, 2.3, 2.1, 2.1] },
  p8: { vpip: [20, 22, 21, 23, 22, 22], pfr: [15, 16, 15, 17, 16, 16], af: [1.8, 1.9, 2.0, 1.8, 1.9, 1.9] },
  p9: { vpip: [25, 24, 23, 24, 23, 23], pfr: [20, 19, 18, 19, 18, 18], af: [2.8, 2.7, 2.9, 2.8, 2.8, 2.8] },
}
