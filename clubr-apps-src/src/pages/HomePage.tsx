import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Clock, Grid3x3, ChevronRight, type LucideIcon } from 'lucide-react'
import { useUnifiedGames, type UnifiedGame } from '@/games/useUnifiedGames'
import { APP_REGISTRY, type GameAppId, type GameAppMeta } from '@/games/appRegistry'

/** Games created in the last 24h count as "new" — drives the red badge + the banner. */
const NEW_WINDOW_MS = 24 * 60 * 60 * 1000
const BANNER_VISIBLE_ROWS = 3

/**
 * Apps Home.
 *
 *   1. New-games banner at the very top (iMessage-style stack of "unread"
 *      rows — newest on top, red dot per row).
 *   2. Uniform stack of app cards below: icon + name + Running / Completed
 *      numbers + chevron. Nothing else.
 */
export function HomePage() {
  const navigate = useNavigate()
  const { items } = useUnifiedGames()

  const fresh = useMemo(() => {
    const now = Date.now()
    return [...items]
      .filter((g) => !g.cancelled && g.createdAt)
      .map((g) => ({ g, t: Date.parse(g.createdAt!) }))
      .filter(({ t }) => Number.isFinite(t) && now - t <= NEW_WINDOW_MS)
      .sort((a, b) => b.t - a.t)
      .map((x) => x.g)
  }, [items])

  const counts = useMemo(() => {
    const m: Record<GameAppId, { running: number; completed: number; fresh: number }> = {
      'fantasy': { running: 0, completed: 0, fresh: 0 },
      'last-longer': { running: 0, completed: 0, fresh: 0 },
      'squares': { running: 0, completed: 0, fresh: 0 },
    }
    const now = Date.now()
    for (const g of items) {
      const id = appIdOf(g); if (!id || g.cancelled) continue
      if (g.phase === 'live') m[id].running++
      else if (g.phase === 'closed') m[id].completed++
      const t = g.createdAt ? Date.parse(g.createdAt) : NaN
      if (Number.isFinite(t) && now - t <= NEW_WINDOW_MS) m[id].fresh++
    }
    return m
  }, [items])

  return (
    <div className="relative animate-fade-up pb-2">
      {/* Aurora — quiet, behind the page. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[64dvh] overflow-hidden">
        <div className="absolute inset-0 [background:radial-gradient(40%_30%_at_22%_22%,rgba(168,85,247,0.28),transparent_62%),radial-gradient(36%_28%_at_82%_22%,rgba(245,158,11,0.22),transparent_62%),radial-gradient(48%_36%_at_50%_82%,rgba(16,185,129,0.28),transparent_62%)] blur-3xl" />
      </div>

      {fresh.length > 0 && <NewGamesBanner fresh={fresh} onOpenGame={(g) => navigate(routeOf(g))} />}

      <div className="flex flex-col gap-3">
        {APP_REGISTRY.map((app) => (
          <AppCard key={app.id} app={app} c={counts[app.id]} onOpen={() => navigate(app.route)} />
        ))}
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────────

const ICONS: Record<GameAppId, LucideIcon> = { 'fantasy': Trophy, 'last-longer': Clock, 'squares': Grid3x3 }

function NewGamesBanner({ fresh, onOpenGame }: { fresh: UnifiedGame[]; onOpenGame: (g: UnifiedGame) => void }) {
  const shown = fresh.slice(0, BANNER_VISIBLE_ROWS)
  const more = Math.max(0, fresh.length - shown.length)
  return (
    <section className="mb-3 overflow-hidden rounded-2xl border border-accent-red/30 bg-accent-red/5 backdrop-blur">
      <header className="flex items-center justify-between gap-2 px-4 pt-3">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-accent-red">
          New games · {fresh.length}
        </p>
        <p className="text-[10px] font-semibold text-text-muted">Last 24h</p>
      </header>
      <ul className="flex flex-col">
        {shown.map((g) => {
          const id = appIdOf(g); if (!id) return null
          const app = APP_REGISTRY.find((a) => a.id === id)!
          return (
            <li key={g.id}>
              <button
                type="button"
                onClick={() => onOpenGame(g)}
                className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-bg-surface/60"
              >
                {/* Unread dot — the iOS "this row has something new" mark. */}
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent-red" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-extrabold text-text-primary">{titleOf(g)}</span>
                  <span className="block truncate text-[11px] text-text-secondary">{app.label} · {clubLabel(g)}</span>
                </span>
                <span className="shrink-0 text-[11px] font-semibold text-text-muted">{ago(g.createdAt!)}</span>
              </button>
            </li>
          )
        })}
        {more > 0 && (
          <li className="px-4 pb-3 pt-1 text-[11px] font-bold text-accent-blue">+ {more} more</li>
        )}
      </ul>
    </section>
  )
}

function AppCard({ app, c, onOpen }: {
  app: GameAppMeta
  c: { running: number; completed: number; fresh: number }
  onOpen: () => void
}) {
  const Icon = ICONS[app.id]
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-border bg-bg-card/80 p-4 text-left backdrop-blur transition-transform active:scale-[0.99] hover:bg-bg-surface/40"
    >
      <div className="relative shrink-0">
        <span
          className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${app.grad} text-white`}
          style={{ boxShadow: `0 10px 22px -8px ${app.glow}, inset 0 1px 0 0 rgba(255,255,255,0.40)` }}
        >
          <Icon className="h-7 w-7" strokeWidth={2.3} />
        </span>
        {c.fresh > 0 && (
          <span
            aria-label={`${c.fresh} new`}
            className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-accent-red px-1.5 font-mono text-[12px] font-extrabold text-white"
            style={{ boxShadow: '0 0 0 3px var(--color-bg-card, #0B1410)' }}
          >
            {c.fresh > 99 ? '99+' : c.fresh}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-display text-base font-extrabold leading-tight text-text-primary">{app.label}</p>
        <p className="mt-0.5 text-[11px] font-semibold text-text-muted">{app.sub}</p>
      </div>

      <div className="flex shrink-0 items-end gap-4">
        <Stat n={c.running} label="Running" tone="emerald" />
        <Stat n={c.completed} label="Completed" tone="gold" />
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
    </button>
  )
}

function Stat({ n, label, tone }: { n: number; label: string; tone: 'emerald' | 'gold' }) {
  const numColor = tone === 'emerald' ? 'text-accent-emerald' : 'text-accent-gold'
  return (
    <div className="text-right leading-none">
      <p className={`font-mono text-2xl font-extrabold tabular-nums ${numColor}`}>{n}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">{label}</p>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────────

function appIdOf(g: UnifiedGame): GameAppId | null {
  if (g.type === 'ft_fantasy') return 'fantasy'
  if (g.type === 'last_longer') return 'last-longer'
  if (g.type === 'football_squares') return 'squares'
  return null
}

function titleOf(g: UnifiedGame): string {
  if (g.type === 'ft_fantasy') return g.ft.ftName
  if (g.type === 'last_longer') return g.ll.title
  return g.sq.title
}

function clubLabel(g: UnifiedGame): string {
  if (g.type === 'ft_fantasy') return `${g.ft.clubEmoji ?? ''} ${g.ft.clubName}`.trim()
  if (g.type === 'last_longer') return `${g.ll.clubEmoji ?? ''} ${g.ll.clubName}`.trim()
  return `${g.sq.clubEmoji ?? ''} ${g.sq.clubName}`.trim()
}

function routeOf(g: UnifiedGame): string {
  if (g.type === 'ft_fantasy') return `/fantasy/${g.id}`
  if (g.type === 'last_longer') return `/lastlonger/${g.id}`
  return `/squares/${g.id}`
}

function ago(iso: string): string {
  const t = Date.parse(iso); if (Number.isNaN(t)) return ''
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000))
  if (s < 60) return 'now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
