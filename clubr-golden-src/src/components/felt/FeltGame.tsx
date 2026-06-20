import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Grid3x3, Target, Timer, Trophy, UserPlus, Clock, Ticket, Coins } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Countdown, regDeadline } from '@/components/common/Countdown'
import { type ArenaGame } from '@/lib/arena/unifiedGame'

// =====================================================================
// Felt design primitives — a pixel-faithful match of the ClubrGo reference
// screenshots (mobile-first). Pill stats with icons, icon filter chips,
// type/status badges, the green countdown banner, and the unified game card
// with its inline stat pills + period/Join row.
// =====================================================================

// ---- Stat pill: e.g.  [🎫 100 buy-in]  [◎ 1,500 pool] ----
export function StatPill({ icon, value, label, tone = 'neutral' }: {
  icon?: ReactNode; value: ReactNode; label?: string; tone?: 'gold' | 'green' | 'neutral'
}) {
  const tones = {
    gold: 'border-accent-gold/35 text-accent-gold',
    green: 'border-accent-emerald/35 text-accent-emerald',
    neutral: 'border-border-light text-text-secondary',
  }
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border bg-bg-surface/60 px-2.5 py-1 text-[12px] font-bold pill', tones[tone])}>
      {icon}
      <span className="text-text-primary">{value}</span>
      {label && <span className="font-medium text-text-muted">{label}</span>}
    </span>
  )
}

// ---- Type badge: green SQUARES / amber LAST LONGER / purple FT FANTASY ----
const TYPE_BADGE: Record<ArenaGame['type'], { label: string; Icon: typeof Grid3x3; cls: string }> = {
  squares: { label: 'SQUARES', Icon: Grid3x3, cls: 'bg-accent-emerald text-bg-primary' },
  ll: { label: 'LAST LONGER', Icon: Timer, cls: 'bg-accent-amber text-bg-primary' },
  ft: { label: 'FT FANTASY', Icon: Target, cls: 'bg-accent-purple text-bg-primary' },
}
export function TypeBadge({ type }: { type: ArenaGame['type'] }) {
  const t = TYPE_BADGE[type]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-extrabold tracking-wide', t.cls)}>
      <t.Icon className="h-3.5 w-3.5" strokeWidth={2.5} />{t.label}
    </span>
  )
}

export function StatusBadge({ phase }: { phase: ArenaGame['phase'] }) {
  if (phase === 'live') return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-emerald/40 px-2.5 py-1 text-[11px] font-extrabold text-accent-emerald">
      <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald felt-dot" />RUNNING
    </span>
  )
  if (phase === 'settled') return <span className="inline-flex items-center gap-1 rounded-full border border-border-light px-2.5 py-1 text-[11px] font-bold text-text-muted">✓ Completed</span>
  if (phase === 'cancelled') return <span className="rounded-full border border-accent-red/40 px-2.5 py-1 text-[11px] font-bold text-accent-red">Cancelled</span>
  return <span className="rounded-full border border-accent-blue/40 px-2.5 py-1 text-[11px] font-bold text-accent-blue">Registration open</span>
}

// ---- Icon filter chips:  ⊞ All  ◎ FTF  ⏱ LL  ⊞ Squares ----
export type FilterKey = 'all' | 'ft' | 'll' | 'squares'
const FILTERS: { key: FilterKey; label: string; Icon: typeof Grid3x3 }[] = [
  { key: 'all', label: 'All', Icon: Grid3x3 },
  { key: 'ft', label: 'FTF', Icon: Target },
  { key: 'll', label: 'LL', Icon: Timer },
  { key: 'squares', label: 'Squares', Icon: Grid3x3 },
]
export function FilterChips({ value, onChange, counts }: {
  value: FilterKey; onChange: (k: FilterKey) => void; counts?: Partial<Record<FilterKey, number>>
}) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
      {FILTERS.map((f) => {
        const on = value === f.key
        return (
          <button key={f.key} onClick={() => onChange(f.key)}
            className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-bold transition-colors',
              on ? 'border-accent-blue bg-accent-blue/15 text-accent-blue' : 'border-border bg-bg-card text-text-secondary')}>
            <f.Icon className="h-3.5 w-3.5" />{f.label}
            {counts?.[f.key] != null && <span className={cn('ml-0.5 text-[11px]', on ? 'text-accent-blue' : 'text-text-muted')}>{counts[f.key]}</span>}
          </button>
        )
      })}
    </div>
  )
}

// ---- Status filter row:  Available 3 · Playing 1 · Running 4 · Completed 2 ----
export type StatusKey = 'available' | 'playing' | 'running' | 'completed'
export function StatusChips({ value, onChange, counts }: {
  value: StatusKey | null; onChange: (k: StatusKey | null) => void; counts: Record<StatusKey, number>
}) {
  const items: { key: StatusKey; label: string; tone: string }[] = [
    { key: 'available', label: 'Available', tone: 'text-accent-emerald' },
    { key: 'playing', label: 'Playing', tone: 'text-accent-blue' },
    { key: 'running', label: 'Running', tone: 'text-accent-emerald' },
    { key: 'completed', label: 'Completed', tone: 'text-text-muted' },
  ]
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((it) => {
        const on = value === it.key
        return (
          <button key={it.key} onClick={() => onChange(on ? null : it.key)}
            className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-bold transition-colors',
              on ? 'border-accent-blue/50 bg-accent-blue/10' : 'border-border bg-bg-card')}>
            <span className="text-text-secondary">{it.label}</span>
            <span className={it.tone}>{counts[it.key]}</span>
          </button>
        )
      })}
    </div>
  )
}

// ---- Green countdown banner (CLOSES IN / big mono timer) ----
export function CountdownBannerFelt({ deadline, title = 'CLOSES IN', sub, tone = 'green' }: {
  deadline?: string | null; title?: string; sub?: string; tone?: 'green' | 'amber'
}) {
  const d = regDeadline(deadline ?? null)
  const cls = tone === 'amber' ? 'border-accent-amber/30 bg-accent-amber/8' : 'border-accent-emerald/30 bg-accent-emerald/8'
  const txt = tone === 'amber' ? 'text-accent-amber' : 'text-accent-emerald'
  return (
    <div className={cn('flex items-center gap-3 rounded-2xl border px-4 py-3', cls)}>
      <Clock className={cn('h-5 w-5 shrink-0', txt)} />
      <div className="min-w-0 flex-1">
        <p className={cn('text-[11px] font-extrabold uppercase tracking-wide', txt)}>{title}</p>
        {sub && <p className="truncate text-[12px] text-text-secondary">{sub}</p>}
      </div>
      <span className={cn('font-mono text-2xl font-extrabold tabular-nums', txt)}>
        <Countdown deadline={d} prefix="" />
      </span>
    </div>
  )
}

// ---- The unified game card — pixel-faithful to the reference ----
export function FeltGameCard({ g }: { g: ArenaGame }) {
  const navigate = useNavigate()
  const live = g.phase === 'live'

  // third inline stat differs by type (field / standing / squares)
  const third =
    g.type === 'ft' ? `${g.progress?.value ?? 0} entered`
    : g.type === 'll' ? `${g.progress?.value ?? 0} in`
    : `${g.progress?.value ?? 0}/100 sq`

  return (
    <button onClick={() => navigate(g.href)}
      className={cn('w-full rounded-[18px] border bg-bg-card p-4 text-left shadow-[0_6px_20px_-14px_rgba(0,0,0,0.7)] transition-all active:scale-[0.99]',
        live ? 'border-accent-emerald/30 felt-live bg-[linear-gradient(150deg,#16291E,#121826)]' : 'border-border')}>
      {/* header: type badge + status */}
      <div className="mb-2.5 flex items-center justify-between">
        <TypeBadge type={g.type} />
        <StatusBadge phase={g.phase} />
      </div>

      {/* club row */}
      <div className="mb-1.5 flex items-center gap-2 text-[13px] text-text-muted">
        <span>{g.clubEmoji}</span><span>{g.clubName}</span>
      </div>

      {/* title */}
      <h3 className="text-[17px] font-bold leading-tight text-text-primary" style={{ fontFamily: 'var(--font-family-display)' }}>{g.title}</h3>

      {/* inline stat pills */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatPill icon={<Ticket className="h-3.5 w-3.5" />} value={g.stake} label="buy-in" tone="gold" />
        <StatPill icon={<Coins className="h-3.5 w-3.5" />} value={(g.stake * (g.progress?.total ?? 1)).toLocaleString()} label="pool" tone="green" />
        <span className="text-[12px] text-text-muted">· {third}</span>
        {g.phase === 'open' && g.deadline && (
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-accent-emerald">
            <Clock className="h-3.5 w-3.5" /><Countdown deadline={regDeadline(g.deadline)} prefix="Closes in" />
          </span>
        )}
      </div>

      {/* period / Join row */}
      <div className="mt-3 flex items-center justify-between">
        {g.type === 'squares'
          ? <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-text-secondary"><Trophy className="h-3.5 w-3.5 text-accent-gold" />Q1 · Q2 · Q3 · Final</span>
          : g.result
          ? <span className="font-mono text-[12px] font-bold text-accent-gold">🏆 {g.result.won ? 'Won' : `#${g.result.rank}`}</span>
          : <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-text-secondary"><Trophy className="h-3.5 w-3.5 text-accent-gold" />{g.type === 'ft' ? '3 winners · 50/30/20' : 'Winner takes pool'}</span>}
        {g.phase === 'open'
          ? <span className="inline-flex items-center gap-1.5 rounded-lg border border-border-light bg-bg-surface px-3 py-1.5 text-[13px] font-bold text-text-primary"><UserPlus className="h-3.5 w-3.5" />Join</span>
          : <span className="text-[13px] font-semibold text-text-secondary">View →</span>}
      </div>
    </button>
  )
}
