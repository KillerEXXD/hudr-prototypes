// React Query hooks — the only thing pages use to read data (same pattern as the
// ClubR app). Each wraps a mock service fn; swap the service for fetch() to go live.
import { useQuery } from '@tanstack/react-query'
import * as api from '@/lib/api/services'

export const useGames = () => useQuery({ queryKey: ['games'], queryFn: api.listGames })
export const useFinalists = () => useQuery({ queryKey: ['finalists'], queryFn: api.getFinalists })
export const useNotifications = () => useQuery({ queryKey: ['notifications'], queryFn: api.listNotifications })
export const useClubMembers = () => useQuery({ queryKey: ['club', 'members'], queryFn: api.getClubMembers })
export const useClubGames = () => useQuery({ queryKey: ['club', 'games'], queryFn: api.getClubGames })
export const useStandings = () => useQuery({ queryKey: ['standings'], queryFn: api.getStandings })
export const useCredits = () => useQuery({ queryKey: ['credits'], queryFn: api.getCredits })
