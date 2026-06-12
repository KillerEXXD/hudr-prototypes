import { apiClient } from '../client'
import { transformHand } from '../transforms'
import type { ApiHand } from '../types'
import type { HandSummary } from '../domain'

export async function getTournamentHands(tournamentId: string): Promise<HandSummary[]> {
  const res = await apiClient.get<ApiHand[]>('/tournament-hands', { tournament_id: tournamentId })
  return (res.data ?? []).map(transformHand)
}
