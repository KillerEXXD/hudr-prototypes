import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Compass, ChevronDown, Check, ArrowLeftRight, X } from 'lucide-react'
import { useUnifiedGames } from '@/games/useUnifiedGames'
import { useMyClubs } from '@/hooks'
import { useLeaderboardConfig } from '@/hooks/leaderboard'
import { useAllUsers } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { awardMap, ftAward, llAward, squaresAward } from '@/lib/leaderboard/award'
import { DEFAULT_LEADERBOARD } from '@/types/leaderboard'
import { normalizeCompleted } from '@/lib/llWinnings'
import { cn } from '@/lib/utils/cn'
import type { ClubView } from '@/types'

/**
 * Per-club leaderboard. LP is scoped to a club (the product's real scoring
 * model), so when a user belongs to N clubs they see N separate boards —
 * accessed via the prominent club switcher at the top of the page.
 *
 * Switcher is a single tap target showing the current club + a "tap to
 * switch" affordance (animated chevron, "Switch club" caption). Opens a
 * slide-up sheet with every club the user is in, the user's LP in each one,
 * and a checkmark on the active row.
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
  const [switcherOpen, setSwitcherOpen] = useState(false)

  useEffect(() => {
    if (!selectedId && clubs.length > 0) setSelectedId(clubs[0].id)
  }, [clubs, selectedId])

  // LP per user for one specific club — used by the main board AND by each
  // row in the switcher sheet (showing your LP in every club at a glance).
  const lpForClub = useMemo(() => {
    return (clubId: string): Map<string, number> => {
      const byUser = new Map<string, number>()
      const bump = (uid: string, pts: number) => { if (pts) byUser.set(uid, (byUser.get(uid) ?? 0) + pts) }
      for (const g of games) {
        if (g.phase !== 'closed' || g.cancelled || g.clubId !== clubId) continue
        if (g.type === 'ft_fantasy') for (const [uid, pts] of awardMap(ftAward(g.ft, lpCfg))) bump(uid, pts)
        else if (g.type === 'last_longer') for (const [uid, pts] of awardMap(llAward(normalizeCompleted(g.ll), lpCfg))) bump(uid, pts)
        else if (g.type === 'football_squares') for (const [uid, pts] of awardMap(squaresAward(g.sq, lpCfg))) bump(uid, pts)
      }
      return byUser
    }
  }, [games, lpCfg])

  const rankings = useMemo(() => {
    if (!selectedId) return []
    const lpByUser = lpForClub(selectedId)
    const nameOf = (uid: string) => users.find((u) => u.id === uid)?.name ?? 'Player'
    return [...lpByUser.entries()]
      .map(([uid, total]) => ({ uid, name: nameOf(uid), total, isMe: uid === user?.id }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20)
  }, [selectedId, lpForClub, users, user?.id])

  const selectedClub = clubs.find((c) => c.id === selectedId) ?? null

  return (
    <div className="animate-fade-up">
      <div className="mb-1 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-accent-gold" />
        <h1 className="font-display text-2xl font-extrabold text-text-primary">Leaderboard</h1>
      </div>
      <p className="mb-4 text-sm text-text-secondary">
        LP is scored per club — one leaderboard per club. Use the switcher to flip between them.
      </p>

      {clubs.length === 0 ? (
        <EmptyNoClubs onJoin={() => navigate('/discover/clubs')} />
      ) : (
        <>
          <ClubSwitcherButton
            selected={selectedClub}
            totalClubs={clubs.length}
            onClick={() => setSwitcherOpen(true)}
          />

          {selectedClub && rankings.length === 0 ? (
            <div className="rounded-2xl border border-border bg-bg-card/60 p-8 text-center text-sm text-text-secondary">
              No finished games yet in <b className="text-text-primary">{selectedClub.name}</b>. LP shows here once games settle.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {rankings.map((r, i) => <BoardRow key={r.uid} position={i + 1} name={r.name} total={r.total} isMe={r.isMe} />)}
            </div>
          )}

          <p className="mt-4 text-center text-[11px] text-text-muted">
            Combined across Fantasy + Last Longer + Squares in this club. Same award math the per-game pages use.
          </p>
        </>
      )}

      <ClubSwitcherSheet
        open={switcherOpen}
        clubs={clubs}
        selectedId={selectedId}
        myId={user?.id}
        onPick={(id) => { setSelectedId(id); setSwitcherOpen(false) }}
        onClose={() => setSwitcherOpen(false)}
        lpForClub={lpForClub}
      />
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────────

function ClubSwitcherButton({ selected, totalClubs, onClick }: { selected: ClubView | null; totalClubs: number; onClick: () => void }) {
  if (!selected) return null
  return (
    <button
      type="button"
      onClick={onClick}
      className="group mb-5 flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-border bg-bg-card/80 p-4 text-left backdrop-blur transition-all hover:border-accent-gold/50 hover:bg-bg-surface active:scale-[0.99]"
      style={{ borderColor: selected.color ? `${selected.color}40` : undefined }}
    >
      {/* Big club avatar — color-tinted square. */}
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-lg"
        style={{ background: `linear-gradient(135deg, ${selected.color ?? '#3b82f6'}, ${selected.color ?? '#3b82f6'}88)`, boxShadow: `0 10px 24px -6px ${selected.color ?? '#3b82f6'}66, inset 0 1px 0 0 rgba(255,255,255,0.35)` }}
      >
        {selected.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">Viewing leaderboard</p>
        <p className="truncate font-display text-xl font-extrabold leading-tight text-text-primary">{selected.name}</p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-accent-blue">
          <ArrowLeftRight className="h-3 w-3 transition-transform group-hover:rotate-180" />
          Tap to switch · {totalClubs} club{totalClubs === 1 ? '' : 's'}
        </p>
      </div>
      <ChevronDown className="h-5 w-5 shrink-0 text-text-muted transition-transform group-hover:translate-y-0.5" />
    </button>
  )
}

function ClubSwitcherSheet({ open, clubs, selectedId, myId, onPick, onClose, lpForClub }: {
  open: boolean
  clubs: ClubView[]
  selectedId: string | null
  myId?: string
  onPick: (id: string) => void
  onClose: () => void
  lpForClub: (clubId: string) => Map<string, number>
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl border border-border/60 bg-bg-card/95 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-text-muted/30" />
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-extrabold text-text-primary">Switch club</h2>
            <p className="text-xs text-text-secondary">Pick a club to see its leaderboard — your LP in each club is shown next to its name.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-bg-surface text-text-muted hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {clubs.map((c) => {
            const active = c.id === selectedId
            const myLp = myId ? (lpForClub(c.id).get(myId) ?? 0) : 0
            const memberCount = c.members?.filter((m) => m.status === 'member').length ?? 0
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onPick(c.id)}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-3 rounded-2xl border p-3 text-left transition-colors',
                  active ? 'bg-accent-gold/10' : 'border-border bg-bg-surface/60 hover:bg-bg-surface',
                )}
                style={active ? { borderColor: c.color ?? '#E9C46A' } : undefined}
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
                  style={{ background: `linear-gradient(135deg, ${c.color ?? '#3b82f6'}, ${c.color ?? '#3b82f6'}88)`, boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.30)` }}
                >
                  {c.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-text-primary">{c.name}</p>
                  <p className="truncate text-[11px] text-text-muted">{c.location} · {memberCount} member{memberCount === 1 ? '' : 's'}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="rounded-full bg-accent-gold/15 px-2 py-0.5 font-mono text-[10px] font-extrabold text-accent-gold ring-1 ring-accent-gold/30">
                    {myLp} LP
                  </span>
                  {active && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-accent-emerald">
                      <Check className="h-3 w-3" />Active
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
        <p className="mt-4 text-center text-[11px] text-text-muted">{clubs.length} club{clubs.length === 1 ? '' : 's'} · LP is scored per club</p>
      </div>
    </div>
  )
}

function BoardRow({ position, name, total, isMe }: { position: number; name: string; total: number; isMe: boolean }) {
  const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : null
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border p-3',
        isMe ? 'border-accent-blue/40 bg-accent-blue/10' : 'border-border bg-bg-card',
      )}
    >
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-extrabold',
          medal ? 'bg-transparent text-2xl' : 'bg-accent-gold/15 text-sm text-accent-gold ring-1 ring-accent-gold/30',
        )}
      >
        {medal ?? position}
      </span>
      <span className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-text-primary">
          {name}
          {isMe && <span className="ml-1.5 text-[10px] font-extrabold text-accent-blue">(you)</span>}
        </p>
      </span>
      <span className="shrink-0 rounded-full bg-accent-gold/15 px-2.5 py-1 font-mono text-xs font-extrabold text-accent-gold ring-1 ring-accent-gold/30">
        {total} LP
      </span>
    </div>
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

