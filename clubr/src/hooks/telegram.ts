import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import * as tg from '@/lib/api/telegramServices'

export function useClubTelegram(clubId: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['telegram', clubId, user?.id],
    queryFn: () => tg.getTelegramStatus(clubId, user!.id),
    enabled: !!clubId && !!user,
  })
}

function useInvalidate(clubId: string) {
  const qc = useQueryClient()
  return () => { qc.invalidateQueries({ queryKey: ['telegram', clubId] }); qc.invalidateQueries({ queryKey: ['club', clubId] }) }
}

export function useConnectChannel(clubId: string) {
  const inv = useInvalidate(clubId)
  return useMutation({ mutationFn: (v: { link: string; title: string }) => tg.connectChannel(clubId, v.link, v.title), onSuccess: inv })
}
export function useDisconnectChannel(clubId: string) {
  const inv = useInvalidate(clubId)
  return useMutation({ mutationFn: () => tg.disconnectChannel(clubId), onSuccess: inv })
}
export function useLinkTelegram(clubId: string) {
  const { user } = useAuth()
  const inv = useInvalidate(clubId)
  return useMutation({ mutationFn: (handle?: string) => tg.linkTelegram(user!.id, handle), onSuccess: inv })
}
export function useJoinChannel(clubId: string) {
  const { user } = useAuth()
  const inv = useInvalidate(clubId)
  return useMutation({ mutationFn: () => tg.joinChannel(clubId, user!.id), onSuccess: inv })
}
