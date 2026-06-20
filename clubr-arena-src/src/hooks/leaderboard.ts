import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as lb from '@/lib/api/leaderboardServices'
import type { LeaderboardConfig, SeasonKey } from '@/types/leaderboard'

export function useClubLeaderboard(clubId: string, season?: SeasonKey) {
  return useQuery({
    queryKey: ['leaderboard', 'club', clubId, season ?? 'default'],
    queryFn: () => lb.getClubLeaderboard(clubId, season),
    enabled: !!clubId,
  })
}

export function useLeaderboardConfig() {
  return useQuery({ queryKey: ['leaderboard', 'config'], queryFn: () => lb.getLeaderboardConfig() })
}

export function useUpdateLeaderboardConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (c: LeaderboardConfig) => lb.updateLeaderboardConfig(c),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leaderboard'] }),
  })
}
