import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Radio, Flag, LayoutGrid, type LucideIcon } from 'lucide-react'
import { Badge, Section, Spinner, EmptyState } from '@/components/common/ui'
import { InfiniteList } from '@/components/common/InfiniteList'
import { GAME_TYPES, type GameType } from '@/games/types'
import { useUnifiedGames, matchesType } from '@/games/useUnifiedGames'
import { orderActiveTab, orderCompleted } from '@/games/gameOrdering'
import { renderUnifiedGame } from '@/games/renderGame'
import { isLiveForMe, isFinishedForMe } from '@/games/liveBuckets'
import { cn } from '@/lib/utils/cn'

// "Live" is the player/host home for games: every game you're IN that hasn't ended
// — admitted & playing, waiting on approval (pending), or hosting/co-hosting — plus a
// "Finished" history (completed/settled + cancelled). New/available games are NOT here
// (you find those inside a club). Live is sorted newest-joined first.

type View = 'live' | 'finished'

function Chip({ active, onClick, label, icon: Icon, activeClass = 'border-accent-blue bg-accent-blue/20 text-accent-blue font-bold ring-1 ring-accent-blue/40' }: { active: boolean; onClick: () => void; label: string; icon: LucideIcon; activeClass?: string }) {
  return (
    <button type="button" onClick={onClick} className={cn('flex items-center gap-1 rounded-full border px-3 py-1 text-xs cursor-pointer transition-colors', active ? activeClass : 'border-transparent font-semibold text-text-secondary')}><Icon className="h-3 w-3" />{label}</button>
  )
}

export function LivePage() {
  const [params, setParams] = useSearchParams()
  const view: View = params.get('view') === 'finished' ? 'finished' : 'live'
  const typeParam = params.get('type')
  const filter: 'all' | GameType = typeParam === 'all' || GAME_TYPES.some((t) => t.id === typeParam) ? (typeParam as 'all' | GameType) : 'all'
  const setView = (v: View) => setParams((p) => { const n = new URLSearchParams(p); n.set('view', v); n.set('type', 'all'); return n }, { replace: true })
  const setFilter = (f: 'all' | GameType) => setParams((p) => { const n = new URLSearchParams(p); n.set('type', f); return n }, { replace: true })

  // Refetch the three game lists on every visit so counts + lists reflect games that
  // arrived while away — not the 30s-stale cache.
  const qc = useQueryClient()
  useEffect(() => {
    qc.invalidateQueries({ queryKey: ['ft', 'list'] })
    qc.invalidateQueries({ queryKey: ['ll', 'list'] })
    qc.invalidateQueries({ queryKey: ['sq', 'list'] })
  }, [qc])

  const { isLoading, items } = useUnifiedGames()
  const showAll = filter === 'all'

  const live = orderActiveTab(items.filter(isLiveForMe).filter((g) => matchesType(g, filter)), 'playing')
  const finished = orderCompleted(items.filter(isFinishedForMe).filter((g) => matchesType(g, filter)))
  const liveTotal = items.filter(isLiveForMe).length
  const finishedTotal = items.filter(isFinishedForMe).length

  return (
    <div className="animate-fade-up">
      <h1 className="flex items-center gap-1.5 text-xl font-extrabold tracking-tight text-text-primary"><Radio className="h-5 w-5 text-accent-blue" />Live</h1>
      <p className="mt-1 text-sm text-text-secondary">Every game you're in or hosting — and how your finished ones went.</p>

      {/* Live / Finished + type filter */}
      <div className="mt-3 flex gap-1.5">
        <Chip active={view === 'live'} onClick={() => setView('live')} label={liveTotal ? `Live · ${liveTotal}` : 'Live'} icon={Radio} />
        <Chip active={view === 'finished'} onClick={() => setView('finished')} label={finishedTotal ? `Finished · ${finishedTotal}` : 'Finished'} icon={Flag} />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')} label="All" icon={LayoutGrid} />
        {GAME_TYPES.map((t) => <Chip key={t.id} active={filter === t.id} onClick={() => setFilter(t.id)} label={t.short} icon={t.icon} activeClass={t.chipActive} />)}
      </div>

      {isLoading ? <Spinner /> : (
        <Section title={view === 'finished' ? 'Finished' : 'Live'}>
          {view === 'finished' ? (
            finished.length > 0 ? (
              <InfiniteList items={finished} batch={8} resetKey={`finished:${filter}`} className="flex flex-col gap-2" renderItem={(g) => (
                <div key={g.id} className="flex flex-col gap-1">
                  <Badge tone={g.cancelled ? 'red' : g.canManage ? 'purple' : 'green'} className="self-start">{g.cancelled ? 'Cancelled' : g.canManage ? 'You hosted' : 'You played'}</Badge>
                  {renderUnifiedGame(g, showAll)}
                </div>
              )} />
            ) : (
              <EmptyState icon={<Flag className="h-7 w-7" />} title="No finished games yet" sub="Your completed and cancelled games show here." />
            )
          ) : (
            live.length > 0 ? (
              <InfiniteList items={live} batch={8} resetKey={`live:${filter}`} className="flex flex-col gap-2" renderItem={(g) => {
                const hosting = g.iHost || g.iCoHost
                const waiting = g.mine && g.pending && !hosting
                return (
                  <div key={g.id} className="flex flex-col gap-1">
                    {(hosting || waiting) && <Badge tone={hosting ? 'purple' : 'amber'} className="self-start">{hosting ? 'Hosting' : 'Waiting approval'}</Badge>}
                    {renderUnifiedGame(g, showAll)}
                  </div>
                )
              }} />
            ) : (
              <EmptyState icon={<Radio className="h-7 w-7" />} title="No live games right now" sub="Games you join or host show up here." />
            )
          )}
        </Section>
      )}
    </div>
  )
}
