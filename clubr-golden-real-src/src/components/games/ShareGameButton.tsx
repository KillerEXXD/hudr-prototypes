import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { Btn } from '@/components/common/ui'
import type { GameInviteType } from '@/lib/contract/gameInvite'

/** Copies a game invite link (`…/#/?game=<type>:<id>`). Anyone who opens it is run
 *  through the full join flow (club-gated) by useApplyInviteOnLogin. */
export function ShareGameButton({ type, gameId, size = 'sm' }: { type: GameInviteType; gameId: string; size?: 'sm' | 'md' }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    const url = `${window.location.origin}${window.location.pathname}#/?game=${type}:${gameId}`
    navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
  }
  return (
    <Btn size={size} variant="secondary" onClick={copy}>
      {copied ? <><Check className="h-3.5 w-3.5" />Link copied</> : <><Share2 className="h-3.5 w-3.5" />Share game</>}
    </Btn>
  )
}
