import { apiClient } from '../client'
import { transformPlayer, transformStats } from '../transforms'
import type { ApiPlayer, ApiPlayerStats } from '../types'
import type { Player } from '../domain'
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
