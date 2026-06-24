import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Clock, Grid3x3, type LucideIcon } from 'lucide-react'
import { useUnifiedGames, type UnifiedGame } from '@/games/useUnifiedGames'
import { APP_REGISTRY, type GameAppId, type GameAppMeta } from '@/games/appRegistry'

/**
 * Apps Home — the grid IS the home. Each tile is a status widget (not just
 * a launcher), projecting the most relevant live/open game in that app from
 * useUnifiedGames(). Tap drills into that app. iOS app-icon-as-widget pattern.
 *
 * Layout: 2 columns. Fantasy + Last Longer side-by-side; Squares spans the
 * full second row so the page has no awkward empty slot.
 */
export function HomePage() {
  const navigate = useNavigate()
  const { items } = useUnifiedGames()

  // Pick a "hero" game per app: prefer LIVE > OPEN (most recent), null if neither.
  const heroByApp = useMemo(() => {
    const map: Record<GameAppId, UnifiedGame | null> = { 'fantasy': null, 'last-longer': null, 'squares': null }
    const appIdOf = (g: UnifiedGame): GameAppId | null =>
      g.type === 'ft_fantasy' ? 'fantasy'
      : g.type === 'last_longer' ? 'last-longer'
      : g.type === 'football_squares' ? 'squares' : null
    const newest = (a?: string, b?: string) => (a ?? '').localeCompare(b ?? '')
    // First pass: pick a live game (most recent createdAt wins).
    for (const g of items) {
      const id = appIdOf(g); if (!id) continue
      if (g.phase === 'live') {
        if (!map[id] || newest(g.createdAt, map[id]?.createdAt) > 0) map[id] = g
      }
    }
    // Second pass: fill remaining apps with most-recent OPEN game.
    for (const g of items) {
      const id = appIdOf(g); if (!id || map[id]) continue
      if (g.phase === 'reg') {
        // Most recent open game for this app.
        const current = map[id] as UnifiedGame | null
        if (!current || newest(g.createdAt, current.createdAt) > 0) map[id] = g
      }
    }
    return map
  }, [items])

  // Per-app totals so the dormant state can still hint "5 finished" etc.
  const totals = useMemo(() => {
    const t: Record<GameAppId, { open: number; live: number; finished: number }> = {
      'fantasy': { open: 0, live: 0, finished: 0 },
      'last-longer': { open: 0, live: 0, finished: 0 },
      'squares': { open: 0, live: 0, finished: 0 },
    }
    for (const g of items) {
      const id = g.type === 'ft_fantasy' ? 'fantasy' : g.type === 'last_longer' ? 'last-longer' : g.type === 'football_squares' ? 'squares' : null
      if (!id) continue
      if (g.phase === 'reg') t[id].open++
      else if (g.phase === 'live') t[id].live++
      else if (g.phase === 'closed' && !g.cancelled) t[id].finished++
    }
    return t
  }, [items])

  return (
    <div className="relative animate-fade-up pb-2">
      {/* Aurora sits ONLY behind the tiles (top 64dvh), tinted to the 3 app gradients. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[64dvh] overflow-hidden">
        <div className="absolute inset-0 [background:radial-gradient(38%_30%_at_22%_22%,rgba(168,85,247,0.32),transparent_62%),radial-gradient(36%_28%_at_82%_18%,rgba(245,158,11,0.26),transparent_62%),radial-gradient(48%_36%_at_50%_82%,rgba(16,185,129,0.30),transparent_62%)] blur-3xl" />
      </div>

      <div className="grid grid-cols-2 gap-3 [&>*:nth-child(3)]:col-span-2">
        {APP_REGISTRY.map((app) => (
          <StatusTile
            key={app.id}
            app={app}
            hero={heroByApp[app.id]}
            totals={totals[app.id]}
            onOpen={() => navigate(app.route)}
            wide={app.id === 'squares'}
          />
        ))}
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────────

const ICONS: Record<GameAppId, LucideIcon> = { 'fantasy': Trophy, 'last-longer': Clock, 'squares': Grid3x3 }

function StatusTile({ app, hero, totals, onOpen, wide }: {
  app: GameAppMeta
  hero: UnifiedGame | null
  totals: { open: number; live: number; finished: number }
  onOpen: () => void
  wide: boolean
}) {
  const Icon = ICONS[app.id]
  const facts = hero ? projectHero(hero) : null

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex w-full cursor-pointer flex-col gap-3 overflow-hidden rounded-[26px] p-4 text-left text-white shadow-xl transition-transform active:scale-[0.985]"
      style={{
        background: `linear-gradient(135deg, var(--g-from), var(--g-to))`,
        // Pull the actual color stops from the gradient class -> keep them in CSS vars so
        // the tile's typography sits on the right hue regardless of utility class order.
        ['--g-from' as string]: gradFrom(app),
        ['--g-to' as string]: gradTo(app),
        boxShadow: `0 18px 40px -10px ${app.glow}, inset 0 1px 0 0 rgba(255,255,255,0.40), inset 0 -2px 0 0 rgba(0,0,0,0.25)`,
        minHeight: wide ? 156 : 196,
      }}
    >
      {/* Subtle inner sheen — gives the tile its "iOS squircle" depth. */}
      <span className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_60%_at_50%_-10%,rgba(255,255,255,0.28),transparent_55%)]" />
      <span className="pointer-events-none absolute inset-x-3 bottom-2 h-px bg-white/15" />

      {/* Header row: icon + app name + (live pip if live) */}
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/22 backdrop-blur-md ring-1 ring-white/30">
            <Icon className="h-5 w-5" strokeWidth={2.4} />
          </span>
          <div>
            <p className="font-display text-base font-extrabold leading-none tracking-tight">{app.label}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">{app.sub}</p>
          </div>
        </div>
        {totals.live > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md ring-1 ring-white/30">
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />Live
          </span>
        )}
      </div>

      {/* Body: hero status OR dormant message. */}
      <div className="relative mt-auto">
        {facts ? (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/75">
              {facts.statusLabel}
            </p>
            <p className={`mt-0.5 line-clamp-2 font-extrabold leading-tight ${wide ? 'text-lg' : 'text-[15px]'}`}>
              {facts.title}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {facts.facts.map((f, i) => (
                <span key={i} className="rounded-full bg-white/22 px-2 py-0.5 text-[10.5px] font-extrabold backdrop-blur-md ring-1 ring-white/25">
                  {f}
                </span>
              ))}
            </div>
            <p className="mt-2 text-[10px] font-semibold text-white/80">{facts.club}</p>
          </>
        ) : (
          <DormantBody totalsLabel={dormantLabel(totals)} />
        )}
      </div>
    </button>
  )
}

function DormantBody({ totalsLabel }: { totalsLabel: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">No active games</p>
      <p className="text-[15px] font-extrabold leading-tight">Tap to start one →</p>
      {totalsLabel && <p className="mt-1 text-[10.5px] font-semibold text-white/70">{totalsLabel}</p>}
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────────

/** Project a hero game into the small list of facts the tile displays. */
function projectHero(g: UnifiedGame): { statusLabel: string; title: string; facts: string[]; club: string } {
  const live = g.phase === 'live'
  if (g.type === 'ft_fantasy') {
    const c = g.ft
    const entries = c.entries.filter((e) => e.status !== 'pending').length
    const pool = c.stake * entries
    return {
      statusLabel: live ? 'Live · Final table' : 'Open · Draft now',
      title: c.ftName,
      facts: [
        `${entries} drafted`,
        c.stake ? `$${money(pool)} pool` : 'No buy-in',
        c.format === 'winner_takes_all' ? 'WTA' : '50/30/20',
      ].filter(Boolean) as string[],
      club: `${c.clubEmoji ?? ''} ${c.clubName}`.trim(),
    }
  }
  if (g.type === 'last_longer') {
    const ll = g.ll
    const stillIn = ll.participants.filter((p) => p.status === 'active').length
    const joined = ll.participants.length
    const pool = ll.stake * joined
    return {
      statusLabel: live ? 'Live · In progress' : 'Open · Join now',
      title: ll.title,
      facts: [
        live ? `${stillIn} still in` : `${joined} joined`,
        `$${money(pool)} pool`,
      ],
      club: `${ll.clubEmoji ?? ''} ${ll.clubName}`.trim(),
    }
  }
  // football_squares
  const sq = g.sq
  const periodsScored = sq.periods.filter((p) => p.homeScore != null).length
  const pool = sq.stake * sq.claimedCount
  return {
    statusLabel: live ? `Live · ${periodsScored}/4 scored` : 'Open · Claim a square',
    title: sq.title,
    facts: [
      `${sq.claimedCount}/100 claimed`,
      `$${money(pool)} pool`,
    ],
    club: `${sq.clubEmoji ?? ''} ${sq.clubName}`.trim(),
  }
}

function dormantLabel(totals: { open: number; live: number; finished: number }): string {
  // If there's history (finished games), surface it — gives the tile a quiet
  // pulse instead of looking abandoned. Otherwise stay silent.
  if (totals.finished > 0) return `${totals.finished} finished in your clubs`
  return ''
}

function money(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '0'
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}K`
  return n.toLocaleString()
}

// CSS-var helpers — keep the gradient colors typed instead of relying on
// Tailwind class parsing (the tile uses CSS vars for the tint).
function gradFrom(app: GameAppMeta): string {
  if (app.id === 'fantasy') return '#a855f7'
  if (app.id === 'last-longer') return '#f59e0b'
  return '#10b981'
}
function gradTo(app: GameAppMeta): string {
  if (app.id === 'fantasy') return '#ec4899'
  if (app.id === 'last-longer') return '#ef4444'
  return '#06b6d4'
}
