/**
 * HUDR Prototypes — Shared Mock Data
 * Used by all 7 prototype designs.
 */

// =====================
// Tournaments
// =====================
const TOURNAMENTS = [
  {
    id: 'wsop-me-2025',
    name: 'WSOP Main Event 2025',
    subtitle: 'Final Table',
    event: 'World Series of Poker',
    season: '2025',
    date: '2025-07-15',
    venue: 'Horseshoe Casino, Las Vegas',
    buyIn: 10000,
    prizePool: 93453000,
    playerCount: 9,
    totalEntrants: 10112,
    status: 'completed',
    liveStatus: 'none',
    handCount: 87,
    blindLevel: '200K/400K/400K',
    commentators: 'Norman Chad, Lon McEachern',
    youtubeUrl: 'https://youtube.com/watch?v=example1',
    imageGradient: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    aiFunEnabled: true,
  },
  {
    id: 'wpt-borgata-2025',
    name: 'WPT Borgata Winter Open',
    subtitle: 'Final Table',
    event: 'World Poker Tour',
    season: '2025',
    date: '2025-01-28',
    venue: 'Borgata Hotel, Atlantic City',
    buyIn: 3500,
    prizePool: 2850000,
    playerCount: 6,
    totalEntrants: 892,
    status: 'completed',
    liveStatus: 'none',
    handCount: 62,
    blindLevel: '100K/200K/200K',
    commentators: 'Vince Van Patten, Tony Dunst',
    youtubeUrl: 'https://youtube.com/watch?v=example2',
    imageGradient: 'linear-gradient(135deg, #059669, #0d9488)',
    aiFunEnabled: true,
  },
  {
    id: 'ept-monte-carlo-2025',
    name: 'EPT Monte Carlo',
    subtitle: 'Main Event — LIVE',
    event: 'European Poker Tour',
    season: '2025',
    date: '2025-05-02',
    venue: 'Monte Carlo Casino, Monaco',
    buyIn: 5300,
    prizePool: 8200000,
    playerCount: 8,
    totalEntrants: 1654,
    status: 'in_progress',
    liveStatus: 'live',
    handCount: 34,
    blindLevel: '50K/100K/100K',
    commentators: 'James Hartigan, Joe Stapleton',
    youtubeUrl: 'https://youtube.com/watch?v=example3',
    imageGradient: 'linear-gradient(135deg, #dc2626, #f97316)',
    aiFunEnabled: true,
  },
  {
    id: 'aria-hr-2025',
    name: 'Aria High Roller',
    subtitle: '$25K Final Table',
    event: 'Aria Poker Classic',
    season: '2025',
    date: '2025-03-12',
    venue: 'Aria Resort & Casino, Las Vegas',
    buyIn: 25000,
    prizePool: 4750000,
    playerCount: 7,
    totalEntrants: 198,
    status: 'completed',
    liveStatus: 'none',
    handCount: 55,
    blindLevel: '150K/300K/300K',
    commentators: 'Ali Nejad, Nick Schulman',
    youtubeUrl: null,
    imageGradient: 'linear-gradient(135deg, #f59e0b, #ea580c)',
    aiFunEnabled: false,
  },
  {
    id: 'wsop-online-2025',
    name: 'WSOP Online Championship',
    subtitle: 'Event #15 — Upcoming',
    event: 'World Series of Poker',
    season: '2025',
    date: '2025-08-20',
    venue: 'WSOP.com',
    buyIn: 1000,
    prizePool: null,
    playerCount: 0,
    totalEntrants: 0,
    status: 'upcoming',
    liveStatus: 'none',
    handCount: 0,
    blindLevel: 'TBD',
    commentators: null,
    youtubeUrl: null,
    imageGradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    aiFunEnabled: false,
  },
];

// =====================
// Players (WSOP Main Event Final Table)
// =====================
const PLAYERS = [
  {
    id: 'p1',
    name: 'Daniel Negreanu',
    country: 'CA',
    countryFlag: '🇨🇦',
    initials: 'DN',
    seatNumber: 1,
    startingStack: 45200000,
    endingStack: 89400000,
    finishPosition: 1,
    status: 'winner',
    handsPlayed: 87,
    tournamentsPlayed: 3,
    color: '#ef4444',
  },
  {
    id: 'p2',
    name: 'Phil Hellmuth',
    country: 'US',
    countryFlag: '🇺🇸',
    initials: 'PH',
    seatNumber: 2,
    startingStack: 38100000,
    endingStack: 0,
    finishPosition: 3,
    status: 'eliminated',
    handsPlayed: 72,
    tournamentsPlayed: 5,
    color: '#3b82f6',
  },
  {
    id: 'p3',
    name: 'Phil Ivey',
    country: 'US',
    countryFlag: '🇺🇸',
    initials: 'PI',
    seatNumber: 3,
    startingStack: 52800000,
    endingStack: 0,
    finishPosition: 2,
    status: 'eliminated',
    handsPlayed: 85,
    tournamentsPlayed: 4,
    color: '#10b981',
  },
  {
    id: 'p4',
    name: 'Vanessa Selbst',
    country: 'US',
    countryFlag: '🇺🇸',
    initials: 'VS',
    seatNumber: 4,
    startingStack: 28500000,
    endingStack: 0,
    finishPosition: 5,
    status: 'eliminated',
    handsPlayed: 58,
    tournamentsPlayed: 2,
    color: '#f59e0b',
  },
  {
    id: 'p5',
    name: 'Justin Bonomo',
    country: 'US',
    countryFlag: '🇺🇸',
    initials: 'JB',
    seatNumber: 5,
    startingStack: 31200000,
    endingStack: 0,
    finishPosition: 4,
    status: 'eliminated',
    handsPlayed: 65,
    tournamentsPlayed: 3,
    color: '#8b5cf6',
  },
  {
    id: 'p6',
    name: 'Bryn Kenney',
    country: 'US',
    countryFlag: '🇺🇸',
    initials: 'BK',
    seatNumber: 6,
    startingStack: 22400000,
    endingStack: 0,
    finishPosition: 7,
    status: 'eliminated',
    handsPlayed: 41,
    tournamentsPlayed: 2,
    color: '#ec4899',
  },
  {
    id: 'p7',
    name: 'Fedor Holz',
    country: 'DE',
    countryFlag: '🇩🇪',
    initials: 'FH',
    seatNumber: 7,
    startingStack: 19800000,
    endingStack: 0,
    finishPosition: 6,
    status: 'eliminated',
    handsPlayed: 48,
    tournamentsPlayed: 2,
    color: '#06b6d4',
  },
  {
    id: 'p8',
    name: 'Maria Konnikova',
    country: 'US',
    countryFlag: '🇺🇸',
    initials: 'MK',
    seatNumber: 8,
    startingStack: 15600000,
    endingStack: 0,
    finishPosition: 8,
    status: 'eliminated',
    handsPlayed: 35,
    tournamentsPlayed: 1,
    color: '#f97316',
  },
  {
    id: 'p9',
    name: 'Erik Seidel',
    country: 'US',
    countryFlag: '🇺🇸',
    initials: 'ES',
    seatNumber: 9,
    startingStack: 17400000,
    endingStack: 0,
    finishPosition: 9,
    status: 'eliminated',
    handsPlayed: 22,
    tournamentsPlayed: 2,
    color: '#14b8a6',
  },
];

// =====================
// Player HUD Stats
// =====================
const PLAYER_STATS = {
  p1: {
    vpip: 28, pfr: 22, threeBet: 9, fourBet: 4, coldCall: 8, openLimp: 1,
    steal: 38, foldToSteal: 62, bbDefense: 48,
    cbetFlop: 68, cbetTurn: 52, cbetRiver: 38,
    foldToCbetFlop: 32, foldToCbetTurn: 45, foldToCbetRiver: 55,
    checkRaiseFlop: 8, checkRaiseTurn: 6, donkBetFlop: 5,
    af: 2.8, afFlop: 3.2, afTurn: 2.5, afRiver: 2.1,
    afq: 48, wtsd: 32, wsd: 54, wwsf: 52, wonWithoutShowdown: 62,
    totalHands: 87, minHands: 50,
  },
  p2: {
    vpip: 22, pfr: 18, threeBet: 7, fourBet: 3, coldCall: 6, openLimp: 0,
    steal: 42, foldToSteal: 55, bbDefense: 52,
    cbetFlop: 72, cbetTurn: 58, cbetRiver: 42,
    foldToCbetFlop: 28, foldToCbetTurn: 40, foldToCbetRiver: 50,
    checkRaiseFlop: 6, checkRaiseTurn: 4, donkBetFlop: 3,
    af: 3.4, afFlop: 4.1, afTurn: 3.0, afRiver: 2.5,
    afq: 55, wtsd: 28, wsd: 58, wwsf: 48, wonWithoutShowdown: 58,
    totalHands: 72, minHands: 50,
  },
  p3: {
    vpip: 24, pfr: 20, threeBet: 8, fourBet: 5, coldCall: 5, openLimp: 0,
    steal: 45, foldToSteal: 50, bbDefense: 55,
    cbetFlop: 65, cbetTurn: 48, cbetRiver: 35,
    foldToCbetFlop: 35, foldToCbetTurn: 42, foldToCbetRiver: 58,
    checkRaiseFlop: 10, checkRaiseTurn: 8, donkBetFlop: 4,
    af: 2.5, afFlop: 2.8, afTurn: 2.3, afRiver: 1.9,
    afq: 44, wtsd: 35, wsd: 52, wwsf: 55, wonWithoutShowdown: 55,
    totalHands: 85, minHands: 50,
  },
  p4: {
    vpip: 32, pfr: 24, threeBet: 11, fourBet: 6, coldCall: 10, openLimp: 2,
    steal: 35, foldToSteal: 58, bbDefense: 45,
    cbetFlop: 62, cbetTurn: 45, cbetRiver: 30,
    foldToCbetFlop: 38, foldToCbetTurn: 48, foldToCbetRiver: 60,
    checkRaiseFlop: 12, checkRaiseTurn: 9, donkBetFlop: 8,
    af: 2.2, afFlop: 2.6, afTurn: 2.0, afRiver: 1.7,
    afq: 42, wtsd: 38, wsd: 48, wwsf: 45, wonWithoutShowdown: 50,
    totalHands: 58, minHands: 50,
  },
  p5: {
    vpip: 20, pfr: 16, threeBet: 6, fourBet: 2, coldCall: 5, openLimp: 0,
    steal: 40, foldToSteal: 65, bbDefense: 42,
    cbetFlop: 75, cbetTurn: 60, cbetRiver: 45,
    foldToCbetFlop: 25, foldToCbetTurn: 38, foldToCbetRiver: 48,
    checkRaiseFlop: 5, checkRaiseTurn: 3, donkBetFlop: 2,
    af: 3.8, afFlop: 4.5, afTurn: 3.5, afRiver: 2.8,
    afq: 58, wtsd: 25, wsd: 60, wwsf: 50, wonWithoutShowdown: 65,
    totalHands: 65, minHands: 50,
  },
  p6: {
    vpip: 35, pfr: 28, threeBet: 13, fourBet: 7, coldCall: 9, openLimp: 3,
    steal: 48, foldToSteal: 45, bbDefense: 58,
    cbetFlop: 58, cbetTurn: 40, cbetRiver: 28,
    foldToCbetFlop: 42, foldToCbetTurn: 52, foldToCbetRiver: 65,
    checkRaiseFlop: 14, checkRaiseTurn: 10, donkBetFlop: 10,
    af: 1.8, afFlop: 2.1, afTurn: 1.6, afRiver: 1.4,
    afq: 38, wtsd: 40, wsd: 45, wwsf: 42, wonWithoutShowdown: 45,
    totalHands: 41, minHands: 50,
  },
  p7: {
    vpip: 26, pfr: 21, threeBet: 10, fourBet: 5, coldCall: 7, openLimp: 0,
    steal: 44, foldToSteal: 52, bbDefense: 50,
    cbetFlop: 70, cbetTurn: 55, cbetRiver: 40,
    foldToCbetFlop: 30, foldToCbetTurn: 42, foldToCbetRiver: 52,
    checkRaiseFlop: 7, checkRaiseTurn: 5, donkBetFlop: 3,
    af: 3.1, afFlop: 3.5, afTurn: 2.8, afRiver: 2.4,
    afq: 52, wtsd: 30, wsd: 56, wwsf: 50, wonWithoutShowdown: 60,
    totalHands: 48, minHands: 50,
  },
  p8: {
    vpip: 30, pfr: 20, threeBet: 8, fourBet: 3, coldCall: 12, openLimp: 4,
    steal: 30, foldToSteal: 68, bbDefense: 38,
    cbetFlop: 55, cbetTurn: 38, cbetRiver: 25,
    foldToCbetFlop: 45, foldToCbetTurn: 55, foldToCbetRiver: 68,
    checkRaiseFlop: 4, checkRaiseTurn: 2, donkBetFlop: 6,
    af: 1.5, afFlop: 1.8, afTurn: 1.3, afRiver: 1.0,
    afq: 32, wtsd: 42, wsd: 42, wwsf: 38, wonWithoutShowdown: 40,
    totalHands: 35, minHands: 50,
  },
  p9: {
    vpip: 18, pfr: 14, threeBet: 5, fourBet: 2, coldCall: 4, openLimp: 0,
    steal: 35, foldToSteal: 70, bbDefense: 35,
    cbetFlop: 78, cbetTurn: 62, cbetRiver: 48,
    foldToCbetFlop: 22, foldToCbetTurn: 35, foldToCbetRiver: 45,
    checkRaiseFlop: 3, checkRaiseTurn: 2, donkBetFlop: 1,
    af: 4.2, afFlop: 5.0, afTurn: 3.8, afRiver: 3.2,
    afq: 62, wtsd: 22, wsd: 62, wwsf: 48, wonWithoutShowdown: 70,
    totalHands: 22, minHands: 50,
  },
};

// =====================
// Hands (30 hands from WSOP Main Event)
// =====================
const HANDS = [
  {
    id: 'h1', tournamentId: 'wsop-me-2025', handNumber: 87,
    blinds: '200K/400K', ante: 400000, smallBlind: 200000, bigBlind: 400000,
    playersInvolved: ['p1', 'p3'],
    winnerId: 'p1', winnerName: 'Daniel Negreanu',
    potTotal: 89400000, netResult: 44200000,
    communityCards: ['As', 'Kd', '7h', '2c', 'Jh'],
    holeCards: { p1: ['Ad', 'Jd'], p3: ['Kh', 'Ks'] },
    highlightType: 'biggest_pot',
    highlightLabel: 'Final Hand — Tournament Winner',
    hasVideo: true, videoTimestamp: '3:42:15',
    preview: 'Negreanu rivers two pair to crack pocket kings and win the Main Event',
    actions: [
      { street: 'preflop', player: 'p3', action: 'raise', amount: 1000000 },
      { street: 'preflop', player: 'p1', action: 'call', amount: 1000000 },
      { street: 'flop', player: 'p3', action: 'bet', amount: 1200000 },
      { street: 'flop', player: 'p1', action: 'call', amount: 1200000 },
      { street: 'turn', player: 'p3', action: 'bet', amount: 3500000 },
      { street: 'turn', player: 'p1', action: 'call', amount: 3500000 },
      { street: 'river', player: 'p3', action: 'allin', amount: 38900000 },
      { street: 'river', player: 'p1', action: 'call', amount: 38900000 },
    ],
  },
  {
    id: 'h2', tournamentId: 'wsop-me-2025', handNumber: 82,
    blinds: '200K/400K', ante: 400000, smallBlind: 200000, bigBlind: 400000,
    playersInvolved: ['p2', 'p3'],
    winnerId: 'p3', winnerName: 'Phil Ivey',
    potTotal: 38100000, netResult: 19800000,
    communityCards: ['Qd', 'Ts', '3h', '8c', '4d'],
    holeCards: { p2: ['Ah', 'Kh'], p3: ['Qs', 'Qh'] },
    highlightType: 'elimination',
    highlightLabel: 'Hellmuth Eliminated (3rd Place)',
    hasVideo: true, videoTimestamp: '3:28:40',
    preview: 'Ivey flops a set of queens to eliminate Hellmuth in 3rd place',
    actions: [
      { street: 'preflop', player: 'p2', action: 'raise', amount: 1000000 },
      { street: 'preflop', player: 'p3', action: 'raise', amount: 3200000 },
      { street: 'preflop', player: 'p2', action: 'call', amount: 3200000 },
      { street: 'flop', player: 'p3', action: 'bet', amount: 4000000 },
      { street: 'flop', player: 'p2', action: 'allin', amount: 34500000 },
      { street: 'flop', player: 'p3', action: 'call', amount: 34500000 },
    ],
  },
  {
    id: 'h3', tournamentId: 'wsop-me-2025', handNumber: 75,
    blinds: '150K/300K', ante: 300000, smallBlind: 150000, bigBlind: 300000,
    playersInvolved: ['p1', 'p4'],
    winnerId: 'p1', winnerName: 'Daniel Negreanu',
    potTotal: 12800000, netResult: 6400000,
    communityCards: ['9h', '6d', '2s', 'Tc', 'Ah'],
    holeCards: { p1: ['Ac', 'Qc'], p4: ['9s', '9d'] },
    highlightType: 'hero_call',
    highlightLabel: 'Hero Call with Ace High',
    hasVideo: true, videoTimestamp: '3:05:22',
    preview: 'Negreanu makes a gutsy call on the river with just ace-high',
    actions: [
      { street: 'preflop', player: 'p1', action: 'raise', amount: 750000 },
      { street: 'preflop', player: 'p4', action: 'call', amount: 750000 },
      { street: 'flop', player: 'p1', action: 'bet', amount: 900000 },
      { street: 'flop', player: 'p4', action: 'call', amount: 900000 },
      { street: 'turn', player: 'p1', action: 'check', amount: 0 },
      { street: 'turn', player: 'p4', action: 'bet', amount: 2200000 },
      { street: 'turn', player: 'p1', action: 'call', amount: 2200000 },
      { street: 'river', player: 'p1', action: 'check', amount: 0 },
      { street: 'river', player: 'p4', action: 'bet', amount: 5500000 },
      { street: 'river', player: 'p1', action: 'call', amount: 5500000 },
    ],
  },
  {
    id: 'h4', tournamentId: 'wsop-me-2025', handNumber: 68,
    blinds: '150K/300K', ante: 300000, smallBlind: 150000, bigBlind: 300000,
    playersInvolved: ['p5', 'p6'],
    winnerId: 'p5', winnerName: 'Justin Bonomo',
    potTotal: 22400000, netResult: 11200000,
    communityCards: ['Kh', '8s', '3c', '5d', 'Ks'],
    holeCards: { p5: ['Kc', 'Jc'], p6: ['8h', '8d'] },
    highlightType: 'cooler',
    highlightLabel: 'Set over Set — Brutal Cooler',
    hasVideo: true, videoTimestamp: '2:48:10',
    preview: 'Trip kings vs flopped set of eights — a classic cooler that ends Kenney\'s run',
    actions: [
      { street: 'preflop', player: 'p5', action: 'raise', amount: 750000 },
      { street: 'preflop', player: 'p6', action: 'call', amount: 750000 },
      { street: 'flop', player: 'p5', action: 'bet', amount: 1000000 },
      { street: 'flop', player: 'p6', action: 'raise', amount: 3200000 },
      { street: 'flop', player: 'p5', action: 'call', amount: 3200000 },
      { street: 'turn', player: 'p5', action: 'check', amount: 0 },
      { street: 'turn', player: 'p6', action: 'allin', amount: 17400000 },
      { street: 'turn', player: 'p5', action: 'call', amount: 17400000 },
    ],
  },
  {
    id: 'h5', tournamentId: 'wsop-me-2025', handNumber: 60,
    blinds: '100K/200K', ante: 200000, smallBlind: 100000, bigBlind: 200000,
    playersInvolved: ['p3', 'p7'],
    winnerId: 'p3', winnerName: 'Phil Ivey',
    potTotal: 15200000, netResult: 7600000,
    communityCards: ['Jd', '7c', '4s', '2h', '9d'],
    holeCards: { p3: ['7d', '4d'], p7: ['As', 'Ah'] },
    highlightType: 'bluff',
    highlightLabel: 'Massive Bluff — Ivey\'s Stone Cold Read',
    hasVideo: true, videoTimestamp: '2:22:05',
    preview: 'Ivey turns bottom two pair into a bluff, getting Holz to fold pocket aces',
    actions: [
      { street: 'preflop', player: 'p7', action: 'raise', amount: 500000 },
      { street: 'preflop', player: 'p3', action: 'call', amount: 500000 },
      { street: 'flop', player: 'p3', action: 'check', amount: 0 },
      { street: 'flop', player: 'p7', action: 'bet', amount: 600000 },
      { street: 'flop', player: 'p3', action: 'call', amount: 600000 },
      { street: 'turn', player: 'p3', action: 'check', amount: 0 },
      { street: 'turn', player: 'p7', action: 'bet', amount: 1800000 },
      { street: 'turn', player: 'p3', action: 'raise', amount: 5200000 },
      { street: 'turn', player: 'p7', action: 'fold', amount: 0 },
    ],
  },
  {
    id: 'h6', tournamentId: 'wsop-me-2025', handNumber: 55,
    blinds: '100K/200K', ante: 200000, smallBlind: 100000, bigBlind: 200000,
    playersInvolved: ['p1', 'p2', 'p3'],
    winnerId: 'p2', winnerName: 'Phil Hellmuth',
    potTotal: 8400000, netResult: 5600000,
    communityCards: ['Th', '8h', '3d', '5h', 'Kc'],
    holeCards: { p1: ['Ac', 'Tc'], p2: ['Kh', 'Qh'], p3: ['Jd', 'Jc'] },
    highlightType: 'biggest_pot',
    highlightLabel: 'Three-Way All-In — Flush Wins',
    hasVideo: true, videoTimestamp: '2:05:30',
    preview: 'Hellmuth hits a flush on the turn in a massive three-way pot',
    actions: [
      { street: 'preflop', player: 'p1', action: 'raise', amount: 500000 },
      { street: 'preflop', player: 'p2', action: 'call', amount: 500000 },
      { street: 'preflop', player: 'p3', action: 'raise', amount: 1800000 },
      { street: 'preflop', player: 'p1', action: 'call', amount: 1800000 },
      { street: 'preflop', player: 'p2', action: 'call', amount: 1800000 },
      { street: 'flop', player: 'p1', action: 'bet', amount: 2000000 },
      { street: 'flop', player: 'p2', action: 'call', amount: 2000000 },
      { street: 'flop', player: 'p3', action: 'fold', amount: 0 },
      { street: 'turn', player: 'p1', action: 'check', amount: 0 },
      { street: 'turn', player: 'p2', action: 'bet', amount: 4200000 },
      { street: 'turn', player: 'p1', action: 'fold', amount: 0 },
    ],
  },
  {
    id: 'h7', tournamentId: 'wsop-me-2025', handNumber: 50,
    blinds: '100K/200K', ante: 200000, smallBlind: 100000, bigBlind: 200000,
    playersInvolved: ['p4', 'p1'],
    winnerId: 'p4', winnerName: 'Vanessa Selbst',
    potTotal: 9600000, netResult: 4800000,
    communityCards: ['Qc', '9h', '5s', '6c', 'Qd'],
    holeCards: { p4: ['Qh', 'Ts'], p1: ['9d', '9c'] },
    highlightType: 'bad_beat',
    highlightLabel: 'Queens Full vs Nines Full — Bad Beat',
    hasVideo: true, videoTimestamp: '1:52:18',
    preview: 'Selbst rivers queens full to crack Negreanu\'s nines full in a sick beat',
    actions: [
      { street: 'preflop', player: 'p4', action: 'raise', amount: 500000 },
      { street: 'preflop', player: 'p1', action: 'call', amount: 500000 },
      { street: 'flop', player: 'p4', action: 'bet', amount: 600000 },
      { street: 'flop', player: 'p1', action: 'raise', amount: 1800000 },
      { street: 'flop', player: 'p4', action: 'call', amount: 1800000 },
      { street: 'turn', player: 'p4', action: 'check', amount: 0 },
      { street: 'turn', player: 'p1', action: 'bet', amount: 2800000 },
      { street: 'turn', player: 'p4', action: 'call', amount: 2800000 },
      { street: 'river', player: 'p4', action: 'allin', amount: 4200000 },
      { street: 'river', player: 'p1', action: 'call', amount: 4200000 },
    ],
  },
  {
    id: 'h8', tournamentId: 'wsop-me-2025', handNumber: 47,
    blinds: '100K/200K', ante: 200000, smallBlind: 100000, bigBlind: 200000,
    playersInvolved: ['p6', 'p2'],
    winnerId: 'p6', winnerName: 'Bryn Kenney',
    potTotal: 11200000, netResult: 5600000,
    communityCards: ['Ad', '8c', '4h', 'Jc', '3s'],
    holeCards: { p6: ['7s', '6s'], p2: ['Ac', 'Jd'] },
    highlightType: 'bluff',
    highlightLabel: 'Kenney Bluffs Hellmuth Off Two Pair',
    hasVideo: true, videoTimestamp: '1:40:05',
    preview: 'Kenney fires three barrels with seven-high and gets Hellmuth to fold two pair',
    actions: [
      { street: 'preflop', player: 'p6', action: 'raise', amount: 500000 },
      { street: 'preflop', player: 'p2', action: 'call', amount: 500000 },
      { street: 'flop', player: 'p6', action: 'bet', amount: 700000 },
      { street: 'flop', player: 'p2', action: 'call', amount: 700000 },
      { street: 'turn', player: 'p6', action: 'bet', amount: 2200000 },
      { street: 'turn', player: 'p2', action: 'call', amount: 2200000 },
      { street: 'river', player: 'p6', action: 'bet', amount: 6800000 },
      { street: 'river', player: 'p2', action: 'fold', amount: 0 },
    ],
  },
  {
    id: 'h9', tournamentId: 'wsop-me-2025', handNumber: 42,
    blinds: '80K/160K', ante: 160000, smallBlind: 80000, bigBlind: 160000,
    playersInvolved: ['p8', 'p5'],
    winnerId: 'p5', winnerName: 'Justin Bonomo',
    potTotal: 15600000, netResult: 7800000,
    communityCards: ['Kd', 'Qh', '9c', '6s', '2d'],
    holeCards: { p8: ['Ks', 'Ts'], p5: ['Kc', 'Qc'] },
    highlightType: 'elimination',
    highlightLabel: 'Konnikova Out in 8th',
    hasVideo: true, videoTimestamp: '1:28:12',
    preview: 'Bonomo\'s two pair eliminates Konnikova who was dominated preflop',
    actions: [
      { street: 'preflop', player: 'p8', action: 'allin', amount: 15400000 },
      { street: 'preflop', player: 'p5', action: 'call', amount: 15400000 },
    ],
  },
  {
    id: 'h10', tournamentId: 'wsop-me-2025', handNumber: 38,
    blinds: '80K/160K', ante: 160000, smallBlind: 80000, bigBlind: 160000,
    playersInvolved: ['p7', 'p3'],
    winnerId: 'p3', winnerName: 'Phil Ivey',
    potTotal: 7800000, netResult: 3900000,
    communityCards: ['Td', '5c', '3h', 'Kd', '8d'],
    holeCards: { p7: ['Jd', '9d'], p3: ['Kh', 'Tc'] },
    highlightType: 'hero_call',
    highlightLabel: 'Ivey Calls Down with Two Pair',
    hasVideo: true, videoTimestamp: '1:15:40',
    preview: 'Ivey calls a river shove with top two pair despite the flush completing',
    actions: [
      { street: 'preflop', player: 'p7', action: 'raise', amount: 400000 },
      { street: 'preflop', player: 'p3', action: 'call', amount: 400000 },
      { street: 'flop', player: 'p3', action: 'check', amount: 0 },
      { street: 'flop', player: 'p7', action: 'bet', amount: 500000 },
      { street: 'flop', player: 'p3', action: 'call', amount: 500000 },
      { street: 'turn', player: 'p3', action: 'bet', amount: 1200000 },
      { street: 'turn', player: 'p7', action: 'call', amount: 1200000 },
      { street: 'river', player: 'p3', action: 'check', amount: 0 },
      { street: 'river', player: 'p7', action: 'allin', amount: 5200000 },
      { street: 'river', player: 'p3', action: 'call', amount: 5200000 },
    ],
  },
  // Hands 11-30: More variety
  {
    id: 'h11', tournamentId: 'wsop-me-2025', handNumber: 35,
    blinds: '60K/120K', ante: 120000, smallBlind: 60000, bigBlind: 120000,
    playersInvolved: ['p9', 'p1'],
    winnerId: 'p1', winnerName: 'Daniel Negreanu',
    potTotal: 17400000, netResult: 8700000,
    communityCards: ['8h', '5d', '2c', 'Ah', 'Th'],
    holeCards: { p9: ['Kh', 'Qd'], p1: ['Ac', 'As'] },
    highlightType: 'elimination',
    highlightLabel: 'Seidel Eliminated 9th — First Out',
    hasVideo: true, videoTimestamp: '1:02:30',
    preview: 'Seidel runs into aces and becomes the first elimination of the final table',
    actions: [
      { street: 'preflop', player: 'p9', action: 'raise', amount: 300000 },
      { street: 'preflop', player: 'p1', action: 'raise', amount: 900000 },
      { street: 'preflop', player: 'p9', action: 'allin', amount: 17200000 },
      { street: 'preflop', player: 'p1', action: 'call', amount: 17200000 },
    ],
  },
  {
    id: 'h12', tournamentId: 'wsop-me-2025', handNumber: 32,
    blinds: '60K/120K', ante: 120000, smallBlind: 60000, bigBlind: 120000,
    playersInvolved: ['p2', 'p5'],
    winnerId: 'p2', winnerName: 'Phil Hellmuth',
    potTotal: 4200000, netResult: 2100000,
    communityCards: ['Jh', '4c', '2d', '7s', 'Qs'],
    holeCards: { p2: ['Jd', 'Js'], p5: ['As', 'Kd'] },
    highlightType: null, highlightLabel: null,
    hasVideo: true, videoTimestamp: '0:55:10',
    preview: 'Hellmuth slow-plays a set of jacks to extract maximum value',
    actions: [
      { street: 'preflop', player: 'p5', action: 'raise', amount: 300000 },
      { street: 'preflop', player: 'p2', action: 'call', amount: 300000 },
      { street: 'flop', player: 'p2', action: 'check', amount: 0 },
      { street: 'flop', player: 'p5', action: 'bet', amount: 400000 },
      { street: 'flop', player: 'p2', action: 'call', amount: 400000 },
      { street: 'turn', player: 'p2', action: 'check', amount: 0 },
      { street: 'turn', player: 'p5', action: 'bet', amount: 1000000 },
      { street: 'turn', player: 'p2', action: 'call', amount: 1000000 },
      { street: 'river', player: 'p2', action: 'bet', amount: 2500000 },
      { street: 'river', player: 'p5', action: 'fold', amount: 0 },
    ],
  },
  {
    id: 'h13', tournamentId: 'wsop-me-2025', handNumber: 28,
    blinds: '60K/120K', ante: 120000, smallBlind: 60000, bigBlind: 120000,
    playersInvolved: ['p3', 'p6'],
    winnerId: 'p6', winnerName: 'Bryn Kenney',
    potTotal: 6200000, netResult: 3100000,
    communityCards: ['9c', '7h', '2s', 'Jd', '5c'],
    holeCards: { p3: ['Ad', 'Kc'], p6: ['9h', '7d'] },
    highlightType: 'bluff',
    highlightLabel: 'Kenney Overbets with Two Pair',
    hasVideo: true, videoTimestamp: '0:42:20',
    preview: 'Kenney disguises two pair as a bluff with an overbet, Ivey folds the best hand preflop',
    actions: [
      { street: 'preflop', player: 'p3', action: 'raise', amount: 300000 },
      { street: 'preflop', player: 'p6', action: 'call', amount: 300000 },
      { street: 'flop', player: 'p6', action: 'check', amount: 0 },
      { street: 'flop', player: 'p3', action: 'bet', amount: 350000 },
      { street: 'flop', player: 'p6', action: 'call', amount: 350000 },
      { street: 'turn', player: 'p6', action: 'check', amount: 0 },
      { street: 'turn', player: 'p3', action: 'bet', amount: 900000 },
      { street: 'turn', player: 'p6', action: 'call', amount: 900000 },
      { street: 'river', player: 'p6', action: 'bet', amount: 4500000 },
      { street: 'river', player: 'p3', action: 'fold', amount: 0 },
    ],
  },
  {
    id: 'h14', tournamentId: 'wsop-me-2025', handNumber: 25,
    blinds: '50K/100K', ante: 100000, smallBlind: 50000, bigBlind: 100000,
    playersInvolved: ['p1', 'p7'],
    winnerId: 'p1', winnerName: 'Daniel Negreanu',
    potTotal: 5400000, netResult: 2700000,
    communityCards: ['6h', '3c', '2d', 'Ts', 'Jh'],
    holeCards: { p1: ['Jc', 'Td'], p7: ['As', 'Qs'] },
    highlightType: null, highlightLabel: null,
    hasVideo: true, videoTimestamp: '0:35:15',
    preview: 'Negreanu catches two pair on the river and value bets thinly',
    actions: [
      { street: 'preflop', player: 'p7', action: 'raise', amount: 250000 },
      { street: 'preflop', player: 'p1', action: 'call', amount: 250000 },
      { street: 'flop', player: 'p1', action: 'check', amount: 0 },
      { street: 'flop', player: 'p7', action: 'bet', amount: 300000 },
      { street: 'flop', player: 'p1', action: 'call', amount: 300000 },
      { street: 'turn', player: 'p1', action: 'check', amount: 0 },
      { street: 'turn', player: 'p7', action: 'check', amount: 0 },
      { street: 'river', player: 'p1', action: 'bet', amount: 1800000 },
      { street: 'river', player: 'p7', action: 'call', amount: 1800000 },
    ],
  },
  {
    id: 'h15', tournamentId: 'wsop-me-2025', handNumber: 22,
    blinds: '50K/100K', ante: 100000, smallBlind: 50000, bigBlind: 100000,
    playersInvolved: ['p4', 'p5', 'p8'],
    winnerId: 'p4', winnerName: 'Vanessa Selbst',
    potTotal: 3800000, netResult: 2500000,
    communityCards: ['Ah', 'Kd', '9s', '4c', '7h'],
    holeCards: { p4: ['As', 'Kc'], p5: ['Kh', 'Jh'], p8: ['Ad', 'Td'] },
    highlightType: 'biggest_pot',
    highlightLabel: 'Selbst Flops Top Two in 3-Way',
    hasVideo: true, videoTimestamp: '0:28:40',
    preview: 'Selbst flops top two pair in a three-way pot and extracts from both opponents',
    actions: [
      { street: 'preflop', player: 'p4', action: 'raise', amount: 250000 },
      { street: 'preflop', player: 'p5', action: 'call', amount: 250000 },
      { street: 'preflop', player: 'p8', action: 'call', amount: 250000 },
      { street: 'flop', player: 'p4', action: 'bet', amount: 400000 },
      { street: 'flop', player: 'p5', action: 'call', amount: 400000 },
      { street: 'flop', player: 'p8', action: 'fold', amount: 0 },
      { street: 'turn', player: 'p4', action: 'bet', amount: 1200000 },
      { street: 'turn', player: 'p5', action: 'fold', amount: 0 },
    ],
  },
  // Fill remaining hands with simpler ones
  { id: 'h16', tournamentId: 'wsop-me-2025', handNumber: 20, blinds: '50K/100K', ante: 100000, smallBlind: 50000, bigBlind: 100000, playersInvolved: ['p2', 'p4'], winnerId: 'p2', winnerName: 'Phil Hellmuth', potTotal: 2200000, netResult: 1100000, communityCards: ['7d', '3s', '2h', 'Qc', 'Js'], holeCards: { p2: ['Ah', 'Qd'], p4: ['Kc', '9c'] }, highlightType: null, highlightLabel: null, hasVideo: true, videoTimestamp: '0:22:15', preview: 'Hellmuth value bets top pair to take down a medium pot', actions: [{ street: 'preflop', player: 'p2', action: 'raise', amount: 250000 }, { street: 'preflop', player: 'p4', action: 'call', amount: 250000 }, { street: 'flop', player: 'p2', action: 'bet', amount: 300000 }, { street: 'flop', player: 'p4', action: 'call', amount: 300000 }, { street: 'turn', player: 'p2', action: 'bet', amount: 800000 }, { street: 'turn', player: 'p4', action: 'fold', amount: 0 }] },
  { id: 'h17', tournamentId: 'wsop-me-2025', handNumber: 18, blinds: '50K/100K', ante: 100000, smallBlind: 50000, bigBlind: 100000, playersInvolved: ['p3', 'p5'], winnerId: 'p5', winnerName: 'Justin Bonomo', potTotal: 1800000, netResult: 900000, communityCards: ['8d', '4h', '2c', '6s', 'Td'], holeCards: { p3: ['Kd', 'Qd'], p5: ['Th', 'Ts'] }, highlightType: null, highlightLabel: null, hasVideo: true, videoTimestamp: '0:18:30', preview: 'Bonomo flops a set in position and lets Ivey bluff into him', actions: [{ street: 'preflop', player: 'p3', action: 'raise', amount: 250000 }, { street: 'preflop', player: 'p5', action: 'call', amount: 250000 }, { street: 'flop', player: 'p3', action: 'bet', amount: 300000 }, { street: 'flop', player: 'p5', action: 'call', amount: 300000 }, { street: 'turn', player: 'p3', action: 'check', amount: 0 }, { street: 'turn', player: 'p5', action: 'bet', amount: 600000 }, { street: 'turn', player: 'p3', action: 'fold', amount: 0 }] },
  { id: 'h18', tournamentId: 'wsop-me-2025', handNumber: 16, blinds: '40K/80K', ante: 80000, smallBlind: 40000, bigBlind: 80000, playersInvolved: ['p1', 'p6'], winnerId: 'p6', winnerName: 'Bryn Kenney', potTotal: 3400000, netResult: 1700000, communityCards: ['Ac', '9d', '5h', '3c', '8c'], holeCards: { p1: ['Ks', 'Kd'], p6: ['Ah', '9s'] }, highlightType: 'bad_beat', highlightLabel: 'Aces Full Board — Kings Cracked', hasVideo: true, videoTimestamp: '0:14:20', preview: 'Kenney flops two pair with A9 to crack Negreanu\'s pocket kings', actions: [{ street: 'preflop', player: 'p1', action: 'raise', amount: 200000 }, { street: 'preflop', player: 'p6', action: 'call', amount: 200000 }, { street: 'flop', player: 'p6', action: 'check', amount: 0 }, { street: 'flop', player: 'p1', action: 'bet', amount: 250000 }, { street: 'flop', player: 'p6', action: 'raise', amount: 800000 }, { street: 'flop', player: 'p1', action: 'call', amount: 800000 }, { street: 'turn', player: 'p6', action: 'bet', amount: 1500000 }, { street: 'turn', player: 'p1', action: 'fold', amount: 0 }] },
  { id: 'h19', tournamentId: 'wsop-me-2025', handNumber: 14, blinds: '40K/80K', ante: 80000, smallBlind: 40000, bigBlind: 80000, playersInvolved: ['p7', 'p8'], winnerId: 'p7', winnerName: 'Fedor Holz', potTotal: 2800000, netResult: 1400000, communityCards: ['Qh', 'Jd', '5c', '9h', '2s'], holeCards: { p7: ['Qs', 'Js'], p8: ['Qd', '8d'] }, highlightType: null, highlightLabel: null, hasVideo: true, videoTimestamp: '0:10:45', preview: 'Holz flops top two and gets value from Konnikova\'s dominated queen', actions: [{ street: 'preflop', player: 'p7', action: 'raise', amount: 200000 }, { street: 'preflop', player: 'p8', action: 'call', amount: 200000 }, { street: 'flop', player: 'p7', action: 'bet', amount: 300000 }, { street: 'flop', player: 'p8', action: 'call', amount: 300000 }, { street: 'turn', player: 'p7', action: 'bet', amount: 800000 }, { street: 'turn', player: 'p8', action: 'call', amount: 800000 }, { street: 'river', player: 'p7', action: 'bet', amount: 1200000 }, { street: 'river', player: 'p8', action: 'fold', amount: 0 }] },
  { id: 'h20', tournamentId: 'wsop-me-2025', handNumber: 12, blinds: '40K/80K', ante: 80000, smallBlind: 40000, bigBlind: 80000, playersInvolved: ['p9', 'p3'], winnerId: 'p9', winnerName: 'Erik Seidel', potTotal: 1600000, netResult: 800000, communityCards: ['Kc', '8h', '4d', 'Jc', '6h'], holeCards: { p9: ['Kd', 'Jd'], p3: ['As', '9s'] }, highlightType: null, highlightLabel: null, hasVideo: true, videoTimestamp: '0:08:30', preview: 'Seidel catches two pair to win a rare pot before his elimination', actions: [{ street: 'preflop', player: 'p3', action: 'raise', amount: 200000 }, { street: 'preflop', player: 'p9', action: 'call', amount: 200000 }, { street: 'flop', player: 'p9', action: 'check', amount: 0 }, { street: 'flop', player: 'p3', action: 'bet', amount: 250000 }, { street: 'flop', player: 'p9', action: 'call', amount: 250000 }, { street: 'turn', player: 'p9', action: 'bet', amount: 600000 }, { street: 'turn', player: 'p3', action: 'fold', amount: 0 }] },
  { id: 'h21', tournamentId: 'wsop-me-2025', handNumber: 10, blinds: '30K/60K', ante: 60000, smallBlind: 30000, bigBlind: 60000, playersInvolved: ['p1', 'p3'], winnerId: 'p1', winnerName: 'Daniel Negreanu', potTotal: 2400000, netResult: 1200000, communityCards: ['Th', '7d', '3s', 'As', 'Kd'], holeCards: { p1: ['Ah', 'Kh'], p3: ['Td', '9d'] }, highlightType: null, highlightLabel: null, hasVideo: true, videoTimestamp: '0:06:40', preview: 'Negreanu catches runner-runner to overtake Ivey\'s flopped pair', actions: [{ street: 'preflop', player: 'p1', action: 'raise', amount: 150000 }, { street: 'preflop', player: 'p3', action: 'call', amount: 150000 }, { street: 'flop', player: 'p1', action: 'bet', amount: 200000 }, { street: 'flop', player: 'p3', action: 'call', amount: 200000 }, { street: 'turn', player: 'p1', action: 'bet', amount: 500000 }, { street: 'turn', player: 'p3', action: 'call', amount: 500000 }, { street: 'river', player: 'p1', action: 'bet', amount: 1200000 }, { street: 'river', player: 'p3', action: 'call', amount: 1200000 }] },
  { id: 'h22', tournamentId: 'wsop-me-2025', handNumber: 8, blinds: '30K/60K', ante: 60000, smallBlind: 30000, bigBlind: 60000, playersInvolved: ['p2', 'p7'], winnerId: 'p7', winnerName: 'Fedor Holz', potTotal: 3200000, netResult: 1600000, communityCards: ['5h', '4c', '2d', '8s', 'Jd'], holeCards: { p2: ['Ah', 'Ac'], p7: ['5d', '5c'] }, highlightType: 'cooler', highlightLabel: 'Set of Fives vs Aces', hasVideo: true, videoTimestamp: '0:04:50', preview: 'Holz flops a set against Hellmuth\'s aces in a classic cooler', actions: [{ street: 'preflop', player: 'p2', action: 'raise', amount: 150000 }, { street: 'preflop', player: 'p7', action: 'call', amount: 150000 }, { street: 'flop', player: 'p2', action: 'bet', amount: 200000 }, { street: 'flop', player: 'p7', action: 'raise', amount: 650000 }, { street: 'flop', player: 'p2', action: 'call', amount: 650000 }, { street: 'turn', player: 'p2', action: 'check', amount: 0 }, { street: 'turn', player: 'p7', action: 'bet', amount: 1200000 }, { street: 'turn', player: 'p2', action: 'call', amount: 1200000 }, { street: 'river', player: 'p2', action: 'check', amount: 0 }, { street: 'river', player: 'p7', action: 'check', amount: 0 }] },
  { id: 'h23', tournamentId: 'wsop-me-2025', handNumber: 6, blinds: '30K/60K', ante: 60000, smallBlind: 30000, bigBlind: 60000, playersInvolved: ['p4', 'p9'], winnerId: 'p4', winnerName: 'Vanessa Selbst', potTotal: 1800000, netResult: 900000, communityCards: ['Qd', '8c', '3h', '6d', 'Kh'], holeCards: { p4: ['Qs', '8s'], p9: ['Jh', 'Tc'] }, highlightType: null, highlightLabel: null, hasVideo: true, videoTimestamp: '0:03:20', preview: 'Selbst flops two pair and bets three streets for value', actions: [{ street: 'preflop', player: 'p4', action: 'raise', amount: 150000 }, { street: 'preflop', player: 'p9', action: 'call', amount: 150000 }, { street: 'flop', player: 'p4', action: 'bet', amount: 200000 }, { street: 'flop', player: 'p9', action: 'call', amount: 200000 }, { street: 'turn', player: 'p4', action: 'bet', amount: 500000 }, { street: 'turn', player: 'p9', action: 'call', amount: 500000 }, { street: 'river', player: 'p4', action: 'bet', amount: 800000 }, { street: 'river', player: 'p9', action: 'fold', amount: 0 }] },
  { id: 'h24', tournamentId: 'wsop-me-2025', handNumber: 5, blinds: '30K/60K', ante: 60000, smallBlind: 30000, bigBlind: 60000, playersInvolved: ['p1', 'p5'], winnerId: 'p5', winnerName: 'Justin Bonomo', potTotal: 1400000, netResult: 700000, communityCards: ['9d', '6c', '2h', 'Ts', '4c'], holeCards: { p1: ['As', 'Jd'], p5: ['9c', '9h'] }, highlightType: null, highlightLabel: null, hasVideo: true, videoTimestamp: '0:02:40', preview: 'Bonomo\'s pocket nines hold up against Negreanu\'s overcards', actions: [{ street: 'preflop', player: 'p1', action: 'raise', amount: 150000 }, { street: 'preflop', player: 'p5', action: 'call', amount: 150000 }, { street: 'flop', player: 'p5', action: 'bet', amount: 200000 }, { street: 'flop', player: 'p1', action: 'call', amount: 200000 }, { street: 'turn', player: 'p5', action: 'bet', amount: 500000 }, { street: 'turn', player: 'p1', action: 'fold', amount: 0 }] },
  { id: 'h25', tournamentId: 'wsop-me-2025', handNumber: 4, blinds: '30K/60K', ante: 60000, smallBlind: 30000, bigBlind: 60000, playersInvolved: ['p6', 'p3'], winnerId: 'p3', winnerName: 'Phil Ivey', potTotal: 2000000, netResult: 1000000, communityCards: ['Jc', '7s', '4h', 'Qs', '2d'], holeCards: { p6: ['Kc', 'Jh'], p3: ['Qh', 'Qc'] }, highlightType: null, highlightLabel: null, hasVideo: true, videoTimestamp: '0:02:00', preview: 'Ivey slow-plays queens and traps Kenney on the turn', actions: [{ street: 'preflop', player: 'p6', action: 'raise', amount: 150000 }, { street: 'preflop', player: 'p3', action: 'call', amount: 150000 }, { street: 'flop', player: 'p3', action: 'check', amount: 0 }, { street: 'flop', player: 'p6', action: 'bet', amount: 200000 }, { street: 'flop', player: 'p3', action: 'call', amount: 200000 }, { street: 'turn', player: 'p3', action: 'check', amount: 0 }, { street: 'turn', player: 'p6', action: 'bet', amount: 600000 }, { street: 'turn', player: 'p3', action: 'raise', amount: 1600000 }, { street: 'turn', player: 'p6', action: 'fold', amount: 0 }] },
  { id: 'h26', tournamentId: 'wsop-me-2025', handNumber: 3, blinds: '30K/60K', ante: 60000, smallBlind: 30000, bigBlind: 60000, playersInvolved: ['p2', 'p8'], winnerId: 'p2', winnerName: 'Phil Hellmuth', potTotal: 1200000, netResult: 600000, communityCards: ['Kd', '9c', '3h', '7d', 'As'], holeCards: { p2: ['Ad', 'Kc'], p8: ['Ks', 'Jc'] }, highlightType: null, highlightLabel: null, hasVideo: true, videoTimestamp: '0:01:20', preview: 'Hellmuth dominates with AK against Konnikova\'s KJ', actions: [{ street: 'preflop', player: 'p8', action: 'raise', amount: 150000 }, { street: 'preflop', player: 'p2', action: 'raise', amount: 450000 }, { street: 'preflop', player: 'p8', action: 'call', amount: 450000 }, { street: 'flop', player: 'p2', action: 'bet', amount: 350000 }, { street: 'flop', player: 'p8', action: 'call', amount: 350000 }, { street: 'turn', player: 'p2', action: 'check', amount: 0 }, { street: 'turn', player: 'p8', action: 'check', amount: 0 }, { street: 'river', player: 'p2', action: 'bet', amount: 600000 }, { street: 'river', player: 'p8', action: 'fold', amount: 0 }] },
  { id: 'h27', tournamentId: 'wsop-me-2025', handNumber: 2, blinds: '30K/60K', ante: 60000, smallBlind: 30000, bigBlind: 60000, playersInvolved: ['p5', 'p9'], winnerId: 'p9', winnerName: 'Erik Seidel', potTotal: 900000, netResult: 450000, communityCards: ['Th', '6h', '2c', '8d', 'Qh'], holeCards: { p5: ['Jh', 'Jc'], p9: ['Ah', '3h'] }, highlightType: null, highlightLabel: null, hasVideo: true, videoTimestamp: '0:00:50', preview: 'Seidel rivers a flush to start the final table with a win', actions: [{ street: 'preflop', player: 'p5', action: 'raise', amount: 150000 }, { street: 'preflop', player: 'p9', action: 'call', amount: 150000 }, { street: 'flop', player: 'p5', action: 'bet', amount: 200000 }, { street: 'flop', player: 'p9', action: 'call', amount: 200000 }, { street: 'turn', player: 'p5', action: 'check', amount: 0 }, { street: 'turn', player: 'p9', action: 'check', amount: 0 }, { street: 'river', player: 'p5', action: 'bet', amount: 400000 }, { street: 'river', player: 'p9', action: 'raise', amount: 1200000 }, { street: 'river', player: 'p5', action: 'fold', amount: 0 }] },
  { id: 'h28', tournamentId: 'wsop-me-2025', handNumber: 1, blinds: '30K/60K', ante: 60000, smallBlind: 30000, bigBlind: 60000, playersInvolved: ['p1', 'p2', 'p3'], winnerId: 'p1', winnerName: 'Daniel Negreanu', potTotal: 1500000, netResult: 1000000, communityCards: ['Kh', 'Js', '4d', '8c', '2s'], holeCards: { p1: ['Kc', 'Qd'], p2: ['Jd', 'Ts'], p3: ['Ah', '5h'] }, highlightType: null, highlightLabel: null, hasVideo: true, videoTimestamp: '0:00:10', preview: 'First hand of the final table — Negreanu takes it down with top pair', actions: [{ street: 'preflop', player: 'p3', action: 'raise', amount: 150000 }, { street: 'preflop', player: 'p1', action: 'call', amount: 150000 }, { street: 'preflop', player: 'p2', action: 'call', amount: 150000 }, { street: 'flop', player: 'p1', action: 'bet', amount: 250000 }, { street: 'flop', player: 'p2', action: 'call', amount: 250000 }, { street: 'flop', player: 'p3', action: 'fold', amount: 0 }, { street: 'turn', player: 'p1', action: 'bet', amount: 600000 }, { street: 'turn', player: 'p2', action: 'fold', amount: 0 }] },
  { id: 'h29', tournamentId: 'wsop-me-2025', handNumber: 63, blinds: '100K/200K', ante: 200000, smallBlind: 100000, bigBlind: 200000, playersInvolved: ['p7', 'p4'], winnerId: 'p7', winnerName: 'Fedor Holz', potTotal: 19800000, netResult: 9900000, communityCards: ['8d', '5s', '3c', 'Kh', '7d'], holeCards: { p7: ['8s', '8c'], p4: ['Ad', 'Qd'] }, highlightType: 'elimination', highlightLabel: 'Holz Eliminates Selbst in 5th', hasVideo: true, videoTimestamp: '2:32:00', preview: 'Holz\'s pocket eights hold against Selbst\'s AQ to send her out in 5th', actions: [{ street: 'preflop', player: 'p4', action: 'raise', amount: 500000 }, { street: 'preflop', player: 'p7', action: 'raise', amount: 1600000 }, { street: 'preflop', player: 'p4', action: 'allin', amount: 19600000 }, { street: 'preflop', player: 'p7', action: 'call', amount: 19600000 }] },
  { id: 'h30', tournamentId: 'wsop-me-2025', handNumber: 70, blinds: '150K/300K', ante: 300000, smallBlind: 150000, bigBlind: 300000, playersInvolved: ['p3', 'p5'], winnerId: 'p3', winnerName: 'Phil Ivey', potTotal: 31200000, netResult: 15600000, communityCards: ['Tc', '9h', '6d', '2c', 'Qs'], holeCards: { p3: ['Ts', 'Tc'], p5: ['Ah', 'Ks'] }, highlightType: 'elimination', highlightLabel: 'Bonomo Out 4th — Ivey Trips', hasVideo: true, videoTimestamp: '2:55:30', preview: 'Ivey flops trip tens to eliminate Bonomo who couldn\'t improve with AK', actions: [{ street: 'preflop', player: 'p5', action: 'raise', amount: 750000 }, { street: 'preflop', player: 'p3', action: 'raise', amount: 2200000 }, { street: 'preflop', player: 'p5', action: 'allin', amount: 31000000 }, { street: 'preflop', player: 'p3', action: 'call', amount: 31000000 }] },
];

// =====================
// Highlights (grouped by type)
// =====================
const HIGHLIGHTS = {
  biggest_pot: HANDS.filter(h => h.highlightType === 'biggest_pot'),
  bluff: HANDS.filter(h => h.highlightType === 'bluff'),
  hero_call: HANDS.filter(h => h.highlightType === 'hero_call'),
  cooler: HANDS.filter(h => h.highlightType === 'cooler'),
  bad_beat: HANDS.filter(h => h.highlightType === 'bad_beat'),
  elimination: HANDS.filter(h => h.highlightType === 'elimination'),
};

const HIGHLIGHT_LABELS = {
  biggest_pot: { label: 'Biggest Pots', icon: '💰', color: '#f59e0b' },
  bluff: { label: 'Best Bluffs', icon: '🎭', color: '#8b5cf6' },
  hero_call: { label: 'Hero Calls', icon: '🦸', color: '#10b981' },
  cooler: { label: 'Coolers', icon: '❄️', color: '#3b82f6' },
  bad_beat: { label: 'Bad Beats', icon: '😩', color: '#ef4444' },
  elimination: { label: 'Eliminations', icon: '💀', color: '#6b7280' },
};

// =====================
// Hand Replay Steps (5 hands with full step-by-step)
// =====================
const HAND_REPLAYS = {
  h1: {
    handId: 'h1',
    phases: [
      {
        name: 'preflop',
        communityCards: [],
        pot: 1000000,
        steps: [
          { player: 'p3', action: 'raise', amount: 1000000, pot: 1000000, stacks: { p1: 44200000, p3: 51800000 } },
          { player: 'p1', action: 'call', amount: 1000000, pot: 2000000, stacks: { p1: 43200000, p3: 51800000 } },
        ],
      },
      {
        name: 'flop',
        communityCards: ['As', 'Kd', '7h'],
        pot: 2000000,
        steps: [
          { player: 'p3', action: 'bet', amount: 1200000, pot: 3200000, stacks: { p1: 43200000, p3: 50600000 } },
          { player: 'p1', action: 'call', amount: 1200000, pot: 4400000, stacks: { p1: 42000000, p3: 50600000 } },
        ],
      },
      {
        name: 'turn',
        communityCards: ['As', 'Kd', '7h', '2c'],
        pot: 4400000,
        steps: [
          { player: 'p3', action: 'bet', amount: 3500000, pot: 7900000, stacks: { p1: 42000000, p3: 47100000 } },
          { player: 'p1', action: 'call', amount: 3500000, pot: 11400000, stacks: { p1: 38500000, p3: 47100000 } },
        ],
      },
      {
        name: 'river',
        communityCards: ['As', 'Kd', '7h', '2c', 'Jh'],
        pot: 11400000,
        steps: [
          { player: 'p3', action: 'allin', amount: 38900000, pot: 50300000, stacks: { p1: 38500000, p3: 8200000 } },
          { player: 'p1', action: 'call', amount: 38900000, pot: 89200000, stacks: { p1: 0, p3: 8200000 } },
        ],
      },
      {
        name: 'showdown',
        communityCards: ['As', 'Kd', '7h', '2c', 'Jh'],
        pot: 89200000,
        steps: [
          { player: 'p1', action: 'show', cards: ['Ad', 'Jd'], handRank: 'Two Pair, Aces and Jacks' },
          { player: 'p3', action: 'show', cards: ['Kh', 'Ks'], handRank: 'Pair of Kings' },
          { winner: 'p1', amount: 89200000 },
        ],
      },
    ],
  },
  h5: {
    handId: 'h5',
    phases: [
      {
        name: 'preflop', communityCards: [], pot: 1000000,
        steps: [
          { player: 'p7', action: 'raise', amount: 500000, pot: 500000, stacks: { p3: 52800000, p7: 19300000 } },
          { player: 'p3', action: 'call', amount: 500000, pot: 1000000, stacks: { p3: 52300000, p7: 19300000 } },
        ],
      },
      {
        name: 'flop', communityCards: ['Jd', '7c', '4s'], pot: 1000000,
        steps: [
          { player: 'p3', action: 'check', amount: 0, pot: 1000000 },
          { player: 'p7', action: 'bet', amount: 600000, pot: 1600000, stacks: { p3: 52300000, p7: 18700000 } },
          { player: 'p3', action: 'call', amount: 600000, pot: 2200000, stacks: { p3: 51700000, p7: 18700000 } },
        ],
      },
      {
        name: 'turn', communityCards: ['Jd', '7c', '4s', '2h'], pot: 2200000,
        steps: [
          { player: 'p3', action: 'check', amount: 0, pot: 2200000 },
          { player: 'p7', action: 'bet', amount: 1800000, pot: 4000000, stacks: { p3: 51700000, p7: 16900000 } },
          { player: 'p3', action: 'raise', amount: 5200000, pot: 9200000, stacks: { p3: 46500000, p7: 16900000 } },
          { player: 'p7', action: 'fold', amount: 0, pot: 9200000 },
        ],
      },
    ],
  },
  h8: {
    handId: 'h8',
    phases: [
      {
        name: 'preflop', communityCards: [], pot: 1000000,
        steps: [
          { player: 'p6', action: 'raise', amount: 500000, pot: 500000, stacks: { p6: 21900000, p2: 37600000 } },
          { player: 'p2', action: 'call', amount: 500000, pot: 1000000, stacks: { p6: 21900000, p2: 37100000 } },
        ],
      },
      {
        name: 'flop', communityCards: ['Ad', '8c', '4h'], pot: 1000000,
        steps: [
          { player: 'p6', action: 'bet', amount: 700000, pot: 1700000 },
          { player: 'p2', action: 'call', amount: 700000, pot: 2400000 },
        ],
      },
      {
        name: 'turn', communityCards: ['Ad', '8c', '4h', 'Jc'], pot: 2400000,
        steps: [
          { player: 'p6', action: 'bet', amount: 2200000, pot: 4600000 },
          { player: 'p2', action: 'call', amount: 2200000, pot: 6800000 },
        ],
      },
      {
        name: 'river', communityCards: ['Ad', '8c', '4h', 'Jc', '3s'], pot: 6800000,
        steps: [
          { player: 'p6', action: 'bet', amount: 6800000, pot: 13600000 },
          { player: 'p2', action: 'fold', amount: 0, pot: 13600000 },
        ],
      },
    ],
  },
  h4: {
    handId: 'h4',
    phases: [
      {
        name: 'preflop', communityCards: [], pot: 1500000,
        steps: [
          { player: 'p5', action: 'raise', amount: 750000, pot: 750000, stacks: { p5: 30450000, p6: 21650000 } },
          { player: 'p6', action: 'call', amount: 750000, pot: 1500000, stacks: { p5: 30450000, p6: 20900000 } },
        ],
      },
      {
        name: 'flop', communityCards: ['Kh', '8s', '3c'], pot: 1500000,
        steps: [
          { player: 'p5', action: 'bet', amount: 1000000, pot: 2500000 },
          { player: 'p6', action: 'raise', amount: 3200000, pot: 5700000 },
          { player: 'p5', action: 'call', amount: 3200000, pot: 7900000 },
        ],
      },
      {
        name: 'turn', communityCards: ['Kh', '8s', '3c', '5d'], pot: 7900000,
        steps: [
          { player: 'p5', action: 'check', amount: 0, pot: 7900000 },
          { player: 'p6', action: 'allin', amount: 17400000, pot: 25300000 },
          { player: 'p5', action: 'call', amount: 17400000, pot: 42700000 },
        ],
      },
      {
        name: 'river', communityCards: ['Kh', '8s', '3c', '5d', 'Ks'], pot: 42700000,
        steps: [],
      },
      {
        name: 'showdown', communityCards: ['Kh', '8s', '3c', '5d', 'Ks'], pot: 42700000,
        steps: [
          { player: 'p5', action: 'show', cards: ['Kc', 'Jc'], handRank: 'Three of a Kind, Kings' },
          { player: 'p6', action: 'show', cards: ['8h', '8d'], handRank: 'Full House, Eights full of Kings' },
          { winner: 'p5', amount: 42700000 },
        ],
      },
    ],
  },
  h3: {
    handId: 'h3',
    phases: [
      {
        name: 'preflop', communityCards: [], pot: 1500000,
        steps: [
          { player: 'p1', action: 'raise', amount: 750000, pot: 750000, stacks: { p1: 44450000, p4: 27750000 } },
          { player: 'p4', action: 'call', amount: 750000, pot: 1500000, stacks: { p1: 44450000, p4: 27000000 } },
        ],
      },
      {
        name: 'flop', communityCards: ['9h', '6d', '2s'], pot: 1500000,
        steps: [
          { player: 'p1', action: 'bet', amount: 900000, pot: 2400000 },
          { player: 'p4', action: 'call', amount: 900000, pot: 3300000 },
        ],
      },
      {
        name: 'turn', communityCards: ['9h', '6d', '2s', 'Tc'], pot: 3300000,
        steps: [
          { player: 'p1', action: 'check', amount: 0, pot: 3300000 },
          { player: 'p4', action: 'bet', amount: 2200000, pot: 5500000 },
          { player: 'p1', action: 'call', amount: 2200000, pot: 7700000 },
        ],
      },
      {
        name: 'river', communityCards: ['9h', '6d', '2s', 'Tc', 'Ah'], pot: 7700000,
        steps: [
          { player: 'p1', action: 'check', amount: 0, pot: 7700000 },
          { player: 'p4', action: 'bet', amount: 5500000, pot: 13200000 },
          { player: 'p1', action: 'call', amount: 5500000, pot: 18700000 },
        ],
      },
      {
        name: 'showdown', communityCards: ['9h', '6d', '2s', 'Tc', 'Ah'], pot: 18700000,
        steps: [
          { player: 'p4', action: 'show', cards: ['9s', '9d'], handRank: 'Three of a Kind, Nines' },
          { player: 'p1', action: 'show', cards: ['Ac', 'Qc'], handRank: 'Pair of Aces' },
          { winner: 'p1', amount: 18700000 },
        ],
      },
    ],
  },
};

// =====================
// Per-Player Stat Hands (sample — VPIP, PFR, 3-Bet for p1)
// =====================
const STAT_HANDS = {
  p1: {
    vpip: [
      { handId: 'h1', actionTaken: true, position: 'BTN', cards: ['Ad', 'Jd'], result: '+$44.2M' },
      { handId: 'h3', actionTaken: true, position: 'CO', cards: ['Ac', 'Qc'], result: '+$6.4M' },
      { handId: 'h6', actionTaken: true, position: 'UTG', cards: ['Ac', 'Tc'], result: '-$3.8M' },
      { handId: 'h7', actionTaken: true, position: 'BB', cards: ['9d', '9c'], result: '-$4.8M' },
      { handId: 'h14', actionTaken: true, position: 'CO', cards: ['Jc', 'Td'], result: '+$2.7M' },
      { handId: 'h21', actionTaken: true, position: 'BTN', cards: ['Ah', 'Kh'], result: '+$1.2M' },
      { handId: 'h24', actionTaken: false, position: 'UTG', cards: ['As', 'Jd'], result: '-$0.7M' },
      { handId: 'h28', actionTaken: true, position: 'MP', cards: ['Kc', 'Qd'], result: '+$1.0M' },
    ],
    pfr: [
      { handId: 'h3', actionTaken: true, position: 'CO', cards: ['Ac', 'Qc'], result: '+$6.4M' },
      { handId: 'h6', actionTaken: true, position: 'UTG', cards: ['Ac', 'Tc'], result: '-$3.8M' },
      { handId: 'h11', actionTaken: true, position: 'BB', cards: ['Ac', 'As'], result: '+$8.7M' },
      { handId: 'h14', actionTaken: false, position: 'CO', cards: ['Jc', 'Td'], result: '+$2.7M' },
      { handId: 'h21', actionTaken: true, position: 'BTN', cards: ['Ah', 'Kh'], result: '+$1.2M' },
      { handId: 'h28', actionTaken: true, position: 'MP', cards: ['Kc', 'Qd'], result: '+$1.0M' },
    ],
    threeBet: [
      { handId: 'h11', actionTaken: true, position: 'BB', cards: ['Ac', 'As'], result: '+$8.7M' },
    ],
    cbetFlop: [
      { handId: 'h3', actionTaken: true, position: 'CO', cards: ['Ac', 'Qc'], result: '+$6.4M' },
      { handId: 'h6', actionTaken: true, position: 'UTG', cards: ['Ac', 'Tc'], result: '-$3.8M' },
      { handId: 'h21', actionTaken: true, position: 'BTN', cards: ['Ah', 'Kh'], result: '+$1.2M' },
      { handId: 'h28', actionTaken: true, position: 'MP', cards: ['Kc', 'Qd'], result: '+$1.0M' },
    ],
  },
};

// =====================
// AI Content
// =====================
const AI_CONTENT = {
  insights: [
    { id: 'ai1', title: 'Aggression Imbalance', text: 'Negreanu\'s AF of 2.8 suggests balanced aggression, but his river AF drops to 2.1 — he may be giving up too many rivers.', icon: '📊' },
    { id: 'ai2', title: 'Bluff Detection', text: '3 confirmed bluffs detected. Kenney ran 2 successful triple barrels while Ivey pulled off a massive turn bluff.', icon: '🎭' },
    { id: 'ai3', title: 'Tight-Aggressive Dominance', text: 'Players with VPIP under 25% and PFR over 18% won 73% of showdowns at this final table.', icon: '🎯' },
    { id: 'ai4', title: 'Position Advantage', text: 'Button and cutoff positions won 62% of contested pots — position matters even more at final tables.', icon: '📍' },
    { id: 'ai5', title: 'Elimination Pattern', text: 'All 8 eliminations came from preflop all-in confrontations. No player was eliminated in a postflop all-in.', icon: '💀' },
  ],
  playerScouting: {
    p1: 'Negreanu played a textbook tight-aggressive game with selective aggression. His VPIP/PFR gap of 6% suggests some speculative calling, but his 54% WSD proves he picks his spots well. Key strength: river value betting. Key weakness: occasional passive turn play.',
    p2: 'Hellmuth ran extremely hot early, hitting sets in key spots. His 72% flop c-bet rate was the most aggressive at the table. However, his 3-bet frequency of 7% may be too low against this field. Was eliminated when his AK ran into Ivey\'s flopped set.',
    p3: 'Ivey was the most balanced player at the table. His 24% VPIP with 20% PFR shows tight play, but his 10% check-raise frequency on the flop kept opponents guessing. Made the most impressive bluff of the tournament on Hand #60.',
    p4: 'Selbst was the loosest player (32% VPIP) but backed it up with creative postflop play. Her 12% flop check-raise rate was highest at the table. Ran into a cooler against Bonomo and was eliminated 5th.',
    p5: 'Bonomo was the tightest regular player at 20% VPIP but compensated with extreme aggression when he entered pots. His 75% flop c-bet rate and 3.8 AF made him the most feared bettor at the table.',
    p6: 'Kenney was the wildcard — highest VPIP (35%) and most creative player. Pulled off two successful triple-barrel bluffs but his 1.8 AF suggests he may have been calling too much. Eliminated 7th after the cooler against Bonomo.',
    p7: 'Holz brought his typical GTO-influenced style with balanced ranges. His 3.1 AF and 70% c-bet rate show aggressive play. Managed to stack Hellmuth with a set of fives early. Eliminated 6th.',
    p8: 'Konnikova was the shortest stack and played cautiously. Her 30% VPIP but only 20% PFR shows too much passive preflop play. Was eliminated 8th in a dominated KT vs KQ situation.',
    p9: 'Seidel was the tightest player at 18% VPIP — perhaps too tight for the situation. His 4.2 AF was extremely aggressive but with only 22 hands, the sample is too small. Was the first elimination, running KQ into aces.',
  },
  story: `The 2025 WSOP Main Event Final Table began with nine of poker's most recognizable names seated around the felt. The early stages saw cautious play, with Erik Seidel adopting an ultra-tight strategy at 18% VPIP.\n\nThe first casualty came quickly — Seidel ran his KQ into Negreanu's pocket aces on Hand #35, becoming the first elimination. This set the tone for a series of preflop all-in confrontations that would define the night.\n\nThe middle stages belonged to the aggressors. Bryn Kenney pulled off two audacious triple-barrel bluffs, including one that forced Phil Hellmuth off two pair. Phil Ivey made the play of the tournament on Hand #60, turning bottom two pair into a bluff that got Fedor Holz to fold pocket aces.\n\nAs the field narrowed, a brutal cooler between Justin Bonomo and Kenney saw trip kings beat a flopped set of eights, sending Kenney to the rail in 7th. Holz followed in 6th, then Selbst and Bonomo.\n\nThe heads-up battle between Negreanu and Ivey lasted 15 hands before the final confrontation. Ivey's pocket kings looked dominant until the river produced a jack, giving Negreanu two pair and the championship title.`,
  quiz: [
    {
      id: 'q1',
      question: 'In Hand #60, Ivey bluffed Holz off pocket aces. What did Ivey hold?',
      options: ['7♦ 4♦', 'A♠ K♣', '9♥ 8♥', 'J♣ T♣'],
      correctIndex: 0,
      explanation: 'Ivey held 7♦4♦ and turned bottom two pair, then raised the turn to represent a stronger hand.',
    },
    {
      id: 'q2',
      question: 'Which player had the highest VPIP at the final table?',
      options: ['Daniel Negreanu (28%)', 'Bryn Kenney (35%)', 'Vanessa Selbst (32%)', 'Maria Konnikova (30%)'],
      correctIndex: 1,
      explanation: 'Kenney was the loosest player with 35% VPIP, entering over a third of all pots.',
    },
    {
      id: 'q3',
      question: 'How were ALL 8 players eliminated?',
      options: ['Postflop all-ins', 'Preflop all-ins', 'River bluffs', 'Mix of preflop and postflop'],
      correctIndex: 1,
      explanation: 'Every single elimination came from a preflop all-in confrontation — a statistical anomaly for final tables.',
    },
    {
      id: 'q4',
      question: 'What was the final hand that won Negreanu the tournament?',
      options: ['Pocket aces vs KQ', 'Two pair vs pair of kings', 'Flush vs straight', 'Set vs two pair'],
      correctIndex: 1,
      explanation: 'Negreanu rivered a jack to make two pair (aces and jacks) against Ivey\'s pocket kings.',
    },
    {
      id: 'q5',
      question: 'Which player had the highest Aggression Factor?',
      options: ['Phil Hellmuth (3.4)', 'Justin Bonomo (3.8)', 'Erik Seidel (4.2)', 'Fedor Holz (3.1)'],
      correctIndex: 2,
      explanation: 'Seidel had an AF of 4.2, though with only 22 hands the sample is unreliable.',
    },
  ],
  commentary: [
    { handId: 'h1', text: 'And THAT is how you win a World Series Main Event! Negreanu needed exactly a jack on the river — and the poker gods delivered! Ivey must be sick to his stomach, but Negreanu played this hand perfectly, extracting maximum value.' },
    { handId: 'h5', text: 'This is vintage Phil Ivey. He knows Holz is strong, he knows his own hand is marginal, but he turns it into a bluff with that massive raise on the turn. The table presence, the timing — this is why they call him the Tiger Woods of poker.' },
    { handId: 'h8', text: 'Kenney fires three bullets with SEVEN HIGH and gets Phil Hellmuth — the Poker Brat himself — to fold TWO PAIR! You could see Hellmuth agonizing over that decision. If he ever finds out what Kenney had, we might need security.' },
    { handId: 'h4', text: 'A classic cooler situation. Kenney flopped a set and had every reason to think he was ahead. But the poker gods had other plans — that king on the turn gave Bonomo trip kings, and the river brought another king for quads. Devastating.' },
    { handId: 'h2', text: 'Hellmuth\'s tournament ends not with a whimper, but with a bang. Running AK into pocket queens — you can\'t fold that preflop at this stage. Ivey\'s queens held, and the Poker Brat exits in 3rd place.' },
  ],
  bluffReport: [
    { handId: 'h5', bluffer: 'p3', blufferName: 'Phil Ivey', victim: 'p7', victimName: 'Fedor Holz', holding: '7♦ 4♦', victimHolding: 'A♠ A♥', street: 'turn', potSize: 9200000, success: true },
    { handId: 'h8', bluffer: 'p6', blufferName: 'Bryn Kenney', victim: 'p2', victimName: 'Phil Hellmuth', holding: '7♠ 6♠', victimHolding: 'A♣ J♦', street: 'river', potSize: 11200000, success: true },
    { handId: 'h13', bluffer: 'p6', blufferName: 'Bryn Kenney', victim: 'p3', victimName: 'Phil Ivey', holding: '9♥ 7♦', victimHolding: 'A♦ K♣', street: 'river', potSize: 6200000, success: true },
  ],
  chatResponses: [
    { query: 'Who played the best?', response: 'Based on the stats, Daniel Negreanu had the most balanced and effective game. His 28% VPIP with 22% PFR shows selective aggression, and his 54% WSD indicates strong hand selection when going to showdown. Phil Ivey was a close second with the most creative play.' },
    { query: 'Show me the biggest bluff', response: 'The biggest bluff was Hand #60 where Phil Ivey held 7♦4♦ and got Fedor Holz to fold pocket aces on the turn with a massive raise. Ivey had turned bottom two pair but represented a much stronger hand.' },
    { query: 'How many bluffs were there?', response: 'There were 3 confirmed successful bluffs at this final table. Bryn Kenney pulled off 2 (Hands #47 and #28), and Phil Ivey made 1 spectacular bluff (Hand #60). Interestingly, all 3 bluffs were successful — no one was caught bluffing.' },
    { query: 'Compare Negreanu and Ivey', response: 'Negreanu: VPIP 28% / PFR 22% / AF 2.8 / WSD 54%\nIvey: VPIP 24% / PFR 20% / AF 2.5 / WSD 52%\n\nNegreanu was slightly looser and more aggressive. Ivey was tighter but more creative with check-raises (10% vs 8% on the flop). Both played excellent poker — the title came down to one river card.' },
    { query: 'Who was eliminated first?', response: 'Erik Seidel was eliminated first (9th place) on Hand #35. He shoved KQ and ran into Negreanu\'s pocket aces. Seidel played only 22 hands at the final table with an ultra-tight 18% VPIP.' },
  ],
};

// =====================
// Wisdom Quotes
// =====================
const WISDOM = [
  { id: 'w1', quote: 'The cardinal sin in poker is becoming emotionally involved.', author: 'Kathy Liebert', category: 'Mindset' },
  { id: 'w2', quote: 'In poker, patience is not simply a virtue, it is THE virtue.', author: 'Doyle Brunson', category: 'Strategy' },
  { id: 'w3', quote: 'The guy who invented poker was bright, but the guy who invented the chip was a genius.', author: 'Julius "Big Julie" Weintraub', category: 'Wisdom' },
  { id: 'w4', quote: 'Last night I stayed up late playing poker with Tarot cards. I got a full house and four people died.', author: 'Steven Wright', category: 'Humor' },
  { id: 'w5', quote: 'Poker is a lot like sex. Everyone thinks they are the best, but most people don\'t have a clue what they are doing.', author: 'Dutch Boyd', category: 'Humor' },
];

// =====================
// User Profile
// =====================
const USER_PROFILE = {
  name: 'Alex Rivers',
  initials: 'AR',
  tier: 'Shark',
  tierIcon: '🦈',
  xp: 2450,
  level: 12,
  streak: 7,
  favorites: {
    tournaments: new Set(['wsop-me-2025', 'ept-monte-carlo-2025']),
    players: new Set(['p1', 'p3', 'p5']),
    hands: new Set(['h1', 'h5', 'h8']),
  },
};

// =====================
// Chip Stack Timeline (for Timeline prototype)
// =====================
const CHIP_TIMELINE = [
  { handNumber: 1, stacks: { p1: 45200000, p2: 38100000, p3: 52800000, p4: 28500000, p5: 31200000, p6: 22400000, p7: 19800000, p8: 15600000, p9: 17400000 } },
  { handNumber: 10, stacks: { p1: 46400000, p2: 38100000, p3: 54000000, p4: 28500000, p5: 30500000, p6: 22400000, p7: 19800000, p8: 15600000, p9: 17900000 } },
  { handNumber: 20, stacks: { p1: 46400000, p2: 39200000, p3: 54000000, p4: 29400000, p5: 30500000, p6: 22400000, p7: 19800000, p8: 15600000, p9: 17900000 } },
  { handNumber: 35, stacks: { p1: 55100000, p2: 39200000, p3: 54000000, p4: 29400000, p5: 30500000, p6: 22400000, p7: 19800000, p8: 15600000 } }, // Seidel eliminated
  { handNumber: 42, stacks: { p1: 55100000, p2: 39200000, p3: 54000000, p4: 29400000, p5: 38300000, p6: 22400000, p7: 19800000 } }, // Konnikova eliminated
  { handNumber: 50, stacks: { p1: 50300000, p2: 39200000, p3: 54000000, p4: 34200000, p5: 38300000, p6: 22400000, p7: 19800000 } },
  { handNumber: 55, stacks: { p1: 50300000, p2: 44800000, p3: 50700000, p4: 34200000, p5: 38300000, p6: 22400000, p7: 19800000 } },
  { handNumber: 60, stacks: { p1: 50300000, p2: 44800000, p3: 59900000, p4: 34200000, p5: 38300000, p6: 22400000, p7: 10600000 } },
  { handNumber: 63, stacks: { p1: 50300000, p2: 44800000, p3: 59900000, p5: 38300000, p6: 22400000, p7: 30400000 } }, // Selbst eliminated
  { handNumber: 68, stacks: { p1: 50300000, p2: 44800000, p3: 59900000, p5: 49500000, p7: 30400000 } }, // Kenney eliminated + Holz eliminated
  { handNumber: 70, stacks: { p1: 50300000, p2: 44800000, p3: 75500000 } }, // Bonomo eliminated
  { handNumber: 82, stacks: { p1: 50300000, p3: 120200000 } }, // Hellmuth eliminated
  { handNumber: 87, stacks: { p1: 170500000 } }, // Ivey eliminated — Negreanu wins
];

// =====================
// Utility Helpers
// =====================

function getPlayer(id) {
  return PLAYERS.find(p => p.id === id);
}

function getTournament(id) {
  return TOURNAMENTS.find(t => t.id === id);
}

function getHand(id) {
  return HANDS.find(h => h.id === id);
}

function getHandsForTournament(tournamentId) {
  return HANDS.filter(h => h.tournamentId === tournamentId).sort((a, b) => b.handNumber - a.handNumber);
}

function getHighlightsForType(type) {
  return HIGHLIGHTS[type] || [];
}

function formatChips(amount) {
  if (amount >= 1000000) return '$' + (amount / 1000000).toFixed(1) + 'M';
  if (amount >= 1000) return '$' + (amount / 1000).toFixed(0) + 'K';
  return '$' + amount;
}

function formatNumber(num) {
  return num.toLocaleString();
}

function getStatColor(stat, value) {
  const ranges = {
    vpip: { green: [20, 28], yellow: [15, 35] },
    pfr: { green: [15, 22], yellow: [10, 28] },
    threeBet: { green: [6, 10], yellow: [4, 14] },
    fourBet: { green: [2, 5], yellow: [1, 8] },
    cbetFlop: { green: [55, 70], yellow: [45, 80] },
    cbetTurn: { green: [45, 60], yellow: [35, 70] },
    cbetRiver: { green: [30, 45], yellow: [20, 55] },
    af: { green: [2.0, 3.5], yellow: [1.5, 5.0] },
    afq: { green: [40, 55], yellow: [30, 65] },
    wtsd: { green: [25, 35], yellow: [20, 45] },
    wsd: { green: [48, 55], yellow: [42, 62] },
    wwsf: { green: [45, 55], yellow: [38, 62] },
    steal: { green: [30, 45], yellow: [22, 55] },
    foldToSteal: { green: [55, 70], yellow: [45, 80] },
  };
  const range = ranges[stat];
  if (!range) return '#9ca3af';
  if (value >= range.green[0] && value <= range.green[1]) return '#10b981';
  if (value >= range.yellow[0] && value <= range.yellow[1]) return '#f59e0b';
  return '#ef4444';
}

function getCardSuit(card) {
  const suit = card[card.length - 1];
  const suits = { s: '♠', h: '♥', d: '♦', c: '♣' };
  return suits[suit] || suit;
}

function getCardRank(card) {
  return card.slice(0, -1);
}

function isRedSuit(card) {
  const suit = card[card.length - 1];
  return suit === 'h' || suit === 'd';
}

function formatCard(card) {
  return getCardRank(card) + getCardSuit(card);
}

// Export for use by prototypes (ES module style, also works with script tag)
if (typeof window !== 'undefined') {
  window.HUDR_DATA = {
    TOURNAMENTS, PLAYERS, PLAYER_STATS, HANDS, HIGHLIGHTS, HIGHLIGHT_LABELS,
    HAND_REPLAYS, STAT_HANDS, AI_CONTENT, WISDOM, USER_PROFILE, CHIP_TIMELINE,
    getPlayer, getTournament, getHand, getHandsForTournament, getHighlightsForType,
    formatChips, formatNumber, getStatColor, getCardSuit, getCardRank, isRedSuit, formatCard,
  };
}
