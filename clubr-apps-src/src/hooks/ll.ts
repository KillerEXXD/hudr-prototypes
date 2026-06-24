import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import * as ll from '@/lib/api/llServices'

function useIdentity() {
  const { user } = useAuth()
  return { userId: user?.id ?? '', isAdmin: user?.role === 'admin' }
}

export function useGames() {
  const { userId, isAdmin } = useIdentity()
  return useQuery({ queryKey: ['ll', 'list', userId], queryFn: () => ll.listGames(userId, isAdmin) })
}
export function useGame(id: string) {
  const { userId, isAdmin } = useIdentity()
  return useQuery({ queryKey: ['ll', 'one', id, userId], queryFn: () => ll.getGame(id, userId, isAdmin), enabled: !!id })
}

function useInvalidate() {
  const qc = useQueryClient()
  return () => { qc.invalidateQueries({ queryKey: ['ll'] }); qc.invalidateQueries({ queryKey: ['credits'] }) }
}

export function useRequestJoinLL() { const { userId } = useIdentity(); const inv = useInvalidate(); return useMutation({ mutationFn: (gameId: string) => ll.requestJoin(gameId, userId), onSuccess: inv }) }
export function useApproveLL() { const inv = useInvalidate(); return useMutation({ mutationFn: (v: { gameId: string; userId: string }) => ll.approve(v.gameId, v.userId), onSuccess: inv }) }
export function useDeclineLL() { const inv = useInvalidate(); return useMutation({ mutationFn: (v: { gameId: string; userId: string }) => ll.decline(v.gameId, v.userId), onSuccess: inv }) }
export function useTogglePaidLL() { const inv = useInvalidate(); return useMutation({ mutationFn: (v: { gameId: string; userId: string }) => ll.togglePaid(v.gameId, v.userId), onSuccess: inv }) }
export function useAssignCoHostLL() { const inv = useInvalidate(); return useMutation({ mutationFn: (v: { gameId: string; userId: string }) => ll.assignCoHost(v.gameId, v.userId), onSuccess: inv }) }
export function useRemoveCoHostLL() { const inv = useInvalidate(); return useMutation({ mutationFn: (v: { gameId: string; userId: string }) => ll.removeCoHost(v.gameId, v.userId), onSuccess: inv }) }
export function useUpdateChips() { const { userId } = useIdentity(); const inv = useInvalidate(); return useMutation({ mutationFn: (v: { gameId: string; chips: number }) => ll.updateChips(v.gameId, userId, v.chips), onSuccess: inv }) }
export function useBust() { const { userId } = useIdentity(); const inv = useInvalidate(); return useMutation({ mutationFn: (v: { gameId: string; target: string }) => ll.bust(v.gameId, v.target, userId), onSuccess: inv }) }
export function useExtendRegLL() { const inv = useInvalidate(); return useMutation({ mutationFn: (v: { gameId: string; closesAt: string }) => ll.extendRegistration(v.gameId, v.closesAt), onSuccess: inv }) }
export function useCloseRegLL() { const inv = useInvalidate(); return useMutation({ mutationFn: (gameId: string) => ll.closeRegistration(gameId), onSuccess: inv }) }
export function useReinstate() { const inv = useInvalidate(); return useMutation({ mutationFn: (v: { gameId: string; target: string }) => ll.reinstate(v.gameId, v.target), onSuccess: inv }) }
export function useCompleteLL() { const inv = useInvalidate(); return useMutation({ mutationFn: (gameId: string) => ll.completeGame(gameId), onSuccess: inv }) }
export function useCancelLL() { const inv = useInvalidate(); return useMutation({ mutationFn: (v: { gameId: string; reason: string }) => ll.cancelGame(v.gameId, v.reason), onSuccess: inv }) }
export function usePostChatLL() { const { userId } = useIdentity(); const inv = useInvalidate(); return useMutation({ mutationFn: (v: { gameId: string; text: string }) => ll.postChat(v.gameId, userId, v.text), onSuccess: inv }) }
export function useProposeChop() { const { userId } = useIdentity(); const inv = useInvalidate(); return useMutation({ mutationFn: (gameId: string) => ll.proposeChop(gameId, userId), onSuccess: inv }) }
export function useAgreeChop() { const { userId } = useIdentity(); const inv = useInvalidate(); return useMutation({ mutationFn: (gameId: string) => ll.agreeChop(gameId, userId), onSuccess: inv }) }
export function useRejectChop() { const { userId } = useIdentity(); const inv = useInvalidate(); return useMutation({ mutationFn: ({ gameId, reason }: { gameId: string; reason: string }) => ll.rejectChop(gameId, userId, reason), onSuccess: inv }) }
export function useCreateGame() { const { userId } = useIdentity(); const inv = useInvalidate(); return useMutation({ mutationFn: (v: { clubId: string; title: string; location: string; mode: 'in-person' | 'online'; stake: number; visibility: 'public' | 'private'; accessUserIds: string[]; closesAt: string; timezone: string; payouts: number[] }) => ll.createGame(v.clubId, userId, { title: v.title, location: v.location, mode: v.mode, stake: v.stake, visibility: v.visibility, accessUserIds: v.accessUserIds, closesAt: v.closesAt, timezone: v.timezone, payouts: v.payouts }), onSuccess: inv }) }
export function useInviteToGame() { const inv = useInvalidate(); return useMutation({ mutationFn: (v: { gameId: string; userIds: string[] }) => ll.inviteToGame(v.gameId, v.userIds), onSuccess: inv }) }
