import { apiClient } from '../client'
import { transformHighlight } from '../transforms'
import type { ApiHighlight } from '../types'
import type { Highlight } from '../domain'

export async function getTournamentHighlights(tournamentId: string): Promise<Highlight[]> {
  const res = await apiClient.get<ApiHighlight[]>('/tournament-highlights', { tournament_id: tournamentId })
  return (res.data ?? []).map(transformHighlight)
}
