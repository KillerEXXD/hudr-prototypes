import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Trophy, Clock, ChevronRight, Crown, Users, LayoutGrid, type LucideIcon } from 'lucide-react'
import { useAvailableFTs } from '@/hooks/ft'
import { useMyClubs } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Badge, Section, Spinner } from '@/components/common/ui'
import { useUnifiedGames, matchesType } from '@/games/useUnifiedGames'
import { renderUnifiedGame } from '@/games/renderGame'
import { GAME_TYPES, type GameType } from '@/games/types'
import { cn } from '@/lib/utils/cn'
import type { MemberRole } from '@/types'

const GAMES_CAP = 4

function FilterChip({ active, onClick, label, icon: Icon, activeClass = 'border-accent-blue bg-accent-blue/20 text-accent-blue font-bold ring-1 ring-accent-blue/40' }: { active: boolean; onClick: () => void; label: string; icon: LucideIcon; activeClass?: string }) {
  return (
    <button type="button" onClick={onClick} className={cn('flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3 py-1 text-xs cursor-pointer transition-colors', active ? activeClass : 'border-border font-semibold text-text-secondary')}><Icon className="h-3 w-3" />{label}</button>
  )
}

// Club Host home. The App-Admin FT slate you can host, then your active games —
// the ones you RUN (owner/co-host) split from other clubs you're just in.
// All game types in one place (FT Fantasy, Last Longer, Squares).
export function HostHomePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fts = useAvailableFTs()
  const myClubs = useMyClubs()
  const { items, isLoading: gamesLoading } = useUnifiedGames()
  const [filter, setFilter] = useState<'all' | GameType>('all')

  // Role per club — chips show owner/co-host on the games you run.
  const roleByClub = new Map<string, MemberRole>()
  for (const c of myClubs.data ?? []) if (c.myStatus === 'member' && c.myRole) roleByClub.set(c.id, c.myRole)

  const active = items.filter((g) => !g.finished)
  const yours = active.filter((g) => g.canManage)
  const others = active.filter((g) => !g.canManage)
  const typesPresent = GAME_TYPES.filter((t) => yours.some((g) => g.type === t.id))
  const yoursShown = yours.filter((g) => matchesType(g, filter))
  const yoursTop = yoursShown.slice(0, GAMES_CAP)

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
              <button key={f.id} onClick={() => navigate('/host-ft')} className="flex w-44 shrink-0 flex-col rounded-2xl border border-border bg-bg-card p-3 text-left transition-colors hover:bg-bg-surface active:scale-[0.99] cursor-pointer">
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
        <button onClick={() => navigate('/host-ft')} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-accent-purple/30 bg-accent-purple/10 px-3 py-2 text-xs font-bold text-accent-purple hover:bg-accent-purple/20 cursor-pointer">
          <Crown className="h-3.5 w-3.5" /> Host a final table
        </button>
      </Section>

      {/* ---- Active games in your clubs (games you run) — all types, capped ---- */}
      <Section title="Active games in your clubs" action={yoursShown.length > GAMES_CAP ? <button type="button" onClick={() => navigate('/games')} className="text-xs font-semibold text-accent-blue cursor-pointer">See all →</button> : undefined}>
        {typesPresent.length > 1 && (
          <div className="mb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
            <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="All" icon={LayoutGrid} />
            {typesPresent.map((t) => <FilterChip key={t.id} active={filter === t.id} onClick={() => setFilter(t.id)} label={t.label} icon={t.icon} activeClass={t.chipActive} />)}
          </div>
        )}
        {gamesLoading ? (
          <Spinner />
        ) : yoursTop.length > 0 ? (
          <div className="flex flex-col gap-2">{yoursTop.map((g) => renderUnifiedGame(g, true, roleByClub.get(g.clubId)))}</div>
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-bg-card/50 px-3 py-4 text-center text-xs text-text-muted">{yours.length > 0 ? 'Nothing of that type right now.' : 'Nothing live in your club right now. Host an FT above, or start a Last Longer.'}</p>
        )}
      </Section>

      {/* ---- Other clubs you're a member of (all types) ---- */}
      {others.length > 0 && (
        <Section title="Other clubs you're in" action={<Badge tone="neutral"><Users className="h-3 w-3" />member</Badge>}>
          <div className="flex flex-col gap-2">{others.map((g) => renderUnifiedGame(g, true, roleByClub.get(g.clubId)))}</div>
        </Section>
      )}
    </div>
  )
}
