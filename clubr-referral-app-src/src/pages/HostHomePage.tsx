import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Trophy, Clock, ChevronRight, ChevronDown, Info, Plus, UserPlus, Share2, type LucideIcon } from 'lucide-react'
import { useAvailableFTs } from '@/hooks/ft'
import { useMyClubs } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Badge, Section, Spinner } from '@/components/common/ui'
import { GameHowItWorksCards } from '@/components/onboarding/GameHowItWorksCards'
import { ApprovedBanner } from '@/components/onboarding/ApprovedBanner'
import { useUnifiedGames } from '@/games/useUnifiedGames'
import { cn } from '@/lib/utils/cn'
import type { MemberRole } from '@/types'
import { ClubCarouselPicker } from '@/components/carousel-lab/ClubCarouselPicker'

// Host first-run step (onboarding Phase 5) — a numbered row that routes into the club.
function FirstRunStep({ n, icon: Icon, title, sub, onClick }: { n: number; icon: LucideIcon; title: string; sub: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 rounded-2xl border border-border bg-bg-card p-3 text-left transition-colors hover:bg-bg-surface cursor-pointer">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-emerald/15 text-xs font-extrabold text-accent-emerald">{n}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-sm font-bold text-text-primary"><Icon className="h-3.5 w-3.5 text-text-muted" />{title}</span>
        <span className="block text-[11px] text-text-muted">{sub}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
    </button>
  )
}

// Club Host home. The on-home "Clubs to join" + "Games" feed were removed — games live on
// the Live tab, clubs to join via "Find your club". What remains: the FTs-to-host slate,
// the carousel chooser, the first-run checklist, and the "How hosting works" refresher.
export function HostHomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fts = useAvailableFTs()
  const myClubs = useMyClubs()
  const { items } = useUnifiedGames()
  // "How hosting works" — a collapsed refresher (game cards). No how-club-works card
  // and no invite-code panel: a host already knows how to get into a club.
  const [showHow, setShowHow] = useState(false)
  const [howOpenId, setHowOpenId] = useState<string | null>(null)

  // Role per club — drives the FTs-to-host gate.
  const roleByClub = new Map<string, MemberRole>()
  for (const c of myClubs.data ?? []) if (c.myStatus === 'member' && c.myRole) roleByClub.set(c.id, c.myRole)
  // "FTs to host" only makes sense if you manage a club to host them in — hide it
  // from users who don't own any club.
  const hasManagedClub = [...roleByClub.values()].some((r) => r === 'owner')

  // Host first-run (Phase 5): owns/hosts a club but hasn't created a game yet → a
  // 3-step checklist that routes into the club. Collapses once they host a game.
  const hostedGame = items.some((g) => g.iHost)
  const managedClub = (myClubs.data ?? []).find((c) => c.myStatus === 'member' && c.myRole === 'owner')
  const showFirstRun = !!managedClub && !hostedGame

  return (
    <div className="animate-fade-up">
      {/* Transient "you've been approved to a club/game" nudge (self-hides; shown once). */}
      <ApprovedBanner />
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-accent-emerald"><Home className="h-3.5 w-3.5" /> Home</div>
      <h1 className="text-xl font-extrabold tracking-tight text-text-primary">Hey {user?.name.split(' ')[0]} 👋</h1>
      <p className="text-sm text-text-secondary">Upcoming final tables available for you to host as Fantasy games in your club.</p>

      {/* ---- FTs to host — directly under the intro line it belongs to, so the slate the
              subtitle promises is the first thing a host sees (not buried below the
              checklist). Only for club managers, and only when some exist. ---- */}
      {hasManagedClub && (fts.isLoading || (fts.data?.length ?? 0) > 0) && (
      <Section
        title={`FTs to host${fts.data?.length ? ` (${fts.data.length})` : ''}`}
        action={<button onClick={() => navigate('/host-ft')} className="flex items-center gap-0.5 text-xs font-semibold text-accent-purple cursor-pointer">See all <ChevronRight className="h-3.5 w-3.5" /></button>}
      >
        {fts.isLoading ? <Spinner /> : (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {(fts.data ?? []).slice(0, 6).map((f) => (
              <button key={f.id} onClick={() => navigate(`/host-ft?ft=${f.id}`)} className="flex w-44 shrink-0 flex-col rounded-2xl border border-border bg-bg-card p-3 text-left transition-colors hover:bg-bg-surface active:scale-[0.99] cursor-pointer">
                <Badge tone="purple" className="self-start">{f.room}</Badge>
                <p className="mt-1.5 line-clamp-2 text-sm font-bold leading-snug text-text-primary">{f.name}</p>
                <div className="mt-auto pt-2">
                  <div className="flex items-center gap-1 text-[11px] text-text-muted"><Trophy className="h-3 w-3 text-accent-amber" />{f.prizePool}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-text-muted"><Clock className="h-3 w-3" />{f.startsIn} · ICM ✓</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </Section>
      )}

      {/* Carousel chooser — below the FTs slate. Pick the engine; the selected one renders here. */}
      <ClubCarouselPicker />

      {/* ---- Host first-run checklist (Phase 5) — until the club has its first game ---- */}
      {showFirstRun && managedClub && (
        <Section title={`Get ${managedClub.name} going`}>
          <p className="-mt-1 mb-2 text-xs text-text-muted">Your club's ready — three steps to your first game:</p>
          <div className="flex flex-col gap-2">
            <FirstRunStep n={1} icon={Plus} title="Create your first game" sub="Pick a type — FT Fantasy, Last Longer or Squares" onClick={() => navigate(`/club/${managedClub.id}`)} />
            <FirstRunStep n={2} icon={UserPlus} title="Invite your players" sub="Share the club so people can request to join" onClick={() => navigate(`/club/${managedClub.id}`)} />
            <FirstRunStep n={3} icon={Share2} title="Share the join link" sub="Drop it in your WhatsApp / Telegram group" onClick={() => navigate(`/club/${managedClub.id}`)} />
          </div>
        </Section>
      )}

      {/* ---- How hosting works — a collapsed refresher (game cards only; no
              how-club-works card / invite panel — a host knows that already) ---- */}
      <div className="mt-4">
        <button type="button" onClick={() => setShowHow((v) => !v)} className="flex w-full items-center justify-between rounded-2xl border border-border bg-bg-card/50 px-4 py-2.5 text-left cursor-pointer transition-colors hover:bg-bg-surface" aria-expanded={showHow}>
          <span className="flex items-center gap-2 text-sm font-bold text-text-secondary"><Info className="h-4 w-4 text-text-muted" />How hosting works</span>
          <ChevronDown className={cn('h-4 w-4 text-text-muted transition-transform', showHow && 'rotate-180')} />
        </button>
        {showHow && (
          <div className="mt-3">
            <GameHowItWorksCards openId={howOpenId} onOpen={setHowOpenId} />
          </div>
        )}
      </div>
    </div>
  )
}
