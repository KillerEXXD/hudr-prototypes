import { useQuery, useQueries } from '@tanstack/react-query'
import {
  getTournaments, getTournament, getTournamentPlayers,
  getPlayers, getPlayer, getPlayerProfile, getTournamentHighlights, getTournamentHands,
  getSuggestedQuestions, getPlayerTournaments, getCurrentUser, getSubscriptionPlans, getTrendingQueries,
} from '@/lib/api/services'
import type { PlayerProfile, StatFilters } from '@/engine'

const STATIC = { staleTime: Infinity } // mock data is static; tune per-status when live

export function useTournaments() {
  return useQuery({ queryKey: ['tournaments'], queryFn: getTournaments, ...STATIC })
}
export function useTournament(id: string) {
  return useQuery({ queryKey: ['tournaments', id], queryFn: () => getTournament(id), enabled: !!id, ...STATIC })
}
export function useTournamentPlayers(id: string) {
  return useQuery({ queryKey: ['tournaments', id, 'players'], queryFn: () => getTournamentPlayers(id), enabled: !!id, ...STATIC })
}
export function usePlayers() {
  return useQuery({ queryKey: ['players'], queryFn: getPlayers, ...STATIC })
}
export function usePlayer(id: string) {
  return useQuery({ queryKey: ['players', id], queryFn: () => getPlayer(id), enabled: !!id, ...STATIC })
}
export function usePlayerTournaments(id: string) {
  return useQuery({ queryKey: ['players', id, 'tournaments'], queryFn: () => getPlayerTournaments(id), enabled: !!id, ...STATIC })
}
export function usePlayerProfile(id: string, filters: StatFilters) {
  return useQuery({
    queryKey: ['profile', id, filters],
    queryFn: () => getPlayerProfile(id, filters),
    enabled: !!id,
    ...STATIC,
  })
}
export function useTournamentHighlights(id: string) {
  return useQuery({ queryKey: ['tournaments', id, 'highlights'], queryFn: () => getTournamentHighlights(id), enabled: !!id, ...STATIC })
}
export function useTournamentHands(id: string) {
  return useQuery({ queryKey: ['tournaments', id, 'hands'], queryFn: () => getTournamentHands(id), enabled: !!id, ...STATIC })
}
export function useSuggestedQuestions(context: 'tournament' | 'player') {
  return useQuery({ queryKey: ['suggested-questions', context], queryFn: () => getSuggestedQuestions(context), ...STATIC })
}
export function useCurrentUser() {
  return useQuery({ queryKey: ['me'], queryFn: getCurrentUser, ...STATIC })
}
export function useSubscriptionPlans() {
  return useQuery({ queryKey: ['subscription-plans'], queryFn: getSubscriptionPlans, ...STATIC })
}
export function useTrendingQueries() {
  return useQuery({ queryKey: ['trending-queries'], queryFn: getTrendingQueries, ...STATIC })
}

/** Profiles for a set of players under one filter (roster cards, AI chat, lists). */
export function useProfiles(ids: string[], filters: StatFilters) {
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ['profile', id, filters],
      queryFn: () => getPlayerProfile(id, filters),
      staleTime: Infinity,
    })),
  })
  const profiles = results.map((r) => r.data).filter((p): p is PlayerProfile => !!p)
  const isLoading = results.some((r) => r.isLoading)
  return { profiles, isLoading }
}

const CAREER: StatFilters = { scope: 'career', tournamentId: null, tableSize: 'all', depth: 'all' }
export const careerFilters = (): StatFilters => CAREER

/** Event-scoped profiles for a tournament roster. */
export function useTournamentProfiles(tournamentId: string, ids: string[]) {
  return useProfiles(ids, { scope: 'event', tournamentId, tableSize: 'all', depth: 'all' })
}
