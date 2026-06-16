import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

// Stable per-session anchor — keeps countdowns ticking smoothly and stops them
// resetting whenever React Query refetches the list.
const SESSION_START = Date.now()

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/**
 * Resolve a registration / lock deadline (epoch ms). Uses the explicit ISO from
 * the data when present (the real API will send one); otherwise derives a stable,
 * per-item demo deadline 6–54 minutes out so each card ticks down believably.
 */
export function regDeadline(id: string, explicit?: string): number {
  if (explicit) {
    const t = Date.parse(explicit)
    if (!Number.isNaN(t)) return t
  }
  return SESSION_START + (6 + (hash(id) % 49)) * 60_000
}

function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  return `${m}:${String(sec).padStart(2, '0')}`
}

/** Live, ticking "closes in …" pill (turns red + pulses as the deadline nears). */
export function Countdown({ deadline, prefix = 'Closes' }: { deadline: number; prefix?: string }) {
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const ms = deadline - Date.now()
  if (ms <= 0) {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-text-muted">
        <Clock className="h-3 w-3" />Closed
      </span>
    )
  }
  const urgent = ms < 5 * 60_000
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[11px] font-semibold ${urgent ? 'text-accent-red' : 'text-accent-emerald'} ${ms < 60_000 ? 'animate-pulse' : ''}`}>
      <Clock className="h-3 w-3" />{prefix} {fmt(ms)}
    </span>
  )
}
