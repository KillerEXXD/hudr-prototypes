import { useMemo } from 'react'
import { TOURNAMENTS_LIST, TOURNAMENT } from '@/data'

export function useTournaments() {
  const tournaments = useMemo(() => TOURNAMENTS_LIST, [])
  return { tournaments }
}

export function useTournament(id: string) {
  const tournament = useMemo(() => TOURNAMENTS_LIST.find(t => t.id === id), [id])
  const detail = useMemo(() => (id === 't1' ? TOURNAMENT : undefined), [id])
  return { tournament, detail }
}
