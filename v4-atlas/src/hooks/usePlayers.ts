import { useMemo } from 'react'
import { PLAYERS, STATS, PLAYER_DIMENSIONS, STYLES, SKILL_RATINGS } from '@/data'

export function usePlayers() {
  const players = useMemo(() => PLAYERS, [])
  return { players }
}

export function usePlayer(id: string) {
  const player = useMemo(() => PLAYERS.find(p => p.id === id), [id])
  const stats = useMemo(() => STATS[id], [id])
  const dimensions = useMemo(() => PLAYER_DIMENSIONS[id], [id])
  const style = useMemo(() => STYLES[id], [id])
  const skillRating = useMemo(() => SKILL_RATINGS[id], [id])

  return { player, stats, dimensions, style, skillRating }
}
