import { useNavigate } from 'react-router-dom'
import { Countdown, regDeadline } from '@/components/common/Countdown'
import { Badge } from '@/components/common/ui'
import { cn } from '@/lib/utils/cn'
import { TYPE_META, type ArenaGame } from '@/lib/arena/unifiedGame'

// =====================================================================
// Arena — the unified game presentation. ONE card anatomy, ONE lifecycle
// rail, applied to FT / Last Longer / Squares alike. This is the redesign's
// spine: a player learns the app once.
// =====================================================================

const STAKES = ({ n, className }: { n: number; className?: string }) => (
  <span className={cn('font-mono tabular-nums', className)}>{n.toLocaleString()}<span className="ml-0.5 text-[0.7em] text-text-muted">Stakes</span></span>
)

/** The lifecycle rail — open → live → settled, with the current phase lit.
 *  Encodes the one truth every game shares: where it is in its life. */
export function LifecycleRail({ phase, className }: { phase: ArenaGame['phase']; className?: string }) {
  const steps = ['open', 'live', 'settled'] as const
  const idx = phase === 'open' ? 0 : phase === 'live' ? 1 : phase === 'settling' ? 1 : 2
  const labels = { open: 'Open', live: 'Live', settled: 'Settled' }
  return (
    <div className={cn('flex items-center gap-1.5', className)} aria-label={`Phase: ${phase}`}>
      {steps.map((s, i) => {
        const done = i < idx, active = i === idx
        return (
          <div key={s} className="flex items-center gap-1.5">
            <span className={cn('flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide',
              active ? (s === 'live' ? 'text-accent-emerald' : 'text-accent-gold') : done ? 'text-text-secondary' : 'text-text-muted')}>
              <span className={cn('h-1.5 w-1.5 rounded-full',
                active ? (s === 'live' ? 'bg-accent-emerald arena-dot' : 'bg-accent-gold') : done ? 'bg-text-secondary' : 'bg-border-light')} />
              {labels[s]}
            </span>
            {i < steps.length - 1 && <span className={cn('h-px w-4', done ? 'bg-text-secondary' : 'bg-border')} />}
          </div>
        )
      })}
    </div>
  )
}

const RELATION_BADGE: Record<ArenaGame['relation'], { label: string; tone: 'gold' | 'green' | 'amber' | 'blue' | 'neutral' } | null> = {
  hosting: { label: 'Hosting', tone: 'gold' },
  in: { label: "You're in", tone: 'green' },
  pending: { label: 'Pending', tone: 'amber' },
  open: { label: 'Open', tone: 'blue' },
  spectating: null,
  done: null,
}

/** The unified game card — same shape for every type. The type only colours
 *  the glyph + accent; everything structural is shared. */
export function ArenaCard({ g, onOpen }: { g: ArenaGame; onOpen?: () => void }) {
  const navigate = useNavigate()
  const t = TYPE_META[g.type]
  const live = g.phase === 'live'
  const rel = RELATION_BADGE[g.relation]
  const open = () => (onOpen ? onOpen() : navigate(g.href))
  return (
    <button
      onClick={open}
      className={cn(
        'w-full cursor-pointer rounded-2xl border bg-bg-card p-4 text-left transition-all active:scale-[0.99]',
        live ? 'border-accent-emerald/35 arena-live' : 'border-border hover:border-border-light',
        g.needsYou && !live && 'border-accent-gold/40',
      )}
    >
      <div className="flex items-center justify-between">
        <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-bold',
          t.tone === 'purple' ? 'border-accent-purple/30 bg-accent-purple/12 text-accent-purple'
          : t.tone === 'amber' ? 'border-accent-amber/30 bg-accent-amber/12 text-accent-amber'
          : 'border-accent-emerald/30 bg-accent-emerald/12 text-accent-emerald')}>
          <span aria-hidden>{t.glyph}</span>{t.label}
        </span>
        {live
          ? <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-accent-emerald"><span className="h-1.5 w-1.5 rounded-full bg-accent-emerald arena-dot" />LIVE</span>
          : rel ? <Badge tone={rel.tone}>{rel.label}</Badge> : null}
      </div>

      <div className="mt-2 flex items-center gap-1.5 text-[12px] text-text-muted">
        <span aria-hidden>{g.clubEmoji}</span>{g.clubName}
      </div>
      <h3 className="mt-0.5 text-[15px] font-bold leading-tight text-text-primary">{g.title}</h3>

      {/* shared meta row: stake + phase progress */}
      <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
        <div className="flex items-center gap-1.5 text-[13px] text-text-secondary">
          <span className="text-text-muted">Buy-in</span><STAKES n={g.stake} className="font-bold text-text-primary" />
        </div>
        {g.progress && (
          <div className="text-[12px] font-mono text-text-secondary tabular-nums">
            <span className={cn('font-bold', live && g.progress.unit === 'alive' ? 'text-accent-emerald' : 'text-text-primary')}>
              {g.progress.value}{g.progress.unit !== 'claimed' ? `/${g.progress.total}` : '/100'}
            </span> <span className="text-text-muted">{g.progress.unit}</span>
          </div>
        )}
      </div>

      {/* footer: countdown when open · phase label · result when settled */}
      <div className="mt-2.5 flex items-center justify-between text-[12px]">
        {g.phase === 'open' && g.deadline
          ? <Countdown deadline={regDeadline(g.deadline)} prefix="Closes in" />
          : <span className={cn('font-semibold', live ? 'text-accent-emerald' : 'text-text-muted')}>{g.phaseLabel}</span>}
        {g.result
          ? <span className={cn('font-mono font-bold', g.result.won ? 'text-accent-gold' : 'text-text-secondary')}>
              {g.result.won ? '🏆 Won' : g.result.rank > 0 ? `#${g.result.rank} of ${g.result.field}` : 'Played'}
            </span>
          : <span className="font-semibold text-text-secondary">{g.phase === 'open' ? (g.needsYou ? 'Your move →' : 'View →') : 'View →'}</span>}
      </div>
    </button>
  )
}

/** Persistent live bar — when a game you're in is running, it rides the top of
 *  the app so you can browse without losing the thread (a "call in progress"
 *  affordance for poker). */
export function LiveBar({ games }: { games: ArenaGame[] }) {
  const navigate = useNavigate()
  if (games.length === 0) return null
  const g = games[0]
  const t = TYPE_META[g.type]
  return (
    <button
      onClick={() => navigate(g.href)}
      className="flex w-full items-center gap-3 border-b border-accent-emerald/25 bg-accent-emerald/10 px-4 py-2 text-left transition-colors hover:bg-accent-emerald/15"
    >
      <span className="flex h-2 w-2 shrink-0 rounded-full bg-accent-emerald arena-dot" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-bold text-text-primary">
          <span className="text-accent-emerald">LIVE</span> · {g.title}
        </span>
        <span className="block truncate text-[11px] text-text-secondary">
          {t.label} · {g.clubName} · {g.phaseLabel}
        </span>
      </span>
      {games.length > 1 && <span className="shrink-0 rounded-full bg-accent-emerald/20 px-2 py-0.5 text-[11px] font-bold text-accent-emerald">+{games.length - 1}</span>}
      <span className="shrink-0 text-accent-emerald">→</span>
    </button>
  )
}
