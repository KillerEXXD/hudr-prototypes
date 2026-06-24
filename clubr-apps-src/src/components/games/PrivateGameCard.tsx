import { useNavigate } from 'react-router-dom'
import { Lock, ChevronLeft } from 'lucide-react'
import { Card, Btn } from '@/components/common/ui'
import type { PrivateGameInfo } from '@/lib/api/privateGame'

/**
 * Shown when a game exists but the viewer can't see it because it's private and
 * they aren't invited/joined — instead of a dead "Game not found". Names the club
 * and its owner so the player knows who to ask, and points them at the club to
 * request access.
 */
export function PrivateGameCard({ info }: { info: PrivateGameInfo }) {
  const navigate = useNavigate()
  return (
    <div className="animate-fade-up">
      <button onClick={() => navigate('/')} className="mb-2 flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary cursor-pointer"><ChevronLeft className="h-4 w-4" />Back</button>
      <Card className="mt-2 flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-surface text-text-muted"><Lock className="h-6 w-6" /></div>
        <h1 className="text-xl font-extrabold tracking-tight text-text-primary">This is a private game</h1>
        <p className="max-w-sm text-sm text-text-secondary">
          It's in <b className="text-text-primary">{info.clubName}</b>, hosted by <b className="text-text-primary">{info.ownerName}</b>.
          Private games are invite-only — ask <b className="text-text-primary">{info.ownerName}</b> to add you, or request to join the club first.
        </p>
        <Btn className="mt-1" onClick={() => navigate(`/club/${info.clubId}`)}>Request to join {info.clubName}</Btn>
      </Card>
    </div>
  )
}
