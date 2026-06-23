import { useState } from 'react'
import { Sparkles, Gamepad2, LayoutGrid, Info, ChevronDown, type LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMyClubs } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Section, Spinner, EmptyState } from '@/components/common/ui'
import { ClubsToJoinSection } from '@/components/common/ClubsToJoinSection'
import { ClubExplainerCard } from '@/components/onboarding/ClubExplainerCard'
import { GameHowItWorksCards } from '@/components/onboarding/GameHowItWorksCards'
import { NextBestAction } from '@/components/onboarding/NextBestAction'
import { ApprovedBanner } from '@/components/onboarding/ApprovedBanner'
import { useUnifiedGames } from '@/games/useUnifiedGames'
import { renderUnifiedGame } from '@/games/renderGame'
import { GAME_TYPES, type GameType } from '@/games/types'
import { selectOpenGames } from '@/lib/discoverGames'
import { cn } from '@/lib/utils/cn'
import type { MemberRole } from '@/types'

// The games list stays short so it doesn't bury the rest — the full list is one
// tap away ("See all" → the Games tab). Clubs-to-join lives in the shared
// <ClubsToJoinSection/> (identical on the Host home).
const GAMES_CAP = 4

function FilterChip({ active, onClick, label, icon: Icon, activeClass = 'border-accent-blue bg-accent-blue/20 text-accent-blue font-bold ring-1 ring-accent-blue/40' }: { active: boolean; onClick: () => void; label: string; icon: LucideIcon; activeClass?: string }) {
  return (
    <button type="button" onClick={onClick} className={cn('flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1 text-xs cursor-pointer transition-colors', active ? activeClass : 'border-border font-semibold text-text-secondary')}><Icon className="h-3 w-3" />{label}</button>
  )
}

function SeeAll({ onClick, label }: { onClick: () => void; label: string }) {
  return <button type="button" onClick={onClick} className="text-xs font-semibold text-accent-blue cursor-pointer">{label}</button>
}

export function DiscoverPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const myClubs = useMyClubs()
  const { items, isLoading: gamesLoading } = useUnifiedGames()
  const [filter, setFilter] = useState<'all' | GameType>('all')
  // The full how-it-works education collapses into one small disclosure here (a member
  // has already joined a club) — open it only if you want a refresher.
  const [showHow, setShowHow] = useState(false)
  const [howOpenId, setHowOpenId] = useState<string | null>(null)

  // The player's role per joined club — drives the "your clubs" game filter and
  // the per-card Owner / Co-host / Member chip.
  const roleByClub = new Map<string, MemberRole>()
  for (const c of myClubs.data ?? []) if (c.myStatus === 'member' && c.myRole) roleByClub.set(c.id, c.myRole)
  const openInMyClubs = items.filter((g) => !g.finished && roleByClub.has(g.clubId))
  const typesPresent = GAME_TYPES.filter((t) => openInMyClubs.some((g) => g.type === t.id))
  const ordered = selectOpenGames(items, roleByClub, filter) // joinable-first, then live
  const gamesTop = ordered.slice(0, GAMES_CAP)

  return (
    <div className="animate-fade-up">
      {/* Transient "you've been approved to a club/game" nudge (self-hides; shown once). */}
      <ApprovedBanner />
      {/* Onboarding coach — the evolving "what now?" hero (self-hides when there's no step). */}
      <NextBestAction />
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-accent-blue"><Sparkles className="h-3.5 w-3.5" /> Discover</div>
      <h1 className="text-xl font-extrabold tracking-tight text-text-primary">Hey {user?.name.split(' ')[0]} 👋</h1>
      <p className="text-sm text-text-secondary">What's open in your clubs, and new clubs to join.</p>

      {/* Open now in YOUR clubs — leads the member view (real games, all types, capped). */}
      {gamesLoading ? (
        <Section title="Open now in your clubs"><Spinner /></Section>
      ) : openInMyClubs.length > 0 && (
        <Section title="Open now in your clubs" action={ordered.length > GAMES_CAP ? <SeeAll label="See all →" onClick={() => navigate('/games')} /> : undefined}>
          {typesPresent.length > 1 && (
            <div className="mb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
              <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="All" icon={LayoutGrid} />
              {typesPresent.map((t) => <FilterChip key={t.id} active={filter === t.id} onClick={() => setFilter(t.id)} label={t.short} icon={t.icon} activeClass={t.chipActive} />)}
            </div>
          )}
          {gamesTop.length > 0 ? (
            <div className="flex flex-col gap-2">{gamesTop.map((g) => renderUnifiedGame(g, true, roleByClub.get(g.clubId)))}</div>
          ) : (
            <EmptyState icon={<Gamepad2 className="h-7 w-7" />} title="Nothing of that type right now" sub="Try another type, or check back soon." />
          )}
        </Section>
      )}

      {/* Clubs to join — shared section, identical on the Host home. */}
      <ClubsToJoinSection />

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
