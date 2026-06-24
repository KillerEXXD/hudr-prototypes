import { useMemo, useState } from 'react'
import { BarChart3, Trophy, Clock, Grid3x3 } from 'lucide-react'
import { useUnifiedGames, type UnifiedGame } from '@/games/useUnifiedGames'
import { useLeaderboardConfig } from '@/hooks/leaderboard'
import { useAllUsers } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { awardMap, ftAward, llAward, squaresAward } from '@/lib/leaderboard/award'
import { DEFAULT_LEADERBOARD } from '@/types/leaderboard'
import { normalizeCompleted } from '@/lib/llWinnings'
import { cn } from '@/lib/utils/cn'

type Filter = 'all' | 'fantasy' | 'last-longer' | 'squares'

/**
 * Combined LP leaderboard across every game-app. Uses the SAME award math as
 * the per-game detail surfaces (ftAward / llAward / squaresAward) so the
 * Apps shell stays accurate with the rest of the prototype — no demo data.
 *
 * Filter chips re-slice: "All" combines every finished game; per-game chips
 * isolate just that game type. Each row shows position + medal, name, total
 * LP, and a small breakdown chip ("FT 12 · LL 8").
 */
export function LeaderboardPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const { items } = useUnifiedGames()
  const { user } = useAuth()
  const lpCfg = useLeaderboardConfig().data ?? DEFAULT_LEADERBOARD
  const users = useAllUsers().data ?? []

  // Aggregate LP per user per game type from every CLOSED game in the feed.
  const rankings = useMemo(() => {
    const byUser = new Map<string, { fantasy: number; 'last-longer': number; squares: number }>()
    const bump = (uid: string, kind: 'fantasy' | 'last-longer' | 'squares', pts: number) => {
      if (!pts) return
      const cur = byUser.get(uid) ?? { fantasy: 0, 'last-longer': 0, squares: 0 }
      cur[kind] += pts
      byUser.set(uid, cur)
    }
    for (const g of items) {
      if (g.phase !== 'closed' || g.cancelled) continue
      if (g.type === 'ft_fantasy') {
        for (const [uid, pts] of awardMap(ftAward(g.ft, lpCfg))) bump(uid, 'fantasy', pts)
      } else if (g.type === 'last_longer') {
        for (const [uid, pts] of awardMap(llAward(normalizeCompleted(g.ll), lpCfg))) bump(uid, 'last-longer', pts)
      } else if (g.type === 'football_squares') {
        for (const [uid, pts] of awardMap(squaresAward(g.sq, lpCfg))) bump(uid, 'squares', pts)
      }
    }
    const nameOf = (uid: string) => users.find((u) => u.id === uid)?.name ?? 'Player'
    return [...byUser.entries()]
      .map(([uid, breakdown]) => ({
        uid,
        name: nameOf(uid),
        total: breakdown.fantasy + breakdown['last-longer'] + breakdown.squares,
        breakdown,
        isMe: uid === user?.id,
      }))
      .filter((row) => filter === 'all' ? row.total > 0 : row.breakdown[filter] > 0)
      .sort((a, b) => {
        if (filter === 'all') return b.total - a.total
        return b.breakdown[filter] - a.breakdown[filter]
      })
      .slice(0, 20)
  }, [items, lpCfg, users, user?.id, filter])

  return (
    <div className="animate-fade-up">
      <h1 className="mb-1 font-display text-2xl font-extrabold text-text-primary">Leaderboard</h1>
      <p className="mb-4 text-sm text-text-secondary">Combined LP across every game-app — same math the per-game pages use.</p>

      <div className="mb-4 flex gap-1.5 overflow-x-auto no-scrollbar">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} icon={BarChart3} label="All" />
        <FilterChip active={filter === 'fantasy'} onClick={() => setFilter('fantasy')} icon={Trophy} label="Fantasy" hue="purple" />
        <FilterChip active={filter === 'last-longer'} onClick={() => setFilter('last-longer')} icon={Clock} label="Last Longer" hue="amber" />
        <FilterChip active={filter === 'squares'} onClick={() => setFilter('squares')} icon={Grid3x3} label="Squares" hue="emerald" />
      </div>

      {rankings.length === 0 ? (
        <div className="rounded-2xl border border-border bg-bg-card/60 p-6 text-center text-sm text-text-secondary">
          No finished games yet for {filter === 'all' ? 'any app' : filter}. Once games settle, LP shows here.
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {rankings.map((r, i) => {
            const position = i + 1
            const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : null
            const displayPts = filter === 'all' ? r.total : r.breakdown[filter]
            return (
              <div key={r.uid} className={cn('flex items-center gap-3 rounded-xl border p-3', r.isMe ? 'border-accent-blue/40 bg-accent-blue/10' : 'border-border bg-bg-card')}>
                <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-extrabold', medal ? 'bg-transparent text-2xl' : 'bg-accent-gold/15 text-sm text-accent-gold ring-1 ring-accent-gold/30')}>
                  {medal ?? position}
                </span>
                <span className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-text-primary">
                    {r.name}
                    {r.isMe && <span className="ml-1.5 text-[10px] font-extrabold text-accent-blue">(you)</span>}
                  </p>
                  {filter === 'all' && (
                    <p className="truncate text-[10px] text-text-muted">
                      {r.breakdown.fantasy > 0 && <>Fantasy {r.breakdown.fantasy}</>}
                      {r.breakdown.fantasy > 0 && (r.breakdown['last-longer'] > 0 || r.breakdown.squares > 0) && <> · </>}
                      {r.breakdown['last-longer'] > 0 && <>LL {r.breakdown['last-longer']}</>}
                      {r.breakdown['last-longer'] > 0 && r.breakdown.squares > 0 && <> · </>}
                      {r.breakdown.squares > 0 && <>Squares {r.breakdown.squares}</>}
                    </p>
                  )}
                </span>
                <span className="shrink-0 rounded-full bg-accent-gold/15 px-2.5 py-1 font-mono text-xs font-extrabold text-accent-gold ring-1 ring-accent-gold/30">
                  {displayPts} LP
                </span>
              </div>
            )
          })}
        </div>
      )}

      <p className="mt-4 text-center text-[11px] text-text-muted">
        Same award math as the per-game pages — pulls from every finished game in the mock store.
      </p>
    </div>
  )
}

function FilterChip({ active, onClick, icon: Icon, label, hue }: { active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; label: string; hue?: 'purple' | 'amber' | 'emerald' }) {
  const tones = {
    purple: 'from-purple-500 via-fuchsia-500 to-pink-500',
    amber: 'from-amber-400 via-orange-500 to-rose-500',
    emerald: 'from-emerald-400 via-teal-500 to-cyan-500',
  } as const
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold transition-colors',
        active
          ? hue
            ? `bg-gradient-to-r ${tones[hue]} border-transparent text-white shadow-md`
            : 'bg-accent-gold/20 border-accent-gold/40 text-accent-gold'
          : 'border-border bg-bg-card text-text-secondary hover:bg-bg-surface',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}
