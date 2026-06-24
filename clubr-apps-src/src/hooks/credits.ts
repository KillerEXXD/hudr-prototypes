import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import * as credits from '@/lib/api/creditsServices'
import type { CreditPackage, EconomyConfig } from '@/types/credits'

export function useWallet() {
  const { user } = useAuth()
  return useQuery({ queryKey: ['credits', 'wallet', user?.id], queryFn: () => credits.getWallet(user!.id), enabled: !!user })
}
export function useEconomy() {
  return useQuery({ queryKey: ['credits', 'economy'], queryFn: () => credits.getEconomy() })
}

function useInvalidate() { const qc = useQueryClient(); return () => qc.invalidateQueries({ queryKey: ['credits'] }) }

export function useBuyPackage() { const { user } = useAuth(); const inv = useInvalidate(); return useMutation({ mutationFn: (packageId: string) => credits.buyPackage(user!.id, packageId), onSuccess: inv }) }
export function useUpdateCosts() { const inv = useInvalidate(); return useMutation({ mutationFn: (c: EconomyConfig) => credits.updateCosts(c), onSuccess: inv }) }
export function useUpsertPackage() { const inv = useInvalidate(); return useMutation({ mutationFn: (p: CreditPackage) => credits.upsertPackage(p), onSuccess: inv }) }
export function useDeletePackage() { const inv = useInvalidate(); return useMutation({ mutationFn: (id: string) => credits.deletePackage(id), onSuccess: inv }) }
