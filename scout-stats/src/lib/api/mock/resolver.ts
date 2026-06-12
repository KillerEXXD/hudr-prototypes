import { apiTournaments, apiPlayers, apiPlayerStats, apiHighlights, buildTournamentHands, buildPlayerTournaments, buildStatHands, suggestedQuestions, apiCurrentUser, apiSubscriptionPlans, apiTrendingQueries } from './fixtures'
import { applyFilters } from './segment'

type Params = Record<string, string | number | undefined> | undefined

// Maps an endpoint + params to a raw Api payload (the data field). Mirrors the
// routes the real api.hudr.ai exposes; the client wraps the result in ApiResponse.
export function resolveMock<T>(endpoint: string, params?: Params): T {
  const path = endpoint.split('?')[0].replace(/\/+$/, '')
  const seg = path.split('/').filter(Boolean) // e.g. ['players','p3']

  switch (seg[0]) {
    case 'tournaments': {
      if (seg[1]) return apiTournaments.find((t) => t.id === seg[1]) as T
      return apiTournaments as T
    }
    case 'tournament-players': {
      const tid = String(params?.tournament_id ?? '')
      const t = apiTournaments.find((x) => x.id === tid)
      const ids = tid === 't1' ? apiPlayers.map((p) => p.player_id) : (t?.top_player_ids ?? apiPlayers.map((p) => p.player_id))
      return apiPlayers.filter((p) => ids.includes(p.player_id)) as T
    }
    case 'players': {
      if (seg[1]) return apiPlayers.find((p) => p.player_id === seg[1]) as T
      return apiPlayers as T
    }
    case 'player-statistics': {
      const pid = String(params?.player_id ?? '')
      const base = apiPlayerStats[pid]
      if (!base) return undefined as T
      return applyFilters(base, {
        tournament_id: params?.tournament_id != null ? String(params.tournament_id) : undefined,
        table_size: params?.table_size != null ? String(params.table_size) : undefined,
        depth: params?.depth != null ? String(params.depth) : undefined,
      }) as T
    }
    case 'tournament-highlights': {
      return apiHighlights as T
    }
    case 'tournament-hands': {
      return buildTournamentHands(String(params?.tournament_id ?? '')) as T
    }
    case 'player-tournaments': {
      return buildPlayerTournaments(String(params?.player_id ?? '')) as T
    }
    case 'player-stat-hands': {
      const hands = buildStatHands(String(params?.player_id ?? ''), String(params?.stat_type ?? ''))
      const at = params?.action_taken != null ? String(params.action_taken) : undefined
      if (at === 'true' || at === 'false') return hands.filter((h) => h.action_taken === (at === 'true')) as T
      return hands as T
    }
    case 'me': {
      return apiCurrentUser as T
    }
    case 'subscription-plans': {
      return apiSubscriptionPlans as T
    }
    case 'trending-queries': {
      return apiTrendingQueries as T
    }
    case 'suggested-questions': {
      const ctx = (String(params?.context ?? 'tournament') === 'player' ? 'player' : 'tournament')
      return suggestedQuestions[ctx] as T
    }
    default:
      throw new Error(`No mock for endpoint: ${endpoint}`)
  }
}
