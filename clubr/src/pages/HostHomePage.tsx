import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Trophy, Clock, ChevronRight, Gamepad2, LayoutGrid, type LucideIcon } from 'lucide-react'
import { useAvailableFTs } from '@/hooks/ft'
import { useMyClubs } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Badge, Section, Spinner, EmptyState } from '@/components/common/ui'
import { InfiniteList } from '@/components/common/InfiniteList'
import { useUnifiedGames, matchesType, orderActiveGames } from '@/games/useUnifiedGames'
import { renderUnifiedGame } from '@/games/renderGame'
import { GAME_TYPES, type GameType } from '@/games/types'
import { cn } from '@/lib/utils/cn'
import type { MemberRole } from '@/types'

function FilterChip({ active, onClick, label, icon: Icon, activeClass = 'border-accent-blue bg-accent-blue/20 text-accent-blue font-bold ring-1 ring-accent-blue/40' }: { active: boolean; onClick: () => void; label: string; icon: LucideIcon; activeClass?: string }) {
  return (
    <button type="button" onClick={onClick} className={cn('flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1 text-xs cursor-pointer transition-colors', active ? activeClass : 'border-border font-semibold text-text-secondary')}><Icon className="h-3 w-3" />{label}</button>
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
  const [filter, setFilter] = useState<'all' | GameType>('all')

  // Role per club — chips show owner/co-host/member on each card.
  const roleByClub = new Map<string, MemberRole>()
  for (const c of myClubs.data ?? []) if (c.myStatus === 'member' && c.myRole) roleByClub.set(c.id, c.myRole)

  const active = orderActiveGames(items) // closed dropped; reg-open before live
  const typesPresent = GAME_TYPES.filter((t) => active.some((g) => g.type === t.id))
  const shown = active.filter((g) => matchesType(g, filter))

  return (
    <div className="animate-fade-up">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-accent-emerald"><Home className="h-3.5 w-3.5" /> Home</div>
      <h1 className="text-xl font-extrabold tracking-tight text-text-primary">Hey {user?.name.split(' ')[0]} 👋</h1>
      <p className="text-sm text-text-secondary">Upcoming final tables available for you to host as Fantasy games in your club.</p>

      {/* ---- FTs to host (App-Admin slate) ---- */}
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

      {/* ---- One merged feed: Registration-Open then Live, no closed, lazy-loaded ---- */}
      <Section title="Open & live games">
        {typesPresent.length > 1 && (
          <div className="mb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
            <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="All" icon={LayoutGrid} />
            {typesPresent.map((t) => <FilterChip key={t.id} active={filter === t.id} onClick={() => setFilter(t.id)} label={t.short} icon={t.icon} activeClass={t.chipActive} />)}
          </div>
        )}
        {gamesLoading ? (
          <Spinner />
        ) : shown.length > 0 ? (
          <InfiniteList
            items={shown}
            batch={8}
            resetKey={filter}
            className="flex flex-col gap-2"
            renderItem={(g) => renderUnifiedGame(g, true, roleByClub.get(g.clubId))}
          />
        ) : (
          <EmptyState icon={<Gamepad2 className="h-7 w-7" />} title="Nothing open or live right now" sub="Host an FT above, or start a Last Longer / Squares." />
        )}
      </Section>
    </div>
  )
}
