import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Clock, Grid3x3, Plus, Bell, ArrowRight, Compass } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useMyClubs, useNotifications, useRecentClubs } from '@/hooks'
import { useUnifiedGames } from '@/games/useUnifiedGames'
import type { UnifiedGame } from '@/games/useUnifiedGames'
import { APP_REGISTRY, type GameAppId, type GameAppMeta } from '@/games/appRegistry'

/**
 * Apps-style Home. The 3 game icons are the page's hero — each tile is
 * computed LIVE from the mock store (useUnifiedGames filtered by type)
 * so unread + live pips reflect real state. Below the grid, two thin
 * scaffolding strips: clubs you can join + your latest notifications.
 *
 * Adding a 4th game = 1 entry in src/games/appRegistry.ts. The icon,
 * Create-sheet picker, and route binding all pick it up automatically.
 */
export function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items } = useUnifiedGames()

  // Per-game-app counts derived from the same canonical games feed every
  // other variant reads — Open (registration-open), Live, Finished (last 30
  // days). Counts then drive the unread pip + "Live" badge on each icon.
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
      {/* Aurora backdrop drifts softly behind the apps grid. */}
      <div className="pointer-events-none absolute inset-x-0 -top-2 -z-10 h-[44dvh] overflow-hidden">
        <div className="absolute inset-0 [background:radial-gradient(40%_32%_at_28%_28%,rgba(168,85,247,0.22),transparent_60%),radial-gradient(36%_28%_at_78%_18%,rgba(245,158,11,0.18),transparent_60%),radial-gradient(32%_28%_at_50%_80%,rgba(16,185,129,0.20),transparent_60%)] blur-3xl" />
      </div>

      <Greeting name={user?.name} />

      {/* Apps grid (3 today + a "More soon" placeholder). */}
      <div className="mb-7 grid grid-cols-3 gap-y-5 gap-x-2">
        {APP_REGISTRY.map((g) => (
          <AppIcon key={g.id} g={g} stats={stats[g.id]} onOpen={() => navigate(g.route)} />
        ))}
        <MoreSoonIcon />
      </div>

      <ClubsStrip />
      <NotificationsStrip />
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

/** One glassy iOS-squircle app icon, with live + unread pips computed from
 *  the mock store. Active games take precedence — a Live badge always shows
 *  if any game of this type is in play. */
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

function ClubsStrip() {
  const navigate = useNavigate()
  const myClubs = useMyClubs()
  const recent = useRecentClubs()
  const myIds = new Set((myClubs.data ?? []).map((c) => c.id))
  const joinable = (recent.data ?? []).filter((c) => !myIds.has(c.id)).slice(0, 3)
  return (
    <div className="mb-3 rounded-2xl border border-border bg-bg-card/60 p-4 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-text-primary">
          {joinable.length > 0 ? `Clubs to join · ${joinable.length}` : 'Clubs'}
        </h3>
        <button type="button" onClick={() => navigate('/discover/clubs')} className="flex items-center gap-1 text-[11px] font-bold text-accent-blue">
          See all <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      {joinable.length > 0 ? (
        <div className="flex flex-col gap-2">
          {joinable.map((c) => (
            <button key={c.id} type="button" onClick={() => navigate(`/club/${c.id}`)} className="flex items-center gap-3 rounded-xl bg-bg-surface/70 p-2.5 text-left hover:bg-bg-surface">
              <span className="text-xl">{c.emoji ?? '🃏'}</span>
              <span className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-text-primary">{c.name}</p>
                <p className="text-[11px] text-text-muted">{c.location ?? '—'}</p>
              </span>
              <span className="rounded-full bg-accent-blue/15 px-2.5 py-1 text-[11px] font-extrabold text-accent-blue ring-1 ring-accent-blue/30">Request</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl bg-bg-surface/40 p-3 text-[12px] text-text-secondary">
          <Compass className="h-4 w-4 text-text-muted" />You're in every club we know about.
        </div>
      )}
    </div>
  )
}

function NotificationsStrip() {
  const notifs = useNotifications()
  // listNotifications() returns { items, unread } — NOT an array. Read .items.
  const recent = (notifs.data?.items ?? []).slice(0, 3)
  if (recent.length === 0) return null
  return (
    <div className="rounded-2xl border border-border bg-bg-card/60 p-4 backdrop-blur">
      <div className="mb-2 flex items-center gap-2">
        <Bell className="h-4 w-4 text-accent-amber" />
        <h3 className="text-sm font-extrabold text-text-primary">Notifications · {recent.length}</h3>
      </div>
      <ul className="space-y-1.5 text-[12px] text-text-secondary">
        {recent.map((n) => (
          <li key={n.id} className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent-amber" />
            <span className="line-clamp-2">{n.title}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const ICONS = { 'fantasy': Trophy, 'last-longer': Clock, 'squares': Grid3x3 } as const
