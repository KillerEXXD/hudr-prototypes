import { apiClient } from '../client'
import { transformPlayer, transformStats, transformPlayerTournament, transformStatHand } from '../transforms'
import type { ApiPlayer, ApiPlayerStats, ApiPlayerTournament, ApiStatHand } from '../types'
import type { Player, PlayerTournament, StatHand } from '../domain'
import type { RawPlayerStatValues, StatFilters } from '@/engine'

export async function getPlayers(): Promise<Player[]> {
  const res = await apiClient.get<ApiPlayer[]>('/players')
  return (res.data ?? []).map(transformPlayer)
}

export async function getPlayer(id: string): Promise<Player | null> {
  const res = await apiClient.get<ApiPlayer>(`/players/${id}`)
  return res.data ? transformPlayer(res.data) : null
}

export async function getPlayerStats(id: string, filters?: StatFilters): Promise<RawPlayerStatValues> {
  const res = await apiClient.get<ApiPlayerStats>('/player-statistics', {
    player_id: id,
    // Event scope sends tournament_id; Career omits it (all-tournament stats).
    tournament_id: filters?.scope === 'event' ? (filters.tournamentId ?? undefined) : undefined,
    table_size: filters?.tableSize,
    depth: filters?.depth,
  })
  if (!res.data) throw new Error(`No stats for player ${id}`)
  return transformStats(res.data)
}

export async function getPlayerTournaments(id: string): Promise<PlayerTournament[]> {
  const res = await apiClient.get<ApiPlayerTournament[]>('/player-tournaments', { player_id: id })
  return (res.data ?? []).map(transformPlayerTournament)
}

// The specific hands behind a stat (mirrors hudr-pwa /player-stat-hands).
export async function getPlayerStatHands(
  playerId: string,
  opts: { statType: string; tournamentId?: string; actionTaken?: boolean },
): Promise<StatHand[]> {
  const res = await apiClient.get<ApiStatHand[]>('/player-stat-hands', {
    player_id: playerId,
    stat_type: opts.statType,
    tournament_id: opts.tournamentId,
    action_taken: opts.actionTaken != null ? String(opts.actionTaken) : undefined,
  })
  return (res.data ?? []).map(transformStatHand)
}
