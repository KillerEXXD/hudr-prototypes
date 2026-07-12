import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/lib/api/referralServices'
import type { RefConfig } from '@/types/referral'

const KEY = ['referral']
function useInvalidate() { const qc = useQueryClient(); return () => qc.invalidateQueries({ queryKey: KEY }) }

// Player
export const useSummary = (userId?: string) =>
  useQuery({ queryKey: [...KEY, 'summary', userId], queryFn: () => api.getSummary(userId!), enabled: !!userId })
export const useReferralDetail = (referralId?: string) =>
  useQuery({ queryKey: [...KEY, 'detail', referralId], queryFn: () => api.getReferralDetail(referralId!), enabled: !!referralId })
export const useResidualDetail = (beneficiaryId?: string, sourceId?: string) =>
  useQuery({ queryKey: [...KEY, 'residual', beneficiaryId, sourceId], queryFn: () => api.getResidualDetail(beneficiaryId!, sourceId!), enabled: !!beneficiaryId && !!sourceId })
export const useWithdrawals = (userId?: string) =>
  useQuery({ queryKey: [...KEY, 'withdrawals', userId], queryFn: () => api.listWithdrawals(userId!), enabled: !!userId })
export function useRequestWithdrawal() {
  const inv = useInvalidate()
  return useMutation({ mutationFn: (v: { userId: string; amountUsd: number; note?: string }) => api.requestWithdrawal(v.userId, v.amountUsd, v.note), onSuccess: inv })
}

// Admin
export const usePlayers = () => useQuery({ queryKey: [...KEY, 'players'], queryFn: api.listPlayers })
export const usePlayerAdmin = (userId?: string) =>
  useQuery({ queryKey: [...KEY, 'playerAdmin', userId], queryFn: () => api.getPlayerAdmin(userId!), enabled: !!userId })
export const useKpis = () => useQuery({ queryKey: [...KEY, 'kpis'], queryFn: api.getKpis })
export const useConfig = () => useQuery({ queryKey: [...KEY, 'config'], queryFn: api.getConfig })
export const useWithdrawalQueue = () => useQuery({ queryKey: [...KEY, 'queue'], queryFn: api.listWithdrawalQueue })

export function useUpdateConfig() { const inv = useInvalidate(); return useMutation({ mutationFn: (c: RefConfig) => api.updateConfig(c), onSuccess: inv }) }
export function useSetOverride() { const inv = useInvalidate(); return useMutation({ mutationFn: (v: { userId: string; override: Partial<RefConfig> | null }) => api.setOverride(v.userId, v.override), onSuccess: inv }) }
export function useDecideWithdrawal() { const inv = useInvalidate(); return useMutation({ mutationFn: (v: { id: string; status: 'approved' | 'rejected' }) => api.decideWithdrawal(v.id, v.status), onSuccess: inv }) }
export function useReverse() { const inv = useInvalidate(); return useMutation({ mutationFn: (purchaseId: string) => api.reverse(purchaseId), onSuccess: inv }) }
export function useSimulate() { const inv = useInvalidate(); return useMutation({ mutationFn: (v: { userId: string; amountUsd: number }) => api.simulate(v.userId, v.amountUsd), onSuccess: inv }) }
