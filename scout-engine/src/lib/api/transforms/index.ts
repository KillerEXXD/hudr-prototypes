import type { ApiTournament, ApiPlayer, ApiPlayerStats, ApiHighlight, ApiHand, ApiSuggestedQuestion } from '../types'
import type { Tournament, Player, Highlight, HandSummary, SuggestedQuestion } from '../domain'
import type { RawPlayerStatValues } from '@/engine'
import { YT_BASE } from '@/data'

// Api (snake_case) → domain (camelCase). The only layer that knows field naming.

export function transformTournament(a: ApiTournament): Tournament {
  return {
    id: a.id, name: a.name, event: a.event, venue: a.venue, date: a.date,
    playerCount: a.player_count, handCount: a.hand_count, prizePool: a.prize_pool,
    status: a.status, isLive: a.is_live, winnerId: a.winner_id, duration: a.duration,
    topPlayerIds: a.top_player_ids, exploitableCount: a.exploitable_count,
  }
}

export function transformPlayer(a: ApiPlayer): Player {
  return {
    id: a.player_id, name: a.name, flag: a.flag, initials: a.initials,
    color: a.color, finish: a.finish, status: a.status, handsPlayed: a.hands_played,
  }
}

export function transformStats(a: ApiPlayerStats): RawPlayerStatValues {
  return {
    totalHands: a.total_hands,
    vpip: a.vpip, pfr: a.pfr, threeBet: a.three_bet, foldTo3Bet: a.fold_to_3bet,
    fourBet: a.four_bet, coldCall: a.cold_call, steal: a.steal, foldToSteal: a.fold_to_steal,
    cbetFlop: a.cbet_flop, cbetTurn: a.cbet_turn, foldToCbetFlop: a.fold_to_cbet_flop,
    foldToCbetTurn: a.fold_to_cbet_turn, checkRaise: a.check_raise, donk: a.donk,
    wtsd: a.wtsd, wsd: a.wsd, wwsf: a.wwsf, af: a.af, afq: a.afq, riverBet: a.river_bet,
  }
}

export function transformHighlight(a: ApiHighlight): Highlight {
  return {
    id: a.id, handNumber: a.hand_number, type: a.type, tier: a.tier, board: a.board,
    preview: a.preview, pot: a.pot, playerIds: a.player_ids, videoSeconds: a.video_seconds,
    videoUrl: `${YT_BASE}${a.video_seconds}`,
  }
}

export function transformSuggestedQuestion(a: ApiSuggestedQuestion): SuggestedQuestion {
  return { text: a.text, askedCount: a.asked_count }
}

export function transformHand(a: ApiHand): HandSummary {
  return {
    handNumber: a.hand_number, board: a.board, pot: a.pot, playerIds: a.player_ids,
    result: a.result, videoSeconds: a.video_seconds, videoUrl: a.video_url, hasReplay: a.has_replay,
  }
}
