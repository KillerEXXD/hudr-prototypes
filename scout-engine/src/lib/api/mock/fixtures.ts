// =====================================================================
// Mock fixtures — the ONLY place that knows about the local sample dataset.
// Produces RAW Api-shaped payloads (snake_case), exactly what api.hudr.ai
// would return, so the transform/service/hook/component layers above are
// identical in mock and live mode.
// =====================================================================
import { PLAYERS, STATS, TOURNAMENTS_LIST, HIGHLIGHTS, YT_BASE } from '@/data'
import { EXTRA_STATS } from '@/engine'
import type { ApiTournament, ApiPlayer, ApiPlayerStats, ApiHighlight, ApiHand, ApiSuggestedQuestion, ApiPlayerTournament, ApiCurrentUser, ApiSubscriptionPlan, ApiTrendingQuery } from '../types'

export const apiTournaments: ApiTournament[] = TOURNAMENTS_LIST.map((t) => ({
  id: t.id,
  name: t.name,
  event: t.event,
  venue: t.venue,
  date: t.date,
  player_count: t.players,
  hand_count: t.hands,
  prize_pool: t.prize,
  status: t.status,
  is_live: t.live,
  winner_id: t.winner,
  duration: t.duration,
  top_player_ids: t.topPlayers,
  exploitable_count: t.exploitable,
  youtube_id: t.youtubeId ?? null,
}))

export const apiPlayers: ApiPlayer[] = PLAYERS.map((p) => ({
  player_id: p.id,
  name: p.name,
  flag: p.flag,
  initials: p.initials,
  color: p.color,
  finish: p.finish,
  status: p.status,
  hands_played: p.hands,
  photo_url: p.photoUrl ?? null,
}))

export const apiPlayerStats: Record<string, ApiPlayerStats> = Object.fromEntries(
  PLAYERS.map((p) => {
    const s = STATS[p.id]
    const e = EXTRA_STATS[p.id]
    const row: ApiPlayerStats = {
      player_id: p.id,
      total_hands: s.totalHands,
      vpip: s.vpip,
      pfr: s.pfr,
      three_bet: s.threeBet,
      fold_to_3bet: e.foldTo3Bet,
      four_bet: e.fourBet,
      cold_call: e.coldCall,
      steal: s.steal,
      fold_to_steal: s.foldToSteal,
      cbet_flop: s.cbetFlop,
      cbet_turn: s.cbetTurn,
      fold_to_cbet_flop: e.foldToCbetFlop,
      fold_to_cbet_turn: e.foldToCbetTurn,
      check_raise: s.checkRaiseFlop,
      donk: e.donk,
      wtsd: s.wtsd,
      wsd: s.wsd,
      wwsf: e.wwsf,
      af: s.af,
      afq: e.afq,
      river_bet: e.riverBet,
    }
    return [p.id, row]
  }),
)

export const apiHighlights: ApiHighlight[] = HIGHLIGHTS.map((h) => ({
  id: h.id,
  hand_number: h.hand,
  type: h.type,
  tier: h.tier,
  board: h.board,
  preview: h.preview,
  pot: h.pot,
  player_ids: h.players,
  video_seconds: h.ytTime,
}))

// MODELED hand-history list per tournament (placeholder data — integration later).
const BOARDS = ['Kd Qh Ks', '9h 6h 2h', 'As Kh 7c', 'Th 8d 3c', 'Jc Jd 4s', 'Qs 9s 5h', 'Ad 7d 2c', '8c 8h 5d']
const RESULTS = ['Bet flop, took it down', 'All-in preflop, called', 'Triple-barrel, called', 'C-bet, opponent folded', 'Check-raise on the turn', 'Showdown — top pair wins', 'River bluff picked off', 'Set over set cooler']

// Popular questions per context, with how many times other users asked them.
export const suggestedQuestions: Record<'tournament' | 'player', ApiSuggestedQuestion[]> = {
  tournament: [
    { text: 'Who is the most exploitable player?', asked_count: 2380 },
    { text: 'Who should I avoid tangling with?', asked_count: 1640 },
    { text: 'Who plays the most hands?', asked_count: 1290 },
    { text: 'Who can I bluff?', asked_count: 1120 },
    { text: 'Who is the toughest player here?', asked_count: 870 },
    { text: 'Who steals blinds the most?', asked_count: 540 },
    { text: 'Who calls down too light?', asked_count: 430 },
    { text: 'Give me a quick read on the whole table', asked_count: 360 },
  ],
  player: [
    { text: "What's their biggest weakness?", asked_count: 3120 },
    { text: 'How do I beat them?', asked_count: 2010 },
    { text: 'Can I bluff them?', asked_count: 1450 },
    { text: "What's their playing style?", asked_count: 980 },
    { text: 'Do they fold to 3-bets?', asked_count: 760 },
    { text: 'Are they aggressive postflop?', asked_count: 520 },
    { text: 'Should I value bet thin against them?', asked_count: 410 },
    { text: "What's their game plan against me?", asked_count: 280 },
  ],
}

// Signed-in user (mock). Drives the top-right profile menu, Saved, and which
// subscription tier is current.
export const apiCurrentUser: ApiCurrentUser = {
  id: 'u1',
  name: 'Alex Carter',
  email: 'alex.carter@hudr.ai',
  initials: 'AC',
  color: '#6366f1',
  member_since: 'Jan 2025',
  plan: 'shark',
  saved_player_ids: ['p1', 'p3', 'p5'],
  saved_tournament_ids: ['t1', 't2'],
}

// Subscription tiers (poker-themed, mirroring hudr-pwa: Free / Fish / Shark / Whale).
export const apiSubscriptionPlans: ApiSubscriptionPlan[] = [
  {
    id: 'free', name: 'Free', price_monthly: 0, tagline: 'Dip your toes in',
    features: ['Browse tournaments & players', 'Plain-English reads', '3 scouting reports / day'],
    highlight: false,
  },
  {
    id: 'fish', name: 'Fish', price_monthly: 9, tagline: 'For the casual grinder',
    features: ['Everything in Free', 'Unlimited scouting reports', 'Pro stats mode', 'Save up to 25 players'],
    highlight: false,
  },
  {
    id: 'shark', name: 'Shark', price_monthly: 29, tagline: 'For the serious player',
    features: ['Everything in Fish', 'Full exploit matrix & game plans', 'AI assistant (unlimited)', 'Unlimited Saved', 'Hand replayer'],
    highlight: true,
  },
  {
    id: 'whale', name: 'Whale', price_monthly: 99, tagline: 'For the high roller & coach',
    features: ['Everything in Shark', 'Multi-table live tracking', 'Priority data refresh', 'Team / staking seats'],
    highlight: false,
  },
]

// Trending AI questions — what other users recently asked, each anchored to a
// specific player or tournament (never generic), with community upvotes. Powers
// the AI tab's empty state. Sorted by votes on display.
export const apiTrendingQueries: ApiTrendingQuery[] = [
  { id: 'tq1', kind: 'player', target_id: 'p1', question: 'Can I bluff Daniel Negreanu?', votes: 312 },
  { id: 'tq2', kind: 'player', target_id: 'p3', question: "What's Phil Hellmuth's biggest leak?", votes: 287 },
  { id: 'tq3', kind: 'tournament', target_id: 't1', question: 'Who has the softest field at the WSOP Main Event?', votes: 254 },
  { id: 'tq4', kind: 'player', target_id: 'p2', question: 'How do I beat Phil Ivey?', votes: 241 },
  { id: 'tq5', kind: 'player', target_id: 'p5', question: 'How aggressive is Vanessa Selbst postflop?', votes: 198 },
  { id: 'tq6', kind: 'tournament', target_id: 't4', question: 'Which Triton Million player should I avoid?', votes: 165 },
  { id: 'tq7', kind: 'player', target_id: 'p6', question: 'Does Fedor Holz fold to 3-bets?', votes: 142 },
  { id: 'tq8', kind: 'player', target_id: 'p7', question: 'Can I value bet thin against Bryn Kenney?', votes: 119 },
]

// Tournaments this player appears in, with modeled hands per tournament.
export function buildPlayerTournaments(playerId: string): ApiPlayerTournament[] {
  return apiTournaments
    .filter((t) => t.hand_count > 0 && (t.id === 't1' || t.top_player_ids.includes(playerId)))
    .map((t, i) => {
      const seed = ((playerId.charCodeAt(1) || 1) * 7 + i * 3) % 10
      const hands = t.id === 't1'
        ? (STATS[playerId]?.totalHands ?? 0)
        : Math.max(8, Math.round(t.hand_count * (0.45 + 0.5 * (seed / 10))))
      return { tournament_id: t.id, name: t.name, event: t.event, date: t.date, hands }
    })
}

export function buildTournamentHands(tournamentId: string): ApiHand[] {
  const t = apiTournaments.find((x) => x.id === tournamentId)
  if (!t) return []
  const count = Math.min(t.hand_count || 0, 15)
  const ids = t.top_player_ids.length ? t.top_player_ids : apiPlayers.map((p) => p.player_id)
  return Array.from({ length: count }, (_, i) => {
    const handNumber = (t.hand_count || count) - i // most-recent first
    const board = BOARDS[i % BOARDS.length].split(' ')
    return {
      hand_number: handNumber,
      board,
      pot: 50000 + (i % 7) * 125000,
      player_ids: [ids[i % ids.length], ids[(i + 1) % ids.length]],
      video_seconds: 120 + i * 47,
      result: RESULTS[i % RESULTS.length],
      video_url: `${YT_BASE}${120 + i * 47}`,
      has_replay: true,
    }
  })
}
