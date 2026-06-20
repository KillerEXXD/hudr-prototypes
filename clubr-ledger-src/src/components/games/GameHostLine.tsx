import { useNavigate } from 'react-router-dom'
import { Crown } from 'lucide-react'
import { useMemberProfile } from '@/hooks'

/**
 * "hosted by <name>" for a game — so a player always knows who runs it. The name
 * is clickable through to the host's member page. If the host's name is already
 * known on the page (they're in the roster/entries), pass it as `knownName` to
 * skip the profile fetch entirely.
 */
export function GameHostLine({ hostId, knownName }: { hostId: string; knownName?: string }) {
  const navigate = useNavigate()
  // useMemberProfile is disabled for an empty id, so a knownName means no fetch.
  const { data } = useMemberProfile(knownName ? '' : hostId)
  const name = knownName ?? data?.name
  if (!name) return null
  return (
    <span className="inline-flex items-center gap-1 text-xs text-text-muted">
      <Crown className="h-3 w-3 text-accent-amber" />hosted by{' '}
      <button type="button" onClick={() => navigate(`/member/${hostId}`)} className="font-bold text-text-secondary hover:underline cursor-pointer">{name}</button>
    </span>
  )
}
