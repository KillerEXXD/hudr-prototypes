import { useEffect, useState } from 'react'
import { Clock, SquarePen } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// Prototype note: the live app drives the countdown off SERVER time (see
// lib/time/serverClock.ts) so it's identical across devices/timezones. The mock
// has no server, so this demo ticks off the device clock — fine for a single
// local viewer. Relative seed labels ("in 1h 05m") anchor to a stable session
// start so they don't reset on every refetch.
const SESSION_START = Date.now()

/** Parse a relative label like "in 1h 05m" / "in 25m" → minutes (null if not relative). */
function parseRelative(s: string): number | null {
  const m = s.match(/in\s+(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?/i)
  if (!m || (!m[1] && !m[2])) return null
  return parseInt(m[1] || '0', 10) * 60 + parseInt(m[2] || '0', 10)
}

/**
 * Resolve an absolute deadline (epoch ms) from an ISO timestamp (real games) or a
 * relative seed label (mock). Returns null when there's no usable time — callers
 * render a neutral state rather than a fabricated countdown.
 */
export function regDeadline(iso?: string | null): number | null {
  if (!iso) return null
  const t = Date.parse(iso)
  if (!Number.isNaN(t)) return t
  const rel = parseRelative(iso)
  if (rel != null) return SESSION_START + rel * 60_000
  return null
}

/** "1h 04m" — compact, for tight list-row pills. */
function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  return `${m}:${String(sec).padStart(2, '0')}`
}

/** "1:04:32" / "04:32" — full ticking clock for the prominent banner. */
function fmtClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(sec).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

// Re-render every second so the clock ticks.
function useTicker() {
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])
}

/** Live, ticking "closes in …" pill (turns red + pulses as the deadline nears). */
export function Countdown({ deadline, prefix = 'Closes in' }: { deadline: number | null; prefix?: string }) {
  useTicker()
  if (deadline == null) {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-text-muted">
        <Clock className="h-3 w-3" />Scheduled
      </span>
    )
  }
  const ms = deadline - Date.now()
  if (ms <= 0) {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-text-muted">
        <Clock className="h-3 w-3" />Closed
      </span>
    )
  }
  const urgent = ms < 10 * 60_000 // under 10 minutes → red
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[11px] font-semibold ${urgent ? 'text-accent-red' : 'text-accent-emerald'} ${ms < 2 * 60_000 ? 'animate-pulse' : ''}`}>
      <Clock className="h-3 w-3" />{prefix} {fmt(ms)}
    </span>
  )
}

/**
 * Prominent, color-coded countdown banner for game detail pages. Big ticking
 * HH:MM:SS clock so the closing deadline is impossible to miss:
 *   emerald (plenty of time) → amber (< 30m) → red (< 10m) → pulses (< 2m).
 */
export function CountdownBanner({ deadline, label = 'Closes in', closedLabel = 'Closed', sub, onEdit, className }: { deadline: number | null; label?: string; closedLabel?: string; sub?: string; onEdit?: () => void; className?: string }) {
  useTicker()
  const ms = deadline == null ? null : deadline - Date.now()
  const pending = ms == null
  const closed = ms != null && ms <= 0
  const tone = pending || closed
    ? 'border-border bg-bg-surface/60 text-text-muted'
    : ms < 10 * 60_000
      ? 'border-accent-red/40 bg-accent-red/10 text-accent-red'
      : ms < 30 * 60_000
        ? 'border-accent-amber/40 bg-accent-amber/10 text-accent-amber'
        : 'border-accent-emerald/40 bg-accent-emerald/10 text-accent-emerald'

  return (
    <div className={cn('relative flex items-center gap-3 rounded-xl border px-3.5 py-2.5', tone, !pending && !closed && ms < 2 * 60_000 && 'animate-pulse', className)}>
      <Clock className="h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wide opacity-90">{closed ? closedLabel : label}</p>
        {sub && !closed && <p className="truncate text-[11px] leading-tight text-text-muted">{sub}</p>}
      </div>
      <span className="font-mono text-2xl font-extrabold tabular-nums tracking-tight leading-none">{pending ? '—:—' : closed ? '00:00' : fmtClock(ms)}</span>
      {onEdit && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onEdit() }} aria-label="Edit time" title="Edit time"
          className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-lg border border-current/40 bg-bg-card shadow-sm hover:bg-black/10 cursor-pointer">
          <SquarePen className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
