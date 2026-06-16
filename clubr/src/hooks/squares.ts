import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import * as sq from '@/lib/api/squaresServices'

function useIdentity() {
  const { user } = useAuth()
  return { userId: user?.id ?? '', isAdmin: user?.role === 'admin' }
}

export function useSquaresGames() {
  const { userId, isAdmin } = useIdentity()
  return useQuery({ queryKey: ['sq', 'list', userId], queryFn: () => sq.listSquares(userId, isAdmin) })
}
export function useSquaresGame(id: string) {
  const { userId, isAdmin } = useIdentity()
  return useQuery({ queryKey: ['sq', 'one', id, userId], queryFn: () => sq.getSquares(id, userId, isAdmin), enabled: !!id })
}

function useInvalidate() { const qc = useQueryClient(); return () => qc.invalidateQueries({ queryKey: ['sq'] }) }

export function useRequestJoinSquares() { const { userId } = useIdentity(); const inv = useInvalidate(); return useMutation({ mutationFn: (gameId: string) => sq.requestJoinSquares(gameId, userId), onSuccess: inv }) }
export function useApproveSquares() { const inv = useInvalidate(); return useMutation({ mutationFn: (v: { gameId: string; userId: string }) => sq.approveSquares(v.gameId, v.userId), onSuccess: inv }) }
export function useDeclineSquares() { const inv = useInvalidate(); return useMutation({ mutationFn: (v: { gameId: string; userId: string }) => sq.declineSquares(v.gameId, v.userId), onSuccess: inv }) }
export function useToggleSquaresPaid() { const inv = useInvalidate(); return useMutation({ mutationFn: (v: { gameId: string; userId: string }) => sq.toggleSquaresPaid(v.gameId, v.userId), onSuccess: inv }) }
export function useClaimSquare() { const { userId } = useIdentity(); const inv = useInvalidate(); return useMutation({ mutationFn: (v: { gameId: string; cellIdx: number }) => sq.claimSquare(v.gameId, userId, v.cellIdx), onSuccess: inv }) }
export function useLockSquares() { const inv = useInvalidate(); return useMutation({ mutationFn: (gameId: string) => sq.lockSquares(gameId), onSuccess: inv }) }
export function useSetSquaresScore() { const inv = useInvalidate(); return useMutation({ mutationFn: (v: { gameId: string; label: string; home: number; away: number }) => sq.setSquaresScore(v.gameId, v.label, v.home, v.away), onSuccess: inv }) }
export function useCreateSquares() {
  const { userId } = useIdentity(); const inv = useInvalidate()
  return useMutation({ mutationFn: (v: { clubId: string; title: string; homeTeam: string; awayTeam: string; stake: number; visibility: 'public' | 'private'; accessUserIds: string[]; closesAt: string; timezone: string; periodPayouts: number[] }) => sq.createSquares(v.clubId, userId, { title: v.title, homeTeam: v.homeTeam, awayTeam: v.awayTeam, stake: v.stake, visibility: v.visibility, accessUserIds: v.accessUserIds, closesAt: v.closesAt, timezone: v.timezone, periodPayouts: v.periodPayouts }), onSuccess: inv })
}
