import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Compass } from 'lucide-react'
import { useUnifiedGames } from '@/games/useUnifiedGames'
import { useMyClubs } from '@/hooks'
import { useLeaderboardConfig } from '@/hooks/leaderboard'
import { useAllUsers } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { awardMap, ftAward, llAward, squaresAward } from '@/lib/leaderboard/award'
import { DEFAULT_LEADERBOARD } from '@/types/leaderboard'
import { normalizeCompleted } from '@/lib/llWinnings'
import { cn } from '@/lib/utils/cn'

/**
 * Per-club leaderboards. LP is scoped to a club (the product's actual
 * scoring model), so when the user belongs to N clubs they see N
 * leaderboards — selectable via the picker chips at the top.
 *
 * For the selected club we run the same award math the per-game detail
 * surfaces use (ftAward / llAward / squaresAward), summed across every
 * finished game in that one club, all game types combined.
 */
export function LeaderboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items: games } = useUnifiedGames()
  const myClubs = useMyClubs()
  const lpCfg = useLeaderboardConfig().data ?? DEFAULT_LEADERBOARD
  const users = useAllUsers().data ?? []
  const clubs = (myClubs.data ?? []).filter((c) => c.myStatus === 'member')
  const [selectedId, setSelectedId] = useState<string | null>(clubs[0]?.id ?? null)

  // If the clubs list arrives after first render, seed the selection.
  useEffect(() => {
    if (!selectedId && clubs.length > 0) setSelectedId(clubs[0].id)
  }, [clubs, selectedId])

  const rankings = useMemo(() => {
    if (!selectedId) return []
    const byUser = new Map<string, number>()
    const bump = (uid: string, pts: number) => {
      if (!pts) return
      byUser.set(uid, (byUser.get(uid) ?? 0) + pts)
    }
    for (const g of games) {
      if (g.phase !== 'closed' || g.cancelled) continue
      if (g.clubId !== selectedId) continue
      if (g.type === 'ft_fantasy') {
        for (const [uid, pts] of awardMap(ftAward(g.ft, lpCfg))) bump(uid, pts)
      } else if (g.type === 'last_longer') {
        for (const [uid, pts] of awardMap(llAward(normalizeCompleted(g.ll), lpCfg))) bump(uid, pts)
      } else if (g.type === 'football_squares') {
        for (const [uid, pts] of awardMap(squaresAward(g.sq, lpCfg))) bump(uid, pts)
      }
    }
    const nameOf = (uid: string) => users.find((u) => u.id === uid)?.name ?? 'Player'
    return [...byUser.entries()]
      .map(([uid, total]) => ({ uid, name: nameOf(uid), total, isMe: uid === user?.id }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20)
  }, [games, lpCfg, users, user?.id, selectedId])

  const selectedClub = clubs.find((c) => c.id === selectedId) ?? null

  return (
    <div className="animate-fade-up">
      <div className="mb-1 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-accent-gold" />
        <h1 className="font-display text-2xl font-extrabold text-text-primary">Leaderboard</h1>
      </div>
      <p className="mb-4 text-sm text-text-secondary">
        LP is scored per club — one leaderboard per club you're in. Tap a club to see its standings.
      </p>

      {clubs.length === 0 ? (
        <EmptyNoClubs onJoin={() => navigate('/discover/clubs')} />
      ) : (
        <>
          {/* Club picker chips */}
          <div className="mb-4 flex gap-1.5 overflow-x-auto no-scrollbar">
            {clubs.map((c) => (
              <ClubChip
                key={c.id}
                emoji={c.emoji}
                name={c.name}
                color={c.color}
                active={c.id === selectedId}
                onClick={() => setSelectedId(c.id)}
              />
            ))}
          </div>

          {/* Selected-club board */}
          {selectedClub && rankings.length === 0 ? (
            <div className="rounded-2xl border border-border bg-bg-card/60 p-8 text-center text-sm text-text-secondary">
              No finished games yet in {selectedClub.name}. Once games settle, LP shows up here.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {rankings.map((r, i) => {
                const position = i + 1
                const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : null
                return (
                  <div
                    key={r.uid}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border p-3',
                      r.isMe ? 'border-accent-blue/40 bg-accent-blue/10' : 'border-border bg-bg-card',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-extrabold',
                        medal
                          ? 'bg-transparent text-2xl'
                          : 'bg-accent-gold/15 text-sm text-accent-gold ring-1 ring-accent-gold/30',
                      )}
                    >
                      {medal ?? position}
                    </span>
                    <span className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-text-primary">
                        {r.name}
                        {r.isMe && <span className="ml-1.5 text-[10px] font-extrabold text-accent-blue">(you)</span>}
                      </p>
                    </span>
                    <span className="shrink-0 rounded-full bg-accent-gold/15 px-2.5 py-1 font-mono text-xs font-extrabold text-accent-gold ring-1 ring-accent-gold/30">
                      {r.total} LP
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          <p className="mt-4 text-center text-[11px] text-text-muted">
            Combined across Fantasy + Last Longer + Squares in this club. Same award math the per-game pages use.
          </p>
        </>
      )}
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────────

function ClubChip({ emoji, name, color, active, onClick }: { emoji?: string; name: string; color?: string; active: boolean; onClick: () => void }) {
  // Active chip tints with the club's color (each Club has a `color` token);
  // inactive chips stay neutral so the active one stands out.
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold transition-colors',
        active ? 'text-white shadow-md' : 'border-border bg-bg-card text-text-secondary hover:bg-bg-surface',
      )}
      style={active && color ? { backgroundColor: color, borderColor: color } : undefined}
    >
      <span className="text-sm leading-none">{emoji ?? '🃏'}</span>
      {name}
    </button>
  )
}

function EmptyNoClubs({ onJoin }: { onJoin: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-bg-card/60 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-gold/15 text-accent-gold">
        <Compass className="h-7 w-7" />
      </div>
      <div>
        <p className="font-bold text-text-primary">Join a club to start scoring</p>
        <p className="mt-1 text-xs text-text-secondary">LP is scored per club — once you're a member of one, your standings show up here.</p>
      </div>
      <button
        type="button"
        onClick={onJoin}
        className="mt-1 cursor-pointer rounded-full bg-accent-blue px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-accent-blue/30 hover:bg-blue-600"
      >
        Find a club to join
      </button>
    </div>
  )
}
