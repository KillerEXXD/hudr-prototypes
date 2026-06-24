import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Clock, Grid3x3, ChevronRight, type LucideIcon } from 'lucide-react'
import { useUnifiedGames, type UnifiedGame } from '@/games/useUnifiedGames'
import { APP_REGISTRY, type GameAppId, type GameAppMeta } from '@/games/appRegistry'

/**
 * Apps Home — 3 uniformly-shaped app cards stacked vertically. Each card
 * is its own app's status surface:
 *
 *   · Header  : clean icon + app name + ChevronRight ("tap to open")
 *   · Running : 1 line per LIVE game in that app (max 2)
 *   · Finished: 2 most recent FINISHED games (champion + winnings)
 *
 * "New" games are surfaced separately via NewGamesBell in the header so
 * the home stops competing with itself.
 */
export function HomePage() {
  const navigate = useNavigate()
  const { items } = useUnifiedGames()

  const byApp = useMemo(() => {
    const m: Record<GameAppId, { running: UnifiedGame[]; finished: UnifiedGame[] }> = {
      'fantasy': { running: [], finished: [] },
      'last-longer': { running: [], finished: [] },
      'squares': { running: [], finished: [] },
    }
    for (const g of items) {
      const id = appIdOf(g); if (!id) continue
      if (g.phase === 'live') m[id].running.push(g)
      else if (g.phase === 'closed' && !g.cancelled) m[id].finished.push(g)
    }
    // Newest-first within each bucket.
    const byCreated = (a: UnifiedGame, b: UnifiedGame) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
    for (const k of Object.keys(m) as GameAppId[]) {
      m[k].running.sort(byCreated)
      m[k].finished.sort(byCreated)
    }
    return m
  }, [items])

  return (
    <div className="relative animate-fade-up pb-2">
      {/* Aurora — quiet, behind the cards. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[64dvh] overflow-hidden">
        <div className="absolute inset-0 [background:radial-gradient(40%_30%_at_22%_22%,rgba(168,85,247,0.28),transparent_62%),radial-gradient(36%_28%_at_82%_22%,rgba(245,158,11,0.22),transparent_62%),radial-gradient(48%_36%_at_50%_82%,rgba(16,185,129,0.28),transparent_62%)] blur-3xl" />
      </div>

      <div className="flex flex-col gap-3">
        {APP_REGISTRY.map((app) => (
          <AppCard
            key={app.id}
            app={app}
            running={byApp[app.id].running}
            finished={byApp[app.id].finished}
            onOpen={() => navigate(app.route)}
            onOpenGame={(g) => navigate(routeOf(g))}
          />
        ))}
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────────

const ICONS: Record<GameAppId, LucideIcon> = { 'fantasy': Trophy, 'last-longer': Clock, 'squares': Grid3x3 }

function AppCard({ app, running, finished, onOpen, onOpenGame }: {
  app: GameAppMeta
  running: UnifiedGame[]
  finished: UnifiedGame[]
  onOpen: () => void
  onOpenGame: (g: UnifiedGame) => void
}) {
  const Icon = ICONS[app.id]
  const liveCount = running.length
  const topRunning = running.slice(0, 2)
  const topFinished = finished.slice(0, 2)
  const empty = liveCount === 0 && finished.length === 0

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-bg-card/80 backdrop-blur">
      {/* Header — the app identity row (the "icon", cleaner). */}
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full cursor-pointer items-center gap-3 border-b border-border/60 p-3 text-left hover:bg-bg-surface/40"
      >
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${app.grad} text-white`}
          style={{ boxShadow: `0 8px 20px -8px ${app.glow}, inset 0 1px 0 0 rgba(255,255,255,0.40)` }}
        >
          <Icon className="h-6 w-6" strokeWidth={2.3} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-base font-extrabold leading-tight text-text-primary">{app.label}</span>
          <span className="block text-[11px] font-semibold text-text-muted">{app.sub}</span>
        </span>
        {liveCount > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-accent-emerald/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-accent-emerald ring-1 ring-accent-emerald/40">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald animate-pulse" />
            {liveCount} live
          </span>
        )}
        <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
      </button>

      {/* Body — running + finished sections, or empty state. */}
      {empty ? (
        <div className="px-4 py-5 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">No activity</p>
          <p className="mt-1 text-sm font-semibold text-text-secondary">Tap to start a {app.label} game →</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {liveCount > 0 && (
            <Section label="Running">
              {topRunning.map((g) => (
                <RunningRow key={g.id} g={g} onOpen={() => onOpenGame(g)} />
              ))}
              {liveCount > 2 && <MoreLine count={liveCount - 2} onOpen={onOpen} />}
            </Section>
          )}
          {finished.length > 0 && (
            <Section label="Finished">
              {topFinished.map((g) => (
                <FinishedRow key={g.id} g={g} onOpen={() => onOpenGame(g)} />
              ))}
              {finished.length > 2 && <MoreLine count={finished.length - 2} onOpen={onOpen} />}
            </Section>
          )}
        </div>
      )}
    </section>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border/40 first:border-t-0">
      <p className="px-4 pt-2.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <div className="flex flex-col">{children}</div>
    </div>
  )
}

function RunningRow({ g, onOpen }: { g: UnifiedGame; onOpen: () => void }) {
  const facts = runningFacts(g)
  return (
    <button type="button" onClick={onOpen} className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left hover:bg-bg-surface/60">
      <span className="h-2 w-2 shrink-0 rounded-full bg-accent-emerald shadow-[0_0_0_4px_rgba(16,185,129,0.18)]" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-text-primary">{titleOf(g)}</span>
        <span className="block truncate text-[11px] text-text-secondary">{facts}</span>
      </span>
    </button>
  )
}

function FinishedRow({ g, onOpen }: { g: UnifiedGame; onOpen: () => void }) {
  const champ = championOf(g)
  return (
    <button type="button" onClick={onOpen} className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left hover:bg-bg-surface/60">
      <span className="text-base leading-none">🏆</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-text-primary">{champ.name ?? '—'}</span>
        <span className="block truncate text-[11px] text-text-secondary">won {titleOf(g)}</span>
      </span>
      {champ.amount != null && (
        <span className="shrink-0 rounded-full bg-accent-gold/15 px-2 py-0.5 font-mono text-[10.5px] font-extrabold text-accent-gold ring-1 ring-accent-gold/30">
          ${money(champ.amount)}
        </span>
      )}
    </button>
  )
}

function MoreLine({ count, onOpen }: { count: number; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="cursor-pointer px-4 py-2 text-left text-[11px] font-bold text-accent-blue hover:text-accent-blue/80">
      + {count} more →
    </button>
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

function routeOf(g: UnifiedGame): string {
  if (g.type === 'ft_fantasy') return `/fantasy/${g.id}`
  if (g.type === 'last_longer') return `/lastlonger/${g.id}`
  return `/squares/${g.id}`
}

/** One-line "running" summary appropriate to the game type. */
function runningFacts(g: UnifiedGame): string {
  if (g.type === 'ft_fantasy') {
    const entries = g.ft.entries.filter((e) => e.status !== 'pending').length
    return `${entries} entered · ${g.ft.clubName}`
  }
  if (g.type === 'last_longer') {
    const stillIn = g.ll.participants.filter((p) => p.status === 'active').length
    return `${stillIn} still in · ${g.ll.clubName}`
  }
  const scored = g.sq.periods.filter((p) => p.homeScore != null).length
  return `Q${scored}/4 scored · ${g.sq.clubName}`
}

/** Pull the champion name + winnings from a finished game. */
function championOf(g: UnifiedGame): { name?: string; amount?: number } {
  if (g.type === 'ft_fantasy') {
    const champ = g.ft.entries[0]
    return {
      name: champ?.name,
      amount: champ && g.ft.stake ? Math.round(g.ft.stake * g.ft.entries.length * 0.5) : undefined,
    }
  }
  if (g.type === 'last_longer') {
    const winner = g.ll.participants.find((p) => p.finishPos === 1)
    return {
      name: winner?.name ?? g.ll.winnerName,
      amount: winner ? g.ll.stake * g.ll.participants.length : undefined,
    }
  }
  // football_squares — top earner across periods.
  const sq = g.sq
  const pool = sq.stake * sq.claimedCount
  const totals = new Map<string, number>()
  for (const p of sq.periods) {
    if (!p.winnerUserId || p.homeScore == null) continue
    totals.set(p.winnerUserId, (totals.get(p.winnerUserId) ?? 0) + Math.round((pool * p.pct) / 100))
  }
  const top = [...totals.entries()].sort((a, b) => b[1] - a[1])[0]
  if (!top) return {}
  const [uid, amount] = top
  const name = sq.cells.find((c) => c.userId === uid)?.name ?? sq.participants.find((p) => p.userId === uid)?.name
  return { name, amount }
}

function money(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '0'
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '')}K`
  return n.toLocaleString()
}
