// React Query hooks — the only thing components use to read/write data.
// Each wraps a service function and threads in the current user from auth.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import * as api from '@/lib/api/services'
import * as memberApi from '@/lib/api/memberServices'

function useIdentity() {
  const { user } = useAuth()
  return { userId: user?.id ?? '', isAdmin: user?.role === 'admin' }
}

export function useRecentClubs() {
  const { userId, isAdmin } = useIdentity()
  return useQuery({ queryKey: ['clubs', 'recent', userId], queryFn: () => api.listRecentClubs(userId, isAdmin) })
}

export function useMyClubs() {
  const { userId, isAdmin } = useIdentity()
  return useQuery({ queryKey: ['clubs', 'mine', userId], queryFn: () => api.listMyClubs(userId, isAdmin) })
}

export function useClub(clubId: string) {
  const { userId, isAdmin } = useIdentity()
  return useQuery({ queryKey: ['club', clubId, userId], queryFn: () => api.getClub(clubId, userId, isAdmin), enabled: !!clubId })
}

export function useMemberProfile(memberId: string) {
  const { userId, isAdmin } = useIdentity()
  return useQuery({ queryKey: ['member', memberId, userId], queryFn: () => memberApi.getMemberProfile(memberId, userId, isAdmin), enabled: !!memberId })
}

export function useAllClubs() {
  return useQuery({ queryKey: ['admin', 'clubs'], queryFn: () => api.listAllClubs() })
}

export function useAllUsers() {
  return useQuery({ queryKey: ['admin', 'users'], queryFn: () => api.listAllUsers() })
}

function useInvalidateClubs() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['clubs'] })
    qc.invalidateQueries({ queryKey: ['club'] })
    qc.invalidateQueries({ queryKey: ['admin'] })
  }
}

export function useRequestToJoin() {
  const { userId } = useIdentity()
  const invalidate = useInvalidateClubs()
  return useMutation({ mutationFn: (clubId: string) => api.requestToJoin(clubId, userId), onSuccess: invalidate })
}

export function useJoinViaInvite() {
  const { userId } = useIdentity()
  const invalidate = useInvalidateClubs()
  return useMutation({ mutationFn: (code: string) => api.joinViaInvite(code, userId), onSuccess: invalidate })
}

export function useCreateClub() {
  const { userId } = useIdentity()
  const invalidate = useInvalidateClubs()
  return useMutation({ mutationFn: (input: { name: string; emoji: string; description: string }) => api.createClub(input, userId), onSuccess: invalidate })
}

export function useApproveMember() {
  const invalidate = useInvalidateClubs()
  return useMutation({ mutationFn: (v: { clubId: string; userId: string }) => api.approveMember(v.clubId, v.userId), onSuccess: invalidate })
}

export function useRejectMember() {
  const invalidate = useInvalidateClubs()
  return useMutation({ mutationFn: (v: { clubId: string; userId: string }) => api.rejectMember(v.clubId, v.userId), onSuccess: invalidate })
}
