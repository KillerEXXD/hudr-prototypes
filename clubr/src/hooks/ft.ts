import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import * as ft from '@/lib/api/ftServices'

function useIdentity() {
  const { user } = useAuth()
  return { userId: user?.id ?? '', isAdmin: user?.role === 'admin' }
}

export function useContests() {
  const { userId, isAdmin } = useIdentity()
  return useQuery({ queryKey: ['ft', 'list', userId], queryFn: () => ft.listContests(userId, isAdmin) })
}

export function useContest(id: string) {
  const { userId, isAdmin } = useIdentity()
  return useQuery({ queryKey: ['ft', 'one', id, userId], queryFn: () => ft.getContest(id, userId, isAdmin), enabled: !!id })
}

function useInvalidate() {
  const qc = useQueryClient()
  return () => { qc.invalidateQueries({ queryKey: ['ft'] }); qc.invalidateQueries({ queryKey: ['credits'] }) }
}

export function useRequestEnter() {
  const { userId } = useIdentity(); const inv = useInvalidate()
  return useMutation({ mutationFn: (contestId: string) => ft.requestEnter(contestId, userId), onSuccess: inv })
}
export function useApproveEntry() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: (v: { contestId: string; userId: string }) => ft.approveEntry(v.contestId, v.userId), onSuccess: inv })
}
export function useDeclineEntry() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: (v: { contestId: string; userId: string }) => ft.declineEntry(v.contestId, v.userId), onSuccess: inv })
}
export function useTogglePaid() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: (v: { contestId: string; userId: string }) => ft.togglePaid(v.contestId, v.userId), onSuccess: inv })
}
export function useAssignCoHost() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: (v: { contestId: string; userId: string }) => ft.assignCoHost(v.contestId, v.userId), onSuccess: inv })
}
export function useSavePicks() {
  const { userId } = useIdentity(); const inv = useInvalidate()
  return useMutation({ mutationFn: (v: { contestId: string; picks: string[] }) => ft.savePicks(v.contestId, userId, v.picks), onSuccess: inv })
}
export function useExtendRegFT() { const inv = useInvalidate(); return useMutation({ mutationFn: (v: { contestId: string; closesAt: string }) => ft.extendRegistration(v.contestId, v.closesAt), onSuccess: inv }) }
export function useCloseRegFT() { const inv = useInvalidate(); return useMutation({ mutationFn: (contestId: string) => ft.closeRegistration(contestId), onSuccess: inv }) }
export function usePostChat() {
  const { userId } = useIdentity(); const inv = useInvalidate()
  return useMutation({ mutationFn: (v: { contestId: string; text: string }) => ft.postChat(v.contestId, userId, v.text), onSuccess: inv })
}
export function useAvailableFTs() {
  return useQuery({ queryKey: ['ft', 'available'], queryFn: () => ft.listAvailableFTs() })
}
export function useAddAvailableFT() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: (v: Parameters<typeof ft.addAvailableFT>[0]) => ft.addAvailableFT(v), onSuccess: inv })
}
export function useCreateContest() {
  const { userId } = useIdentity(); const inv = useInvalidate()
  return useMutation({ mutationFn: (v: { clubId: string; ftId: string; stake: number; budget: number; visibility: 'public' | 'private'; accessUserIds: string[]; closesAt: string; timezone: string; payouts: number[] }) => ft.createContest(v.clubId, userId, { ftId: v.ftId, stake: v.stake, budget: v.budget, visibility: v.visibility, accessUserIds: v.accessUserIds, closesAt: v.closesAt, timezone: v.timezone, payouts: v.payouts }), onSuccess: inv })
}
export function useInviteToContest() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: (v: { contestId: string; userIds: string[] }) => ft.inviteToContest(v.contestId, v.userIds), onSuccess: inv })
}
