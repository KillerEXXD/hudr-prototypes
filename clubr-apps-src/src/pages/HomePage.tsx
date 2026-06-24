import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Clock, Grid3x3, Plus, ArrowRight, MapPin, CheckCircle2, Sparkles, type LucideIcon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useMyClubs, useRecentClubs } from '@/hooks'
import { useUnifiedGames, type UnifiedGame } from '@/games/useUnifiedGames'
import { APP_REGISTRY, type GameAppId, type GameAppMeta } from '@/games/appRegistry'

/**
 * Apps Home — game icons take centre stage; below them, three thin lists
 * derived from the same mock store every other surface reads:
 *
 *  · Approvals      — things waiting on a decision (pending requests)
 *  · New games      — most recently created across every game-app
 *  · Clubs near you — joinable clubs in the user's city
 *
 * Each list shows TOP 3 with a "See all →" link. Replaces the old generic
 * Clubs-to-join + Notifications strips.
 */
export function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items } = useUnifiedGames()

  // Per-app counts for the icon pips — same canonical games feed.
  const stats = useMemo(() => {
    const byApp: Record<GameAppId, { open: number; live: number; finished: number }> = {
      'fantasy': { open: 0, live: 0, finished: 0 },
      'last-longer': { open: 0, live: 0, finished: 0 },
      'squares': { open: 0, live: 0, finished: 0 },
    }
    const idOf = (g: UnifiedGame): GameAppId | null =>
      g.type === 'ft_fantasy' ? 'fantasy'
      : g.type === 'last_longer' ? 'last-longer'
      : g.type === 'football_squares' ? 'squares' : null
    for (const g of items) {
      const id = idOf(g); if (!id) continue
      if (g.phase === 'reg') byApp[id].open++
      else if (g.phase === 'live') byApp[id].live++
      else if (g.phase === 'closed' && !g.cancelled) byApp[id].finished++
    }
    return byApp
  }, [items])

  return (
    <div className="relative animate-fade-up pb-2">
      <div className="pointer-events-none absolute inset-x-0 -top-2 -z-10 h-[44dvh] overflow-hidden">
        <div className="absolute inset-0 [background:radial-gradient(40%_32%_at_28%_28%,rgba(168,85,247,0.22),transparent_60%),radial-gradient(36%_28%_at_78%_18%,rgba(245,158,11,0.18),transparent_60%),radial-gradient(32%_28%_at_50%_80%,rgba(16,185,129,0.20),transparent_60%)] blur-3xl" />
      </div>

      <Greeting name={user?.name} />

      <div className="mb-7 grid grid-cols-3 gap-y-5 gap-x-2">
        {APP_REGISTRY.map((g) => (
          <AppIcon key={g.id} g={g} stats={stats[g.id]} onOpen={() => navigate(g.route)} />
        ))}
        <MoreSoonIcon />
      </div>

      <ApprovalsStrip />
      <NewGamesStrip games={items} />
      <ClubsNearYouStrip />
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────────

function Greeting({ name }: { name?: string }) {
  const firstName = name?.split(' ')[0] ?? 'there'
  return (
    <div className="mb-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">Welcome back</p>
      <h1 className="font-display text-3xl font-extrabold text-text-primary">{firstName}</h1>
      <p className="mt-1 text-sm text-text-secondary">Tap a game to dive in.</p>
    </div>
  )
}

function AppIcon({ g, stats, onOpen }: { g: GameAppMeta; stats: { open: number; live: number; finished: number }; onOpen: () => void }) {
  const Icon = ICONS[g.id]
  const unread = stats.open + stats.live
  return (
    <button type="button" onClick={onOpen} className="group relative flex cursor-pointer flex-col items-center gap-2">
      <div className="relative">
        <div
          className={`flex h-20 w-20 items-center justify-center rounded-[26%] bg-gradient-to-br ${g.grad} text-white shadow-lg transition-transform group-active:scale-95 sm:h-24 sm:w-24`}
          style={{ boxShadow: `0 14px 32px -8px ${g.glow}, inset 0 1px 0 0 rgba(255,255,255,0.45), inset 0 -2px 0 0 rgba(0,0,0,0.20)` }}
        >
          <Icon className="h-10 w-10 drop-shadow-md" strokeWidth={2} />
        </div>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-accent-red px-1.5 text-[11px] font-extrabold text-white shadow-[0_0_0_3px_rgba(11,20,16,0.95)]">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
        {stats.live > 0 && (
          <span className="absolute -bottom-1 -right-1 flex items-center gap-1 rounded-full bg-accent-emerald px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white shadow-[0_0_0_3px_rgba(11,20,16,0.95)]">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />Live
          </span>
        )}
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-text-primary">{g.label}</p>
        <p className="text-[10px] text-text-muted">{g.sub}</p>
      </div>
    </button>
  )
}

function MoreSoonIcon() {
  return (
    <div className="flex flex-col items-center gap-2 opacity-55">
      <div className="flex h-20 w-20 items-center justify-center rounded-[26%] border-2 border-dashed border-border text-text-muted sm:h-24 sm:w-24">
        <Plus className="h-7 w-7" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-text-secondary">More soon</p>
        <p className="text-[10px] text-text-muted">Add a game</p>
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────────

/** Reusable section card with a title + count + 'See all' affordance. */
function SectionCard({ icon: Icon, title, count, seeAllLabel, onSeeAll, children, emptyText }: {
  icon: LucideIcon
  title: string
  count: number
  seeAllLabel?: string
  onSeeAll?: () => void
  children: React.ReactNode
  emptyText?: string
}) {
  return (
    <div className="mb-3 rounded-2xl border border-border bg-bg-card/60 p-4 backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-text-primary">
          <Icon className="h-4 w-4 text-accent-amber" />
          {title}{count > 0 ? <span className="text-text-muted"> · {count}</span> : null}
        </h3>
        {count > 0 && onSeeAll && (
          <button type="button" onClick={onSeeAll} className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-accent-blue hover:text-accent-blue/80 cursor-pointer">
            {seeAllLabel ?? 'See all'} <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
      {count === 0 ? (
        <p className="rounded-xl bg-bg-surface/40 px-3 py-2.5 text-[12px] text-text-secondary">{emptyText ?? 'Nothing here right now.'}</p>
      ) : children}
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────────

function ApprovalsStrip() {
  const navigate = useNavigate()
  const myClubs = useMyClubs()
  const { items: games } = useUnifiedGames()
  // Pending club join requests + pending game entry requests for the viewer.
  const pendingClubs = (myClubs.data ?? []).filter((c) => c.myStatus === 'pending')
  const pendingGames = games.filter((g) => g.pending)
  type Approval =
    | { kind: 'club'; id: string; title: string; sub: string; emoji?: string; navTo: string }
    | { kind: 'game'; id: string; title: string; sub: string; appId: GameAppId; navTo: string }
  const all: Approval[] = [
    ...pendingClubs.map((c): Approval => ({ kind: 'club', id: c.id, title: c.name, sub: `Awaiting host approval · ${c.location}`, emoji: c.emoji, navTo: `/club/${c.id}` })),
    ...pendingGames.map((g): Approval => {
      const appId = (g.type === 'ft_fantasy' ? 'fantasy' : g.type === 'last_longer' ? 'last-longer' : 'squares') as GameAppId
      const title = g.type === 'ft_fantasy' ? g.ft.ftName : g.type === 'last_longer' ? g.ll.title : g.sq.title
      const club = g.type === 'ft_fantasy' ? g.ft.clubName : g.type === 'last_longer' ? g.ll.clubName : g.sq.clubName
      const route = g.type === 'ft_fantasy' ? `/fantasy/${g.id}` : g.type === 'last_longer' ? `/lastlonger/${g.id}` : `/squares/${g.id}`
      return { kind: 'game', id: g.id, title, sub: `Waiting on ${club} host · ${APP_REGISTRY.find((a) => a.id === appId)?.label}`, appId, navTo: route }
    }),
  ]
  const top = all.slice(0, 3)
  return (
    <SectionCard
      icon={CheckCircle2}
      title="Approvals"
      count={all.length}
      onSeeAll={() => navigate('/discover/clubs')}
      emptyText="No pending approvals — you're all admitted where you've asked."
    >
      <div className="flex flex-col gap-2">
        {top.map((item) => (
          <button key={`${item.kind}-${item.id}`} type="button" onClick={() => navigate(item.navTo)} className="flex items-center gap-3 rounded-xl bg-bg-surface/70 p-2.5 text-left hover:bg-bg-surface cursor-pointer">
            {item.kind === 'club' ? (
              <span className="text-xl">{item.emoji ?? '🃏'}</span>
            ) : (
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${APP_REGISTRY.find((a) => a.id === item.appId)?.grad ?? ''} text-white`}>
                {(() => { const I = ICONS[item.appId]; return <I className="h-3.5 w-3.5" /> })()}
              </span>
            )}
            <span className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-text-primary">{item.title}</p>
              <p className="truncate text-[11px] text-text-muted">{item.sub}</p>
            </span>
            <span className="shrink-0 rounded-full bg-accent-amber/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-accent-amber ring-1 ring-accent-amber/30">Pending</span>
          </button>
        ))}
      </div>
    </SectionCard>
  )
}

// ───────────────────────────────────────────────────────────────────────────

function NewGamesStrip({ games }: { games: UnifiedGame[] }) {
  const navigate = useNavigate()
  // Most-recently-CREATED games (any type, any phase except cancelled).
  const fresh = [...games]
    .filter((g) => !g.cancelled && g.createdAt)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
  const top = fresh.slice(0, 3)
  return (
    <SectionCard
      icon={Sparkles}
      title="New games added"
      count={fresh.length}
      onSeeAll={() => navigate('/fantasy')}
      emptyText="No games created in your clubs yet — be the first."
    >
      <div className="flex flex-col gap-2">
        {top.map((g) => {
          const appId = (g.type === 'ft_fantasy' ? 'fantasy' : g.type === 'last_longer' ? 'last-longer' : 'squares') as GameAppId
          const app = APP_REGISTRY.find((a) => a.id === appId)!
          const Icon = ICONS[appId]
          const title = g.type === 'ft_fantasy' ? g.ft.ftName : g.type === 'last_longer' ? g.ll.title : g.sq.title
          const clubName = g.type === 'ft_fantasy' ? g.ft.clubName : g.type === 'last_longer' ? g.ll.clubName : g.sq.clubName
          const route = appId === 'fantasy' ? `/fantasy/${g.id}` : appId === 'last-longer' ? `/lastlonger/${g.id}` : `/squares/${g.id}`
          return (
            <button key={g.id} type="button" onClick={() => navigate(route)} className="flex items-center gap-3 rounded-xl bg-bg-surface/70 p-2.5 text-left hover:bg-bg-surface cursor-pointer">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${app.grad} text-white`} style={{ boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.35)` }}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-text-primary">{title}</p>
                <p className="truncate text-[11px] text-text-muted">{app.label} · {clubName}{g.createdAt ? ` · ${ago(g.createdAt)}` : ''}</p>
              </span>
              {g.phase === 'live' ? (
                <span className="shrink-0 flex items-center gap-1 rounded-full bg-accent-emerald px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />Live
                </span>
              ) : g.phase === 'reg' ? (
                <span className="shrink-0 rounded-full bg-accent-blue/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-accent-blue ring-1 ring-accent-blue/30">Open</span>
              ) : (
                <span className="shrink-0 rounded-full bg-bg-card px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">Finished</span>
              )}
            </button>
          )
        })}
      </div>
    </SectionCard>
  )
}

// ───────────────────────────────────────────────────────────────────────────

function ClubsNearYouStrip() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const myClubs = useMyClubs()
  const recent = useRecentClubs()
  const myIds = new Set((myClubs.data ?? []).map((c) => c.id))
  const cityOf = (s?: string) => (s ?? '').split(',')[0].trim().toLowerCase()
  const userCity = cityOf(user?.location)
  const all = (recent.data ?? []).filter((c) => !myIds.has(c.id) && userCity && cityOf(c.location) === userCity)
  const top = all.slice(0, 3)
  return (
    <SectionCard
      icon={MapPin}
      title={user?.location ? `Clubs near you in ${user.location.split(',')[0]}` : 'Clubs near you'}
      count={all.length}
      onSeeAll={() => navigate('/discover/clubs')}
      emptyText={user?.location ? `No clubs in ${user.location.split(',')[0]} yet — be the first to start one.` : 'Add your city in /me to see clubs near you.'}
    >
      <div className="flex flex-col gap-2">
        {top.map((c) => (
          <button key={c.id} type="button" onClick={() => navigate(`/club/${c.id}`)} className="flex items-center gap-3 rounded-xl bg-bg-surface/70 p-2.5 text-left hover:bg-bg-surface cursor-pointer">
            <span className="text-xl">{c.emoji ?? '🃏'}</span>
            <span className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-text-primary">{c.name}</p>
              <p className="text-[11px] text-text-muted">{c.location}</p>
            </span>
            <span className="rounded-full bg-accent-blue/15 px-2.5 py-1 text-[11px] font-extrabold text-accent-blue ring-1 ring-accent-blue/30">Request</span>
          </button>
        ))}
      </div>
    </SectionCard>
  )
}

// ───────────────────────────────────────────────────────────────────────────

/** "5 min ago" / "2h ago" / "3 days ago" — small relative formatter. */
function ago(iso?: string): string {
  if (!iso) return ''
  const t = Date.parse(iso); if (Number.isNaN(t)) return ''
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000))
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`
  // Older — fall back to a short date label.
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// ───────────────────────────────────────────────────────────────────────────

const ICONS: Record<GameAppId, LucideIcon> = { 'fantasy': Trophy, 'last-longer': Clock, 'squares': Grid3x3 }
