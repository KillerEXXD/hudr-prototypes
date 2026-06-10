// =====================================================================
// Mock fixtures — the ONLY place that knows about the local sample dataset.
// Produces RAW Api-shaped payloads (snake_case), exactly what api.hudr.ai
// would return, so the transform/service/hook/component layers above are
// identical in mock and live mode.
// =====================================================================
import { PLAYERS, STATS, TOURNAMENTS_LIST, HIGHLIGHTS } from '@/data'
import { EXTRA_STATS } from '@/engine'
import type { ApiTournament, ApiPlayer, ApiPlayerStats, ApiHighlight } from '../types'

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
