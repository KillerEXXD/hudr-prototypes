import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Trophy, Clock, Grid3x3, type LucideIcon } from 'lucide-react'
import { Sheet, EmptyState } from '@/components/common/ui'
import { useUnifiedGames, type UnifiedGame } from '@/games/useUnifiedGames'
import { APP_REGISTRY, type GameAppId } from '@/games/appRegistry'

/** Games created in the last 24h count as "new" — drives the badge. */
const NEW_WINDOW_MS = 24 * 60 * 60 * 1000

const APP_ICONS: Record<GameAppId, LucideIcon> = { 'fantasy': Trophy, 'last-longer': Clock, 'squares': Grid3x3 }

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
function clubOf(g: UnifiedGame): { name: string; emoji?: string } {
  if (g.type === 'ft_fantasy') return { name: g.ft.clubName, emoji: g.ft.clubEmoji }
  if (g.type === 'last_longer') return { name: g.ll.clubName, emoji: g.ll.clubEmoji }
  return { name: g.sq.clubName, emoji: g.sq.clubEmoji }
}
function routeOf(g: UnifiedGame): string {
  if (g.type === 'ft_fantasy') return `/fantasy/${g.id}`
  if (g.type === 'last_longer') return `/lastlonger/${g.id}`
  return `/squares/${g.id}`
}
function ago(iso: string): string {
  const t = Date.parse(iso); if (Number.isNaN(t)) return ''
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000))
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/**
 * Header bell for newly-created games. Counts every game created in the
 * trailing NEW_WINDOW_MS, opens a sheet listing them grouped by recency.
 * Lives next to NotificationBell — the existing one handles invites/approvals;
 * this one handles "new content."
 */
export function NewGamesBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="New games"
        title="New games in your clubs"
        className="relative rounded-full p-1.5 hover:bg-bg-surface cursor-pointer"
      >
        <Sparkles className="h-5 w-5 text-accent-amber" />
        {fresh.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-amber px-1 text-[10px] font-extrabold leading-none text-white">
            {fresh.length > 9 ? '9+' : fresh.length}
          </span>
        )}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="New games · last 24h">
        {fresh.length === 0 ? (
          <EmptyState icon={<Sparkles className="h-7 w-7" />} title="No new games" sub="Games created in your clubs in the last day will show up here." />
        ) : (
          <div className="-mx-1 max-h-[60vh] overflow-y-auto px-1">
            <div className="flex flex-col gap-1.5">
              {fresh.map((g) => {
                const appId = appIdOf(g); if (!appId) return null
                const app = APP_REGISTRY.find((a) => a.id === appId)!
                const Icon = APP_ICONS[appId]
                const club = clubOf(g)
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => { setOpen(false); navigate(routeOf(g)) }}
                    className="flex items-start gap-3 rounded-xl border border-border bg-bg-surface p-3 text-left transition-colors hover:bg-bg-card cursor-pointer"
                  >
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${app.grad} text-white shadow-sm`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-extrabold text-text-primary">{titleOf(g)}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-text-secondary">
                        {app.label} · {club.emoji ?? '🃏'} {club.name} · {ago(g.createdAt!)}
                      </span>
                    </span>
                    {g.phase === 'live' ? (
                      <span className="shrink-0 flex items-center gap-1 rounded-full bg-accent-emerald px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />Live
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-accent-blue/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-accent-blue ring-1 ring-accent-blue/30">Open</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </Sheet>
    </>
  )
}
