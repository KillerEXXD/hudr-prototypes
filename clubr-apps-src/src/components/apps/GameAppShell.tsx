import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Clock, Grid3x3, ChevronRight, Info, Sparkles, Coins, Users, ArrowLeft } from 'lucide-react'
import { useUnifiedGames, type UnifiedGame } from '@/games/useUnifiedGames'
import type { GameAppId, GameAppMeta } from '@/games/appRegistry'
import { cn } from '@/lib/utils/cn'

const APP_ICON: Record<GameAppId, typeof Trophy> = {
  'fantasy': Trophy,
  'last-longer': Clock,
  'squares': Grid3x3,
}

type Tab = 'open' | 'live' | 'finished' | 'how'

/**
 * Shared shell for every game-app page (Fantasy / Last Longer / Squares).
 *
 *  ┌─────────────────────────────────────┐
 *  │  ← back  +  app identity (gradient) │  ← header w/ glassy app-tint
 *  ├─────────────────────────────────────┤
 *  │  Open · Live · Finished · How       │  ← tabs (pulse on Live if hot)
 *  ├─────────────────────────────────────┤
 *  │  [list of games filtered by tab]    │  ← rows rendered by caller
 *  └─────────────────────────────────────┘
 *
 * Caller passes the app id + how to render each game in the list. We do the
 * filtering (by type + by phase) so each game-app page stays a 5-line file.
 */
export function GameAppShell({
  app,
  howItWorks,
  renderRow,
  emptyOpen,
  emptyLive,
  emptyFinished,
}: {
  app: GameAppMeta
  howItWorks: ReactNode
  renderRow: (g: UnifiedGame) => ReactNode
  emptyOpen?: ReactNode
  emptyLive?: ReactNode
  emptyFinished?: ReactNode
}) {
  const navigate = useNavigate()
  const { items } = useUnifiedGames()
  const ofType = items.filter((g) => mapType(g.type) === app.id)
  const open = ofType.filter((g) => g.phase === 'reg' && !g.cancelled)
  const live = ofType.filter((g) => g.phase === 'live' && !g.cancelled)
  const finished = ofType.filter((g) => g.phase === 'closed' && !g.cancelled)
  const [tab, setTab] = useState<Tab>(live.length > 0 ? 'live' : open.length > 0 ? 'open' : 'finished')
  const Icon = APP_ICON[app.id]
  const tabs: { id: Tab; label: string; count?: number; hot?: boolean }[] = [
    { id: 'open', label: 'Open', count: open.length },
    { id: 'live', label: 'Live', count: live.length, hot: live.length > 0 },
    { id: 'finished', label: 'Finished', count: finished.length },
    { id: 'how', label: 'How it works' },
  ]

  const rows = tab === 'open' ? open : tab === 'live' ? live : tab === 'finished' ? finished : []

  return (
    <div className="relative animate-fade-up">
      {/* App-tinted glow behind the identity header. */}
      <div className="pointer-events-none absolute inset-x-0 -top-4 -z-10 h-56 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-b ${app.grad} opacity-20 blur-3xl`} />
      </div>

      {/* Header: back arrow + large app identity */}
      <button type="button" onClick={() => navigate('/')} className="mb-3 flex cursor-pointer items-center gap-1 text-xs font-semibold text-text-muted hover:text-text-secondary">
        <ArrowLeft className="h-3.5 w-3.5" />Home
      </button>
      <div className="mb-5 flex items-center gap-4">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-[26%] bg-gradient-to-br ${app.grad} text-white shadow-lg`}
          style={{ boxShadow: `0 12px 28px -6px ${app.glow}, inset 0 1px 0 0 rgba(255,255,255,0.35)` }}
        >
          <Icon className="h-8 w-8" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-extrabold leading-tight text-text-primary">{app.label}</h1>
          <p className="text-[11px] text-text-muted">{app.sub}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'relative flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors',
              tab === t.id
                ? `bg-gradient-to-r ${app.grad} border-transparent text-white shadow-md`
                : 'border-border bg-bg-card text-text-secondary hover:bg-bg-surface',
            )}
          >
            {t.label}
            {typeof t.count === 'number' && t.count > 0 && (
              <span className={cn('rounded-full px-1.5 text-[10px] font-extrabold', tab === t.id ? 'bg-white/25' : 'bg-bg-surface text-text-muted')}>
                {t.count}
              </span>
            )}
            {t.hot && tab !== t.id && (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent-emerald animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Body */}
      {tab === 'how' ? (
        <HowPanel>{howItWorks}</HowPanel>
      ) : rows.length > 0 ? (
        <div className="flex flex-col gap-2.5">{rows.map((g) => renderRow(g))}</div>
      ) : (
        <EmptyState>
          {tab === 'open' && (emptyOpen ?? <>No {app.label} games open right now. The next one will appear here.</>)}
          {tab === 'live' && (emptyLive ?? <>Nothing live right now. Check back during the next event.</>)}
          {tab === 'finished' && (emptyFinished ?? <>No finished {app.label} games yet — once any complete, they show up here.</>)}
        </EmptyState>
      )}

      <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-text-muted">
        <Sparkles className="h-3 w-3" />Only {app.label} games show here. <button type="button" onClick={() => navigate('/')} className="cursor-pointer font-bold text-accent-blue">Back to apps</button>
      </p>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────────

function HowPanel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-card/60 p-5 text-sm leading-relaxed text-text-secondary backdrop-blur">
      <p className="mb-2 flex items-center gap-2 font-bold text-text-primary">
        <Info className="h-4 w-4 text-accent-amber" />How it works
      </p>
      {children}
    </div>
  )
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-bg-card/60 p-8 text-center text-sm text-text-secondary backdrop-blur">
      {children}
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────────

/** Shared compact row — what each game-app uses to render an open/live game. */
export function GameRow({ g, app, onOpen, extra }: { g: UnifiedGame; app: GameAppMeta; onOpen: () => void; extra?: ReactNode }) {
  const Icon = APP_ICON[app.id]
  const title = g.type === 'ft_fantasy' ? g.ft.ftName : g.type === 'last_longer' ? g.ll.title : g.sq.title
  const clubName = g.type === 'ft_fantasy' ? g.ft.clubName : g.type === 'last_longer' ? g.ll.clubName : g.sq.clubName
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex items-start gap-3 rounded-2xl border border-border bg-bg-card p-3.5 text-left transition-colors hover:border-accent-blue/40 hover:bg-bg-surface"
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${app.grad} text-white`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-text-primary">{title}</p>
        <p className="truncate text-[11px] text-text-muted">{clubName}{extra && <> · {extra}</>}</p>
      </div>
      {g.phase === 'live' && (
        <span className="flex shrink-0 items-center gap-1 self-center rounded-full bg-accent-emerald px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />Live
        </span>
      )}
      <ChevronRight className="h-4 w-4 shrink-0 self-center text-text-muted transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}

/** Finished-game row — compact champion summary. */
export function FinishedRow({ g, app, onOpen, championName, championAmount }: { g: UnifiedGame; app: GameAppMeta; onOpen: () => void; championName?: string; championAmount?: number }) {
  const Icon = APP_ICON[app.id]
  const title = g.type === 'ft_fantasy' ? g.ft.ftName : g.type === 'last_longer' ? g.ll.title : g.sq.title
  return (
    <button type="button" onClick={onOpen} className="group rounded-2xl border border-border bg-bg-card p-3.5 text-left transition-colors hover:border-accent-amber/40 hover:bg-bg-surface">
      <div className="mb-2 flex items-center gap-2">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${app.grad} text-white`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="truncate text-sm font-bold text-text-primary">{title}</span>
        <span className="ml-auto shrink-0 text-[10px] text-text-muted">Finished</span>
      </div>
      {championName && (
        <div className="flex items-center gap-2 rounded-xl bg-accent-amber/10 px-2.5 py-1.5">
          <span className="text-base">🥇</span>
          <span className="flex-1 truncate text-sm font-semibold text-text-primary">{championName}</span>
          {championAmount != null && championAmount > 0 && (
            <span className="font-mono text-xs font-extrabold text-accent-emerald">+{championAmount.toLocaleString()}</span>
          )}
        </div>
      )}
    </button>
  )
}

function mapType(t: UnifiedGame['type']): GameAppId {
  return t === 'ft_fantasy' ? 'fantasy' : t === 'last_longer' ? 'last-longer' : 'squares'
}
