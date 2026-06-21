import { useNavigate } from 'react-router-dom'
import { ArrowRight, Clock, Gamepad2, Send, Trophy } from 'lucide-react'
import { useMyClubs } from '@/hooks'
import { useUnifiedGames, type UnifiedGame } from '@/games/useUnifiedGames'
import { useOnboardingStage } from '@/hooks/useOnboardingStage'
import { Card } from '@/components/common/ui'
import { cn } from '@/lib/utils/cn'

const gameTitle = (g: UnifiedGame): string =>
  g.type === 'ft_fantasy' ? g.ft.ftName : g.type === 'last_longer' ? g.ll.title : g.sq.title

/**
 * The evolving "what now?" coach card (onboarding Phase 3). One persistent hero at
 * the top of the player Home that changes per stage — always offering exactly one
 * obvious next step. Self-hides at Stage 0 (the Get-Started hub owns that surface)
 * and once the player has no actionable next step.
 */
export function NextBestAction() {
  const { stage } = useOnboardingStage()
  const clubs = useMyClubs()
  const { items } = useUnifiedGames()
  const navigate = useNavigate()

  if (stage === 'fresh') return null
  const myClubs = (clubs.data ?? []).filter((c) => c.myStatus === 'member')
  if (myClubs.length === 0) return null
  const club = myClubs[0]
  const myClubIds = new Set(myClubs.map((c) => c.id))

  const active = items.find((g) => g.mine && !g.pending && !g.finished)
  const pendingGame = items.find((g) => g.mine && g.pending && !g.finished)
  const joinable = items.filter((g) => myClubIds.has(g.clubId) && !g.mine && !g.finished && g.phase === 'reg')

  let icon = Gamepad2, title: string, sub: string, cta: string, onClick: () => void
  if (pendingGame) {
    // Second gate (Phase 4): admitted to the club, now waiting on the game's host.
    icon = Clock; title = `Pending — ${gameTitle(pendingGame)}`; sub = "You're in the club; the host is reviewing your game request"; cta = 'View'; onClick = () => navigate('/games')
  } else if (active) {
    title = 'Your game is on'; sub = `Jump back into ${gameTitle(active)}`; cta = 'Open'; onClick = () => navigate('/games')
  } else if (joinable.length) {
    title = `Join a game in ${club.name}`; sub = `${joinable.length} open to enter right now`; cta = 'See games'; onClick = () => navigate('/games')
  } else if (stage === 'settled') {
    icon = Trophy; title = 'Find your next game'; sub = 'See your result and what’s open now'; cta = 'Games'; onClick = () => navigate('/games')
  } else {
    icon = Send; title = `No games in ${club.name} yet`; sub = 'Your host will open one — get a ping when they do, or invite a friend'; cta = 'Open club'; onClick = () => navigate(`/club/${club.id}`)
  }
  const Icon = icon

  return (
    <Card className={cn('mb-3 flex items-center gap-3 border-accent-blue/30 bg-accent-blue/5')}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-blue/15 text-accent-blue"><Icon className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold text-text-primary">{title}</p>
        <p className="truncate text-[11px] text-text-secondary">{sub}</p>
      </div>
      <button type="button" onClick={onClick} className="flex shrink-0 items-center gap-1 rounded-full bg-accent-blue px-3 py-1.5 text-xs font-bold text-white cursor-pointer">{cta}<ArrowRight className="h-3.5 w-3.5" /></button>
    </Card>
  )
}
