import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Gamepad2, Plus, LayoutGrid, type LucideIcon } from 'lucide-react'
import { useMyClubs } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Badge, Section, Spinner, EmptyState } from '@/components/common/ui'
import { InfiniteList } from '@/components/common/InfiniteList'
import { RelationshipPills } from '@/components/games/RelationshipPills'
import { NewGameSheet } from '@/components/games/NewGameSheet'
import { GAME_TYPES, type GameType } from '@/games/types'
import { useUnifiedGames, matchesType } from '@/games/useUnifiedGames'
import { orderActiveTab, orderCompleted } from '@/games/gameOrdering'
import { relationshipOf, defaultRelationship, relationshipPills, type Relationship } from '@/games/gameRelationship'
import { renderUnifiedGame as renderGame } from '@/games/renderGame'
import { cn } from '@/lib/utils/cn'

// Unified games feed across all game types. Active games are sliced by the
// relationship pill (Available · Playing · Hosting); Completed is its own section.

function FilterChip({ active, onClick, label, icon: Icon, activeClass = 'border-accent-blue bg-accent-blue/20 text-accent-blue font-bold ring-1 ring-accent-blue/40' }: { active: boolean; onClick: () => void; label: string; icon: LucideIcon; activeClass?: string }) {
  return (
    <button type="button" onClick={onClick} className={cn('flex items-center gap-1 rounded-full border px-3 py-1 text-xs cursor-pointer transition-colors', active ? activeClass : 'border-border font-semibold text-text-secondary')}><Icon className="h-3 w-3" />{label}</button>
  )
}

export function GamesPage() {
  const { user } = useAuth()
  const myClubs = useMyClubs()
  const canHost = (myClubs.data ?? []).some((c) => c.canManage)
  const isAdmin = user?.role === 'admin'
  const isHost = canHost || isAdmin
  // Keep the active filter in the URL so navigating into a game and pressing Back
  // returns to the exact pill the user was on (component state would reset to the
  // default). Written with `replace` so filter changes don't pile up in history.
  const [params, setParams] = useSearchParams()
  const allowedRels = relationshipPills(isHost) as string[]
  const relParam = params.get('rel')
  const rel: Relationship = relParam && allowedRels.includes(relParam) ? (relParam as Relationship) : defaultRelationship(isHost)
  const typeParam = params.get('type')
  const filter: 'all' | GameType = typeParam === 'all' || GAME_TYPES.some((t) => t.id === typeParam) ? (typeParam as 'all' | GameType) : 'all'
  const setFilter = (f: 'all' | GameType) => setParams((p) => { const n = new URLSearchParams(p); n.set('type', f); return n }, { replace: true })
  const pickRel = (r: Relationship) => setParams((p) => { const n = new URLSearchParams(p); n.set('rel', r); n.set('type', 'all'); return n }, { replace: true })
  const [newOpen, setNewOpen] = useState(false)

  const { isLoading, items } = useUnifiedGames()
  const showAll = filter === 'all'

  // Active games (non-closed), bucketed by relationship + type, then ordered per tab:
  // Available = latest created · Playing/Hosting = latest joined (host falls back to created).
  const active = items.filter((g) => g.phase !== 'closed')
  const counts = { available: 0, playing: 0, hosting: 0 }
  for (const g of active) { const r = relationshipOf(g); if (r) counts[r]++ }
  const shownActive = orderActiveTab(active.filter((g) => relationshipOf(g) === rel).filter((g) => matchesType(g, filter)), rel)

  // Completed (history): yours/hosted, latest completed first, with a "Hosted / Played" tag.
  const done = orderCompleted(items.filter((g) => g.finished && (g.mine || g.canManage)).filter((g) => matchesType(g, filter)))

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between gap-2">
        <h1 className="flex items-center gap-1.5 text-xl font-extrabold tracking-tight text-text-primary"><Gamepad2 className="h-5 w-5 text-accent-blue" />Games</h1>
        {canHost && !isAdmin && (
          <button type="button" onClick={() => setNewOpen(true)} className="flex shrink-0 items-center gap-1 rounded-full bg-accent-blue px-3 py-1.5 text-xs font-bold text-white transition-transform active:scale-95 cursor-pointer">
            <Plus className="h-3.5 w-3.5" />New game
          </button>
        )}
      </div>
      <p className="mt-1 text-sm text-text-secondary">Everything happening across your clubs — all game types in one place.</p>

      {/* relationship pill + type filter */}
      <div className="mt-3"><RelationshipPills value={rel} onChange={pickRel} isHost={isHost} counts={counts} /></div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="All" icon={LayoutGrid} />
        {GAME_TYPES.map((t) => <FilterChip key={t.id} active={filter === t.id} onClick={() => setFilter(t.id)} label={t.short} icon={t.icon} activeClass={t.chipActive} />)}
      </div>

      {isLoading ? <Spinner /> : (
        <>
          <Section title="Games">
            {shownActive.length > 0 ? (
              <InfiniteList items={shownActive} batch={8} resetKey={`${rel}:${filter}`} className="flex flex-col gap-2" renderItem={(g) => renderGame(g, showAll)} />
            ) : (
              <EmptyState
                icon={<Gamepad2 className="h-7 w-7" />}
                title={rel === 'hosting' ? "You're not hosting any games right now" : rel === 'playing' ? "You're not playing in any games yet" : 'No games available to join right now'}
                sub={rel === 'hosting' && canHost && !isAdmin ? 'Tap “New game” to host one.' : 'Check the other tabs above.'}
              />
            )}
          </Section>
          {done.length > 0 && (
            <Section title={`Completed (${done.length})`}>
              <div className="flex flex-col gap-2">
                {done.map((g) => (
                  <div key={g.id} className="flex flex-col gap-1">
                    <Badge tone={g.canManage ? 'purple' : 'green'} className="self-start">{g.canManage ? 'You hosted' : 'You played'}</Badge>
                    {renderGame(g, showAll)}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </>
      )}

      <NewGameSheet open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  )
}
