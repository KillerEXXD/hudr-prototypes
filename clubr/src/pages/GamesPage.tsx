import { useState } from 'react'
import { Gamepad2, Plus } from 'lucide-react'
import { useMyClubs } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Section, Spinner, EmptyState } from '@/components/common/ui'
import { NewGameSheet } from '@/components/games/NewGameSheet'
import { GAME_TYPES, type GameType } from '@/games/types'
import { useUnifiedGames, matchesType } from '@/games/useUnifiedGames'
import { renderUnifiedGame as renderGame } from '@/games/renderGame'
import { cn } from '@/lib/utils/cn'

// Unified games feed across all game types — the single surface that replaces
// the per-game bottom tabs. Driven by the game-type registry + useUnifiedGames,
// so a new type plugs in via the registry + a render case in renderUnifiedGame.

function FilterChip({ active, onClick, label, activeClass = 'border-accent-blue bg-accent-blue/10 text-accent-blue' }: { active: boolean; onClick: () => void; label: string; activeClass?: string }) {
  return (
    <button type="button" onClick={onClick} className={cn('rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer', active ? activeClass : 'border-border text-text-secondary')}>{label}</button>
  )
}

export function GamesPage() {
  const { user } = useAuth()
  const myClubs = useMyClubs()
  const canHost = (myClubs.data ?? []).some((c) => c.canManage)
  const isAdmin = user?.role === 'admin'
  const [filter, setFilter] = useState<'all' | GameType>('all')
  const [newOpen, setNewOpen] = useState(false)

  const { isLoading, items } = useUnifiedGames()
  const shown = items.filter((g) => matchesType(g, filter))
  const active = shown.filter((g) => !g.finished)
  const hosting = active.filter((g) => g.canManage)
  const playing = active.filter((g) => !g.canManage)
  const done = shown.filter((g) => g.finished && (g.mine || g.canManage))

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

      {/* type filter — driven by the registry */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} label="All" />
        {GAME_TYPES.map((t) => <FilterChip key={t.id} active={filter === t.id} onClick={() => setFilter(t.id)} label={t.label} activeClass={t.chipActive} />)}
      </div>

      {isLoading ? <Spinner /> : (
        <>
          {hosting.length > 0 && <Section title="You're hosting"><div className="flex flex-col gap-2">{hosting.map(renderGame)}</div></Section>}
          {playing.length > 0 && <Section title={hosting.length > 0 ? 'Open & live' : 'Open & live games'}><div className="flex flex-col gap-2">{playing.map(renderGame)}</div></Section>}
          {hosting.length + playing.length === 0 && (
            <Section title="Games"><EmptyState icon={<Gamepad2 className="h-7 w-7" />} title="Nothing live right now" sub={canHost && !isAdmin ? 'Tap “New game” to host one.' : 'Join a club and check back when your host starts a game.'} /></Section>
          )}
          {done.length > 0 && <Section title={`Completed (${done.length})`}><div className="flex flex-col gap-2">{done.map(renderGame)}</div></Section>}
        </>
      )}

      <NewGameSheet open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  )
}
