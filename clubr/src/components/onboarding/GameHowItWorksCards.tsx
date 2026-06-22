import { useState } from 'react'
import { ChevronDown, Lock, Plus } from 'lucide-react'
import { GAME_TYPES } from '@/games/types'
import { GAME_EXPLAINER } from '@/games/gameExplainers'
import { HowItWorks } from '@/components/common/HowItWorks'
import { cn } from '@/lib/utils/cn'

/**
 * The three games as beautiful, accent-tinted cards. Tap a card to expand its
 * "how it works" timeline (shared steps from games/gameExplainers). Every card
 * carries a "plays inside a club" badge; an optional Create-a-club CTA closes
 * the set. Reused on the cold-start hub AND the /how-games-work help page.
 */
export function GameHowItWorksCards({ onCreateClub }: { onCreateClub?: () => void } = {}) {
  // First card open by default so first-timers immediately see what "expand" reveals.
  const [open, setOpen] = useState<string | null>(() => GAME_TYPES[0]?.id ?? null)

  return (
    <div className="flex flex-col gap-2.5">
      {GAME_TYPES.map((g) => {
        const ex = GAME_EXPLAINER[g.id]
        const isOpen = open === g.id
        const Icon = g.icon
        return (
          <div key={g.id} className={cn('overflow-hidden rounded-2xl border', g.ring)}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : g.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-bg-surface/40 cursor-pointer"
            >
              <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white', g.iconBg)}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-extrabold text-text-primary">{g.label}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-bg-surface px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-text-muted">
                    <Lock className="h-2.5 w-2.5" />in a club
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-text-muted">{g.sub}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-text-muted">
                {isOpen ? 'Hide' : 'How it works'}
                <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-border/60 bg-bg-card/40 px-3.5 py-3.5">
                <HowItWorks steps={ex.steps} dotBg={ex.dotBg} iconColor={ex.iconColor} />
              </div>
            )}
          </div>
        )
      })}

      {/* Always-visible reminder that games live in a club + an optional host door. */}
      <div className="mt-0.5 rounded-2xl border border-border bg-bg-surface/50 p-3.5">
        <p className="flex items-start gap-2 text-xs leading-snug text-text-secondary">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" />
          <span>Every game is played <strong className="text-text-primary">inside a club</strong> — join one above, or start your own to host.</span>
        </p>
        {onCreateClub && (
          <button
            type="button"
            onClick={onCreateClub}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-bg-card py-2.5 text-sm font-bold text-text-primary transition-colors hover:bg-bg-surface cursor-pointer"
          >
            <Plus className="h-4 w-4" />Create your own club
          </button>
        )}
      </div>
    </div>
  )
}
