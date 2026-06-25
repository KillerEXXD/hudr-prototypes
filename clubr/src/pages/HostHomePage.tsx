import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Trophy, Clock, ChevronRight, ChevronDown, Info, Gamepad2, LayoutGrid, Plus, UserPlus, Share2, type LucideIcon } from 'lucide-react'
import { useAvailableFTs } from '@/hooks/ft'
import { useMyClubs } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Badge, Section, Spinner, EmptyState } from '@/components/common/ui'
import { InfiniteList } from '@/components/common/InfiniteList'
import { ClubsToJoinSection } from '@/components/common/ClubsToJoinSection'
import { GameHowItWorksCards } from '@/components/onboarding/GameHowItWorksCards'
import { ApprovedBanner } from '@/components/onboarding/ApprovedBanner'
import { RelationshipPills } from '@/components/games/RelationshipPills'
import { useUnifiedGames, matchesType, orderActiveGames } from '@/games/useUnifiedGames'
import { relationshipOf, defaultRelationship, relationshipPills, type Relationship } from '@/games/gameRelationship'
import { renderUnifiedGame } from '@/games/renderGame'
import { GAME_TYPES, type GameType } from '@/games/types'
import { cn } from '@/lib/utils/cn'
import type { MemberRole } from '@/types'

function FilterChip({ active, onClick, label, icon: Icon, activeClass = 'border-accent-blue bg-accent-blue/20 text-accent-blue font-bold ring-1 ring-accent-blue/40' }: { active: boolean; onClick: () => void; label: string; icon: LucideIcon; activeClass?: string }) {
  return (
    <button type="button" onClick={onClick} className={cn('flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1 text-xs cursor-pointer transition-colors', active ? activeClass : 'border-border font-semibold text-text-secondary')}><Icon className="h-3 w-3" />{label}</button>
  )
}

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

// Club Host home. The App-Admin FT slate you can host, then ONE merged feed of
// every active game you can see — games you run AND clubs you're a member of.
// Registration-Open first, then Live; CLOSED games are dropped. No cap — the list
// lazy-renders (load more on scroll). The per-card chip shows host vs member.
export function HostHomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fts = useAvailableFTs()
  const myClubs = useMyClubs()
  const { items, isLoading: gamesLoading } = useUnifiedGames()
  const [rel, setRel] = useState<Relationship>(defaultRelationship(true)) // host home → 'hosting'
  const [filter, setFilter] = useState<'all' | GameType>('all')
  const pickRel = (r: Relationship) => { setRel(r); setFilter('all') } // type chips reset per bucket
  // "How hosting works" — a collapsed refresher (game cards). No how-club-works card
  // and no invite-code panel: a host already knows how to get into a club.
  const [showHow, setShowHow] = useState(false)
  const [howOpenId, setHowOpenId] = useState<string | null>(null)

  // Role per club — chips show owner/member on each card.
  const roleByClub = new Map<string, MemberRole>()
  for (const c of myClubs.data ?? []) if (c.myStatus === 'member' && c.myRole) roleByClub.set(c.id, c.myRole)
  // "FTs to host" only makes sense if you manage a club to host them in — hide it
  // from users who don't own any club.
  const hasManagedClub = [...roleByClub.values()].some((r) => r === 'owner')

  const active = orderActiveGames(items) // closed dropped; reg-open before running
  const counts = { available: 0, playing: 0, hosting: 0 }
  for (const g of active) { const r = relationshipOf(g); if (r) counts[r]++ }
  const anyGames = active.length > 0
  // Host first-run (Phase 5): owns/hosts a club but hasn't created a game yet → a
  // 3-step checklist that routes into the club. Collapses once they host a game.
  const hostedGame = items.some((g) => g.iHost)
  const managedClub = (myClubs.data ?? []).find((c) => c.myStatus === 'member' && c.myRole === 'owner')
  const showFirstRun = !!managedClub && !hostedGame
  // Only buckets with data are shown; if the selected one is empty, fall back to
  // the first non-empty pill so the visible tab always has games.
  const effectiveRel = counts[rel] > 0 ? rel : (relationshipPills(true).find((r) => counts[r] > 0) ?? rel)
  const byRel = active.filter((g) => relationshipOf(g) === effectiveRel)
  const typesPresent = GAME_TYPES.filter((t) => byRel.some((g) => g.type === t.id))
  const shown = byRel.filter((g) => matchesType(g, filter))

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

      {/* ---- Clubs to join (shared, identical on the Player Discover home) ---- */}
      <ClubsToJoinSection />

      {/* ---- Games: relationship pills (only buckets with data) + type chips, lazy.
              The whole section is hidden when there are no active games at all. ---- */}
      {gamesLoading ? (
      <Section title="Games"><Spinner /></Section>
      ) : anyGames ? (
      <Section title="Games">
        <RelationshipPills value={effectiveRel} onChange={pickRel} isHost counts={counts} hideEmpty />
        {typesPresent.length > 1 && (
          <div className="mt-2 flex gap-1.5 overflow-x-auto no-scrollbar">
            <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="All" icon={LayoutGrid} />
            {typesPresent.map((t) => <FilterChip key={t.id} active={filter === t.id} onClick={() => setFilter(t.id)} label={t.short} icon={t.icon} activeClass={t.chipActive} />)}
          </div>
        )}
        <div className="mt-2">
          {shown.length > 0 ? (
            <InfiniteList
              items={shown}
              batch={8}
              resetKey={`${effectiveRel}:${filter}`}
              className="flex flex-col gap-2"
              renderItem={(g) => renderUnifiedGame(g, true, roleByClub.get(g.clubId))}
            />
          ) : (
            <EmptyState icon={<Gamepad2 className="h-7 w-7" />} title="Nothing of that type right now" sub="Try another type above." />
          )}
        </div>
      </Section>
      ) : null}
    </div>
  )
}
