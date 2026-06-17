import { useState } from 'react'
import { Sparkles, Plus, Compass, Gamepad2, LayoutGrid, type LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useRecentClubs, useRequestToJoin, useMyClubs } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Section, Spinner, Btn, EmptyState } from '@/components/common/ui'
import { ClubRow } from '@/components/common/cards'
import { useUnifiedGames } from '@/games/useUnifiedGames'
import { renderUnifiedGame } from '@/games/renderGame'
import { GAME_TYPES, type GameType } from '@/games/types'
import { selectOpenGames } from '@/lib/discoverGames'
import { cn } from '@/lib/utils/cn'
import type { ClubView, MemberRole } from '@/types'

// Both lists stay short so neither buries the other — full lists are one tap away
// ("View all" → the join-clubs page; "See all" → the Games tab).
const CLUBS_CAP = 3
const GAMES_CAP = 4

function RequestButton({ club }: { club: ClubView }) {
  const req = useRequestToJoin()
  return (
    <Btn size="sm" variant="secondary" onClick={() => req.mutate(club.id)} disabled={req.isPending}>
      <Plus className="h-3.5 w-3.5" /> {req.isPending ? '…' : 'Request'}
    </Btn>
  )
}

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
  const clubs = useRecentClubs()
  const myClubs = useMyClubs()
  const { items, isLoading: gamesLoading } = useUnifiedGames()
  const [filter, setFilter] = useState<'all' | GameType>('all')

  // Clubs you can JOIN (you're not in them yet) — near-you first.
  const joinable = (clubs.data ?? []).filter((c) => c.myStatus === 'none')
  const city = user?.location?.trim().toLowerCase()
  const near = city ? joinable.filter((c) => c.location?.trim().toLowerCase() === city) : []
  const others = city ? joinable.filter((c) => c.location?.trim().toLowerCase() !== city) : joinable
  const clubsTop = [...near, ...others].slice(0, CLUBS_CAP)

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
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-accent-blue"><Sparkles className="h-3.5 w-3.5" /> Discover</div>
      <h1 className="text-xl font-extrabold tracking-tight text-text-primary">Hey {user?.name.split(' ')[0]} 👋</h1>
      <p className="text-sm text-text-secondary">New clubs to join, and what's open in clubs you're in.</p>

      {/* Clubs to join — the Discover headline. Capped; full list one tap away. */}
      {clubs.isLoading ? (
        <Section title="Clubs to join"><Spinner /></Section>
      ) : joinable.length === 0 ? (
        <Section title="Clubs to join"><EmptyState icon={<Compass className="h-7 w-7" />} title="You're in every club we know" sub="Create your own from the Clubs tab." /></Section>
      ) : (
        <Section title="Clubs to join" action={joinable.length > CLUBS_CAP ? <SeeAll label={`View all ${joinable.length} →`} onClick={() => navigate('/discover/clubs')} /> : undefined}>
          <div className="flex flex-col gap-2">{clubsTop.map((c) => <ClubRow key={c.id} club={c} right={<RequestButton club={c} />} />)}</div>
        </Section>
      )}

      {/* Open now in YOUR clubs — all game types in one list; capped. */}
      {gamesLoading ? (
        <Section title="Open now in your clubs"><Spinner /></Section>
      ) : openInMyClubs.length > 0 && (
        <Section title="Open now in your clubs" action={ordered.length > GAMES_CAP ? <SeeAll label="See all →" onClick={() => navigate('/games')} /> : undefined}>
          {typesPresent.length > 1 && (
            <div className="mb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
              <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="All" icon={LayoutGrid} />
              {typesPresent.map((t) => <FilterChip key={t.id} active={filter === t.id} onClick={() => setFilter(t.id)} label={t.label} icon={t.icon} activeClass={t.chipActive} />)}
            </div>
          )}
          {gamesTop.length > 0 ? (
            <div className="flex flex-col gap-2">{gamesTop.map((g) => renderUnifiedGame(g, true, roleByClub.get(g.clubId)))}</div>
          ) : (
            <EmptyState icon={<Gamepad2 className="h-7 w-7" />} title="Nothing of that type right now" sub="Try another type, or check back soon." />
          )}
        </Section>
      )}
    </div>
  )
}
