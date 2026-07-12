import { useState } from 'react'
import { Sparkles, Info, ChevronDown } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ClubExplainerCard } from '@/components/onboarding/ClubExplainerCard'
import { GameHowItWorksCards } from '@/components/onboarding/GameHowItWorksCards'
import { NextBestAction } from '@/components/onboarding/NextBestAction'
import { ApprovedBanner } from '@/components/onboarding/ApprovedBanner'
import { cn } from '@/lib/utils/cn'
import { ClubCarouselPicker } from '@/components/carousel-lab/ClubCarouselPicker'

// Player home. The on-home "Open now in your clubs" games feed and the "Clubs to join"
// section were removed — games live on the Live tab, clubs to join via "Find your club".
export function DiscoverPage() {
  const { user } = useAuth()
  // The full how-it-works education collapses into one small disclosure here (a member
  // has already joined a club) — open it only if you want a refresher.
  const [showHow, setShowHow] = useState(false)
  const [howOpenId, setHowOpenId] = useState<string | null>(null)

  return (
    <div className="animate-fade-up">
      {/* Transient "you've been approved to a club/game" nudge (self-hides; shown once). */}
      <ApprovedBanner />
      {/* Onboarding coach — the evolving "what now?" hero (self-hides when there's no step). */}
      <NextBestAction />
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-accent-blue"><Sparkles className="h-3.5 w-3.5" /> Discover</div>
      <h1 className="text-xl font-extrabold tracking-tight text-text-primary">Hey {user?.name.split(' ')[0]} 👋</h1>
      <p className="text-sm text-text-secondary">Your clubs at a glance.</p>

      {/* Carousel chooser — pick the engine; the selected one renders right here. */}
      <ClubCarouselPicker />

      {/* Lightweight education — a member already knows the basics, so the full
          how-it-works cards collapse into one small "New here?" disclosure. */}
      <div className="mt-5">
        <button type="button" onClick={() => setShowHow((v) => !v)} className="flex w-full items-center justify-between rounded-2xl border border-border bg-bg-card/50 px-4 py-2.5 text-left cursor-pointer transition-colors hover:bg-bg-surface" aria-expanded={showHow}>
          <span className="flex items-center gap-2 text-sm font-bold text-text-secondary"><Info className="h-4 w-4 text-text-muted" />New here? How it works</span>
          <ChevronDown className={cn('h-4 w-4 text-text-muted transition-transform', showHow && 'rotate-180')} />
        </button>
        {showHow && (
          <div className="mt-3 flex flex-col gap-4">
            <ClubExplainerCard open={howOpenId === 'club'} onToggle={() => setHowOpenId(howOpenId === 'club' ? null : 'club')} />
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">The games</p>
              <GameHowItWorksCards openId={howOpenId} onOpen={setHowOpenId} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
