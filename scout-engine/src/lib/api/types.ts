// Generic API envelope (mirrors hudr-pwa ApiResponse<T>).
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  meta?: { page?: number; limit?: number; total?: number }
}

// ---- Raw API shapes (snake_case), as the real api.hudr.ai would return ----
// Transforms convert these → camelCase domain models, exactly like hudr-pwa.

export interface ApiTournament {
  id: string
  name: string
  event: string
  venue: string
  date: string
  player_count: number
  hand_count: number
  prize_pool: number
  status: 'completed' | 'live' | 'upcoming'
  is_live: boolean
  winner_id: string | null
  duration: string | null
  top_player_ids: string[]
  exploitable_count: number
}

export interface ApiPlayer {
  player_id: string
  name: string
  flag: string
  initials: string
  color: string
  finish: number | null
  status: string
  hands_played: number
}

export interface ApiPlayerStats {
  player_id: string
  total_hands: number
  // preflop
  vpip: number
  pfr: number
  three_bet: number
  fold_to_3bet: number
  four_bet: number
  cold_call: number
  steal: number
  fold_to_steal: number
  // postflop
  cbet_flop: number
  cbet_turn: number
  fold_to_cbet_flop: number
  fold_to_cbet_turn: number
  check_raise: number
  donk: number
  wtsd: number
  wsd: number
  wwsf: number
  af: number
  afq: number
  river_bet: number
}

export interface ApiHighlight {
  id: string
  hand_number: number
  type: string
  tier: string
  board: string
  preview: string
  pot: number
  player_ids: string[]
  video_seconds: number
}

export interface ApiHand {
  hand_number: number
  board: string[]
  pot: number
  player_ids: string[]
  video_seconds: number
  result: string
  // each hand can be viewed two ways (integration later):
  video_url: string | null   // YouTube deep link w/ timestamp
  has_replay: boolean         // backend has replay actions → replayer available
}
