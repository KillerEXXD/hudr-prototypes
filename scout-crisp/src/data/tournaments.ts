import type { Tournament, TournamentDetail, StoryArc } from '@/types'

export const TOURNAMENT: TournamentDetail = {
  name: '$25K WSOP Super Main Event',
  event: 'World Series of Poker',
  venue: 'Atlantis, Bahamas',
  date: 'Dec 2024',
  playerCount: 9,
  handCount: 87,
  prizePool: 93500000,
  gradient: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
}

export const TOURNAMENTS_LIST: Tournament[] = [
  { id: 't1', name: '$25K WSOP Super Main Event', event: 'World Series of Poker', venue: 'Atlantis, Bahamas', date: 'Dec 2024', players: 9, hands: 87, prize: 93500000, live: false, status: 'completed', aiReports: ['insights', 'players', 'story', 'quiz', 'commentary'], exploitable: 4, leaks: 48, rivalries: 6, topPlayers: ['p1', 'p2', 'p3', 'p5'], winner: 'p1', duration: '4h 23m', youtubeId: '-bNvm2hx3MQ' },
  { id: 't2', name: 'WPT Legends', event: 'World Poker Tour', venue: 'Commerce Casino', date: 'March 2025', players: 8, hands: 62, prize: 25000000, live: true, status: 'live', aiReports: ['insights', 'players', 'story'], exploitable: 3, leaks: 31, rivalries: 4, topPlayers: ['p2', 'p4', 'p6', 'p7'], winner: null, duration: '2h 48m' },
  { id: 't3', name: 'EPT Barcelona', event: 'European Poker Tour', venue: 'Casino Barcelona', date: 'August 2025', players: 9, hands: 95, prize: 42000000, live: false, status: 'completed', aiReports: ['insights', 'players', 'story', 'commentary'], exploitable: 5, leaks: 52, rivalries: 8, topPlayers: ['p5', 'p3', 'p9', 'p1'], winner: 'p5', duration: '5h 10m' },
  { id: 't4', name: '$100K NLH Main Event — Triton SHRS', event: 'Triton Poker', venue: 'Maestral, Montenegro', date: 'Jun 2026', players: 6, hands: 45, prize: 18000000, live: false, status: 'completed', aiReports: [], exploitable: 0, leaks: 0, rivalries: 0, topPlayers: ['p6', 'p2', 'p4'], winner: 'p6', duration: '2h 15m', youtubeId: 'fp1OWmFkD1k' },
  { id: 't5', name: 'PokerGO Cup Event #4 — $10K NLH', event: 'PokerGO', venue: 'ARIA, Las Vegas', date: 'Feb 2025', players: 7, hands: 71, prize: 51000000, live: false, status: 'completed', aiReports: ['insights', 'players'], exploitable: 2, leaks: 22, rivalries: 3, topPlayers: ['p2', 'p1', 'p6', 'p4'], winner: 'p2', duration: '3h 42m', youtubeId: 'zNvu8ZmTGB0' },
  { id: 't6', name: 'PCA Main Event', event: 'PokerStars', venue: 'Atlantis Bahamas', date: 'January 2026', players: 9, hands: 0, prize: 35000000, live: false, status: 'upcoming', aiReports: [], exploitable: 0, leaks: 0, rivalries: 0, topPlayers: [], winner: null, duration: null },
  { id: 't7', name: 'Aussie Millions', event: 'Crown Melbourne', venue: 'Melbourne', date: 'February 2026', players: 8, hands: 0, prize: 28000000, live: false, status: 'upcoming', aiReports: [], exploitable: 0, leaks: 0, rivalries: 0, topPlayers: [], winner: null, duration: null },
  { id: 't8', name: 'WSOP Europe', event: 'World Series of Poker', venue: "King's Casino Rozvadov", date: 'October 2025', players: 9, hands: 82, prize: 31000000, live: false, status: 'completed', aiReports: ['insights', 'players', 'story', 'quiz'], exploitable: 3, leaks: 36, rivalries: 5, topPlayers: ['p9', 'p3', 'p7', 'p1'], winner: 'p9', duration: '4h 05m' },
  { id: 't9', name: 'WPT World Championship', event: 'World Poker Tour', venue: 'Wynn Las Vegas', date: 'December 2025', players: 6, hands: 58, prize: 40000000, live: false, status: 'completed', aiReports: [], exploitable: 0, leaks: 0, rivalries: 0, topPlayers: ['p4', 'p7', 'p8'], winner: 'p4', duration: '3h 12m' },
  { id: 't10', name: 'GPI Poker Masters', event: 'PokerGO', venue: 'Aria Las Vegas', date: 'April 2025', players: 8, hands: 0, prize: 15000000, live: true, status: 'live', aiReports: [], exploitable: 0, leaks: 0, rivalries: 0, topPlayers: ['p3', 'p8', 'p5', 'p7'], winner: null, duration: null },
]

export const STORY_ARC: StoryArc = {
  chapters: [
    {
      id: 'ch1', title: 'The Opening Salvo', handRange: 'Hands 1\u201325', mood: 'calm', color: '#3b82f6',
      summary: 'Cautious play early as players size each other up. Negreanu establishes table image with selective aggression. Two quick eliminations thin the field.',
      keyHand: { hand: 12, desc: 'Konnikova eliminated by Ivey \u2014 AK vs QQ all-in preflop', board: ['As', 'Kh', '7c', '3d', '2s'] },
    },
    {
      id: 'ch2', title: 'The Grind', handRange: 'Hands 26\u201355', mood: 'tense', color: '#f59e0b',
      summary: 'The middle stretch sees wild stack volatility. Hellmuth doubles through Bonomo on a cooler. Selbst makes a legendary hero call on the river.',
      keyHand: { hand: 42, desc: "Holz flops nut flush vs Kenney's set \u2014 massive 42M pot", board: ['9h', '6h', '2h', 'Jc', '4d'] },
    },
    {
      id: 'ch3', title: 'The Final Battle', handRange: 'Hands 56\u201387', mood: 'dramatic', color: '#ef4444',
      summary: 'Three-handed play explodes. Hellmuth fires a legendary triple-barrel bluff that gets picked off. Negreanu rivers two pair in the final hand to claim the title.',
      keyHand: { hand: 87, desc: "Negreanu rivers two pair to crack Ivey's pocket kings", board: ['Qh', '9d', '4c', '7s', 'Qc'] },
    },
  ],
  eliminations: [
    { hand: 12, playerId: 'p8', eliminatedBy: 'p2', desc: 'AK vs QQ all-in preflop' },
    { hand: 22, playerId: 'p9', eliminatedBy: 'p1', desc: 'Short-stacked shove with A5s' },
    { hand: 35, playerId: 'p7', eliminatedBy: 'p2', desc: 'Set over set on the flop' },
    { hand: 42, playerId: 'p6', eliminatedBy: 'p6', desc: 'Nut flush vs top set \u2014 cooler' },
    { hand: 52, playerId: 'p5', eliminatedBy: 'p1', desc: 'Hero call gone wrong' },
    { hand: 61, playerId: 'p4', eliminatedBy: 'p2', desc: 'Set over set again' },
    { hand: 72, playerId: 'p3', eliminatedBy: 'p1', desc: 'Massive bluff picked off' },
    { hand: 87, playerId: 'p2', eliminatedBy: 'p1', desc: 'Rivered two pair vs pocket kings' },
  ],
}

export const STACK_TIMELINE: Record<string, number[]> = {
  p1: [4500000, 4200000, 4800000, 5100000, 4900000, 5500000, 6200000, 6800000, 7500000, 8200000, 9350000],
  p2: [3200000, 3800000, 4200000, 3900000, 4500000, 5000000, 5800000, 6100000, 5500000, 4200000, 0],
  p3: [2800000, 3100000, 2600000, 2900000, 2400000, 2100000, 1800000, 0],
  p4: [2100000, 2300000, 2000000, 2500000, 2200000, 1800000, 0],
  p5: [1800000, 2200000, 2800000, 2400000, 1900000, 0],
  p6: [1500000, 1300000, 1700000, 1200000, 0],
  p7: [1200000, 900000, 1100000, 0],
  p8: [900000, 700000, 0],
  p9: [600000, 0],
}
