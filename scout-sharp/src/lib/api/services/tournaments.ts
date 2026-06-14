import { apiClient } from '../client'
import { transformTournament, transformPlayer } from '../transforms'
import type { ApiTournament, ApiPlayer } from '../types'
import type { Tournament, Player } from '../domain'

export async function getTournaments(): Promise<Tournament[]> {
  const res = await apiClient.get<ApiTournament[]>('/tournaments')
  return (res.data ?? []).map(transformTournament)
}

export async function getTournament(id: string): Promise<Tournament | null> {
  const res = await apiClient.get<ApiTournament>(`/tournaments/${id}`)
  return res.data ? transformTournament(res.data) : null
}

export async function getTournamentPlayers(tournamentId: string): Promise<Player[]> {
  const res = await apiClient.get<ApiPlayer[]>('/tournament-players', { tournament_id: tournamentId })
  return (res.data ?? []).map(transformPlayer)
}
