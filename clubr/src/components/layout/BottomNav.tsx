import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Plus } from 'lucide-react'
import { useOnboardingStage } from '@/hooks/useOnboardingStage'
import { useUnifiedGames } from '@/games/useUnifiedGames'
import { isLiveForMe, isFinishedForMe, isInProgressForMe } from '@/games/liveBuckets'
import { LiveIcon } from '@/components/common/LiveIcon'
import { NewGameSheet } from '@/components/games/NewGameSheet'
import { cn } from '@/lib/utils/cn'

/**
 * The bottom nav is a raised center "+" FAB (ALWAYS present — the single entry point
 * for creating a club or a game) with a tiny progressive bar around it:
 *   • Stage 0 (no club) → just the "+".
 *   • Has a club → Home · + · Live.
 * No Clubs/Games/Me tabs: profile is the Header avatar, and your clubs + "find new
 * clubs" live in the Home "Your clubs" carousel.
 *
 * The Live tab is smart: it opens the games you're in (Live), or your history
 * (Finished) when nothing is live, or — when you have no games at all — shows a
 * transient "No live games right now" popup without navigating anywhere.
 */
export function BottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { unlockedTabs } = useOnboardingStage()
  const showHome = unlockedTabs.includes('home')
  const showLive = unlockedTabs.includes('live')

  // Live counts drive the tap behavior.
  const { items } = useUnifiedGames()
  const liveCount = items.filter(isLiveForMe).length
  const finishedCount = items.filter(isFinishedForMe).length
  // Pulse the red dot only when a game is actually rolling (phase 'live'); else grey.
  const inProgress = items.some(isInProgressForMe)

  const [createOpen, setCreateOpen] = useState(false)
  const [noLive, setNoLive] = useState(false)
  useEffect(() => {
    if (!noLive) return
    const id = window.setTimeout(() => setNoLive(false), 2400)
    return () => window.clearTimeout(id)
  }, [noLive])

  const homeActive = pathname === '/' || pathname.startsWith('/host-ft')
  const liveActive = pathname.startsWith('/live') || pathname.startsWith('/games') || pathname.startsWith('/fantasy') || pathname.startsWith('/lastlonger') || pathname.startsWith('/squares')

  const onLive = () => {
    if (liveCount > 0) navigate('/live?view=live')
    else if (finishedCount > 0) navigate('/live?view=finished')
    else setNoLive(true)
  }

  return (
    <>
      <nav className="sticky bottom-0 z-30 border-t border-border bg-bg-secondary/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="relative mx-auto flex max-w-md items-stretch">
          {/* Left: Home */}
          <div className="flex flex-1 items-stretch">
            {showHome && <NavBtn active={homeActive} onClick={() => navigate('/')} icon={Home} label="Home" />}
          </div>
          {/* Center "+" FAB — raised, accent, always present. */}
          <div className="flex shrink-0 items-center justify-center px-4">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              aria-label="Create"
              title="Create a club or a game"
              className="-mt-5 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-accent-blue text-white shadow-lg shadow-accent-blue/40 ring-4 ring-bg-secondary transition-transform active:scale-95"
            >
              <Plus className="h-7 w-7" strokeWidth={2.6} />
            </button>
          </div>
          {/* Right: Live — smart tap (opens Live/Finished, or a popup when you have no games). */}
          <div className="relative flex flex-1 items-stretch">
            {showLive && (
              <button
                type="button"
                onClick={onLive}
                className={cn('flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-semibold transition-colors cursor-pointer', liveActive ? 'text-accent-blue' : 'text-text-muted hover:text-text-secondary')}
              >
                {/* Broadcast "Live" icon (red centre dot) — like Home, in the same selected
                    pill. Animates only when a game is actually in progress; else static. */}
                <span className={cn('flex items-center justify-center rounded-full px-3.5 py-1 transition-colors', liveActive && 'bg-accent-blue/12')}>
                  <LiveIcon size={22} strokeWidth={2} animate={inProgress} />
                </span>
                Live
              </button>
            )}
            {noLive && (
              <div className="pointer-events-none absolute -top-11 right-1 z-10 whitespace-nowrap rounded-lg bg-bg-card px-3 py-1.5 text-xs font-semibold text-text-primary shadow-lg ring-1 ring-border animate-fade-up">
                No live games right now
              </div>
            )}
          </div>
        </div>
      </nav>

      <NewGameSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}

function NavBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Home; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-semibold transition-colors cursor-pointer', active ? 'text-accent-blue' : 'text-text-muted hover:text-text-secondary')}
    >
      {/* The active tab's icon sits in a subtle accent pill — the selected cue. */}
      <span className={cn('flex items-center justify-center rounded-full px-3.5 py-1 transition-colors', active && 'bg-accent-blue/12')}>
        <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 2} />
      </span>
      {label}
    </button>
  )
}
