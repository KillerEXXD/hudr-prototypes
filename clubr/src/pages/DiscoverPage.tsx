import { useState } from 'react'
import { Sparkles, Plus, Compass, Gamepad2, LayoutGrid, type LucideIcon } from 'lucide-react'
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

export function DiscoverPage() {
  const { user } = useAuth()
  const clubs = useRecentClubs()
  const myClubs = useMyClubs()
  const { items, isLoading: gamesLoading } = useUnifiedGames()
  const [showAll, setShowAll] = useState(false)
  const [filter, setFilter] = useState<'all' | GameType>('all')

  // Clubs you can JOIN (you're not in them yet) — discovery, grouped by city.
  const joinable = (clubs.data ?? []).filter((c) => c.myStatus === 'none')
  const city = user?.location?.trim().toLowerCase()
  const near = city ? joinable.filter((c) => c.location?.trim().toLowerCase() === city) : []
  const others = city ? joinable.filter((c) => c.location?.trim().toLowerCase() !== city) : joinable

  // The player's role per joined club — drives both the "your clubs" filter and
  // the per-card Owner / Co-host / Member chip (single source of truth).
  const roleByClub = new Map<string, MemberRole>()
  for (const c of myClubs.data ?? []) if (c.myStatus === 'member' && c.myRole) roleByClub.set(c.id, c.myRole)

  const openInMyClubs = items.filter((g) => !g.finished && roleByClub.has(g.clubId))
  const typesPresent = GAME_TYPES.filter((t) => openInMyClubs.some((g) => g.type === t.id))
  const ordered = selectOpenGames(items, roleByClub, filter)

  return (
    <div className="animate-fade-up">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-accent-blue"><Sparkles className="h-3.5 w-3.5" /> Discover</div>
      <h1 className="text-xl font-extrabold tracking-tight text-text-primary">Hey {user?.name.split(' ')[0]} 👋</h1>
      <p className="text-sm text-text-secondary">Open games in your clubs, and new clubs to join.</p>

      {/* Open now in YOUR clubs — the act-on surface, all game types in one list */}
      {gamesLoading ? (
        <Section title="Open now in your clubs"><Spinner /></Section>
      ) : openInMyClubs.length > 0 && (
        <Section title="Open now in your clubs">
          {typesPresent.length > 1 && (
            <div className="mb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
              <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="All" icon={LayoutGrid} />
              {typesPresent.map((t) => <FilterChip key={t.id} active={filter === t.id} onClick={() => setFilter(t.id)} label={t.label} icon={t.icon} activeClass={t.chipActive} />)}
            </div>
          )}
          {ordered.length > 0 ? (
            <div className="flex flex-col gap-2">{ordered.map((g) => renderUnifiedGame(g, true, roleByClub.get(g.clubId)))}</div>
          ) : (
            <EmptyState icon={<Gamepad2 className="h-7 w-7" />} title="Nothing of that type right now" sub="Try another type, or check back soon." />
          )}
        </Section>
      )}

      {/* New clubs to join */}
      {clubs.isLoading ? (
        <Section title="Clubs to join"><Spinner /></Section>
      ) : joinable.length === 0 ? (
        <Section title="Clubs to join"><EmptyState icon={<Compass className="h-7 w-7" />} title="You're in every club we know" sub="Create your own from the Clubs tab." /></Section>
      ) : (
        <>
          {near.length > 0 && (
            <Section title={`Near you in ${user?.location}`}>
              <div className="flex flex-col gap-2">
                {near.map((c) => <ClubRow key={c.id} club={c} right={<RequestButton club={c} />} />)}
              </div>
            </Section>
          )}
          {others.length > 0 && (
            <Section title={near.length > 0 ? 'More clubs to join' : 'Clubs to join'} action={others.length > 4 ? <button type="button" onClick={() => setShowAll((s) => !s)} className="text-xs font-semibold text-accent-blue cursor-pointer">{showAll ? 'Show less' : 'See all'}</button> : undefined}>
              <div className="flex flex-col gap-2">
                {(showAll ? others : others.slice(0, 4)).map((c) => <ClubRow key={c.id} club={c} right={<RequestButton club={c} />} />)}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  )
}
