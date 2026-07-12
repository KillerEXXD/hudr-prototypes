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

// ---- Notifications (header bell) ----
export function useNotifications() {
  const { user } = useAuth()
  return useQuery({ queryKey: ['notifications', user?.id], queryFn: () => api.listNotifications(), enabled: !!user })
}

function useInvalidateNotifications() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['notifications'] })
}

export function useMarkNotificationRead() {
  const invalidate = useInvalidateNotifications()
  return useMutation({ mutationFn: (id: string) => api.markNotificationRead(id), onSuccess: invalidate })
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateNotifications()
  return useMutation({ mutationFn: () => api.markAllNotificationsRead(), onSuccess: invalidate })
}

/** Spin up the caller's two demo clubs + 6 free games. Returns Rookie HQ's id to
 *  navigate into. Invalidates everything — the seed touches clubs + all 3 game lists. */
export function useSeedDemo() {
  const { userId } = useIdentity()
  const qc = useQueryClient()
  return useMutation({ mutationFn: () => api.seedDemoClubs(userId), onSuccess: () => qc.invalidateQueries() })
}

/** Remove the caller's demo clubs + all their games. */
export function useRemoveDemo() {
  const { userId } = useIdentity()
  const qc = useQueryClient()
  return useMutation({ mutationFn: () => api.removeDemoClubs(userId), onSuccess: () => qc.invalidateQueries() })
}

export function useCreateClub() {
  const { userId } = useIdentity()
  const { refreshUser } = useAuth()
  const invalidate = useInvalidateClubs()
  return useMutation({ mutationFn: (input: { name: string; emoji: string; description: string; location?: string; visibility?: 'public' | 'private'; telegram?: boolean }) => api.createClub(input, userId), onSuccess: () => { invalidate(); refreshUser() } })
}

export function useSetClubVisibility() {
  const invalidate = useInvalidateClubs()
  return useMutation({ mutationFn: (v: { clubId: string; visibility: 'public' | 'private' }) => api.setClubVisibility(v.clubId, v.visibility), onSuccess: invalidate })
}

export function useApproveMember() {
  const invalidate = useInvalidateClubs()
  return useMutation({ mutationFn: (v: { clubId: string; userId: string }) => api.approveMember(v.clubId, v.userId), onSuccess: invalidate })
}

export function useRejectMember() {
  const invalidate = useInvalidateClubs()
  return useMutation({ mutationFn: (v: { clubId: string; userId: string }) => api.rejectMember(v.clubId, v.userId), onSuccess: invalidate })
}

// ---- Lifecycle mutations (see plans/776-...md) ----

export function usePreviewLeaveClub() {
  return useMutation({ mutationFn: (v: { clubId: string; userId: string }) => api.previewLeaveClub(v.clubId, v.userId) })
}

export function useLeaveClub() {
  const invalidate = useInvalidateClubs()
  return useMutation({ mutationFn: (v: { clubId: string; userId: string }) => api.leaveClub(v.clubId, v.userId), onSuccess: invalidate })
}

export function useRemoveMember() {
  const invalidate = useInvalidateClubs()
  return useMutation({ mutationFn: (v: { clubId: string; userId: string }) => api.removeMember(v.clubId, v.userId), onSuccess: invalidate })
}

export function useAddOwner() {
  const invalidate = useInvalidateClubs()
  return useMutation({ mutationFn: (v: { clubId: string; userId: string; callerUserId: string }) => api.addOwner(v.clubId, v.userId, v.callerUserId), onSuccess: invalidate })
}

export function useRemoveOwner() {
  const invalidate = useInvalidateClubs()
  return useMutation({ mutationFn: (v: { clubId: string; userId: string; callerUserId: string }) => api.removeOwner(v.clubId, v.userId, v.callerUserId), onSuccess: invalidate })
}

export function useDissolveClub() {
  const invalidate = useInvalidateClubs()
  return useMutation({ mutationFn: (v: { clubId: string; callerUserId: string }) => api.dissolveClub(v.clubId, v.callerUserId), onSuccess: invalidate })
}

export function usePreviewDeleteAccount() {
  return useMutation({ mutationFn: (v: { userId: string }) => api.previewDeleteAccount(v.userId) })
}

export function useDeleteAccount() {
  const invalidate = useInvalidateClubs()
  return useMutation({ mutationFn: (v: { userId: string }) => api.deleteAccount(v.userId), onSuccess: invalidate })
}
