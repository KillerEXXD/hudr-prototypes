import { useState } from 'react'
import { Gamepad2, Plus } from 'lucide-react'
import { useContests } from '@/hooks/ft'
import { useGames } from '@/hooks/ll'
import { useMyClubs } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Section, Spinner, EmptyState } from '@/components/common/ui'
import { regDeadline } from '@/components/common/Countdown'
import { ContestRow } from '@/pages/FantasyPage'
import { GameRow } from '@/pages/LastLongerPage'
import { NewGameSheet } from '@/components/games/NewGameSheet'
import { cn } from '@/lib/utils/cn'
import type { FTContestView } from '@/types/ft'
import type { LLGameView } from '@/types/ll'

// Unified games feed across all game types (FT Fantasy, Last Longer, …) — the
// single surface that replaces the per-game bottom tabs. Game type is a filter
// chip + a card badge, never a nav slot. Adding a type adds a chip + a card
// variant; this page's plumbing doesn't change.

type Filter = 'all' | 'ft_fantasy' | 'last_longer'
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ft_fantasy', label: 'FT Fantasy' },
  { id: 'last_longer', label: 'Last Longer' },
]

type ActiveItem =
  | { kind: 'ft'; c: FTContestView; sort: number }
  | { kind: 'll'; g: LLGameView; sort: number }

function renderRow(x: ActiveItem) {
  return x.kind === 'ft' ? <ContestRow key={`ft_${x.c.id}`} c={x.c} /> : <GameRow key={`ll_${x.g.id}`} g={x.g} />
}

export function GamesPage() {
  const { user } = useAuth()
  const contests = useContests()
  const games = useGames()
  const myClubs = useMyClubs()
  const canHost = (myClubs.data ?? []).some((c) => c.canManage)
  const isAdmin = user?.role === 'admin'
  const [filter, setFilter] = useState<Filter>('all')
  const [newOpen, setNewOpen] = useState(false)

  const isLoading = contests.isLoading || games.isLoading
  const showFt = filter !== 'last_longer'
  const showLl = filter !== 'ft_fantasy'

  const ft = contests.data ?? []
  const ll = games.data ?? []

  // ---- active games (not finished), merged + sorted by urgency (live first, then by close time) ----
  const active: ActiveItem[] = [
    ...(showFt ? ft.filter((c) => c.status !== 'settled').map((c) => ({ kind: 'ft' as const, c, sort: regDeadline(c.id, c.locksAtTs) })) : []),
    ...(showLl ? ll.filter((g) => g.status !== 'completed').map((g) => ({ kind: 'll' as const, g, sort: g.status === 'live' ? 0 : regDeadline(g.id, g.registrationClosesAt) })) : []),
  ].sort((a, b) => a.sort - b.sort)

  const hosting = active.filter((x) => (x.kind === 'ft' ? x.c.canManage : x.g.canManage))
  const playing = active.filter((x) => !(x.kind === 'ft' ? x.c.canManage : x.g.canManage))

  // ---- completed (your results only) ----
  const done: ActiveItem[] = [
    ...(showFt ? ft.filter((c) => c.status === 'settled' && (c.myEntry != null || c.canManage)).map((c) => ({ kind: 'ft' as const, c, sort: 0 })) : []),
    ...(showLl ? ll.filter((g) => g.status === 'completed' && (g.me != null || g.canManage)).map((g) => ({ kind: 'll' as const, g, sort: 0 })) : []),
  ]

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
      <p className="mt-1 text-sm text-text-secondary">Everything happening across your clubs — FT Fantasy &amp; Last Longer, all in one place.</p>

      {/* type filter */}
      <div className="mt-3 flex gap-1.5">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" onClick={() => setFilter(f.id)} className={cn('rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer', filter === f.id ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : 'border-border text-text-secondary')}>{f.label}</button>
        ))}
      </div>

      {isLoading ? <Spinner /> : (
        <>
          {hosting.length > 0 && (
            <Section title="You're hosting"><div className="flex flex-col gap-2">{hosting.map(renderRow)}</div></Section>
          )}
          {playing.length > 0 && (
            <Section title={hosting.length > 0 ? 'Open & live' : 'Open & live games'}><div className="flex flex-col gap-2">{playing.map(renderRow)}</div></Section>
          )}
          {hosting.length + playing.length === 0 && (
            <Section title="Games"><EmptyState icon={<Gamepad2 className="h-7 w-7" />} title="Nothing live right now" sub={canHost && !isAdmin ? 'Tap “New game” to host one.' : 'Join a club and check back when your host starts a game.'} /></Section>
          )}
          {done.length > 0 && (
            <Section title={`Completed (${done.length})`}><div className="flex flex-col gap-2">{done.map(renderRow)}</div></Section>
          )}
        </>
      )}

      <NewGameSheet open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  )
}
