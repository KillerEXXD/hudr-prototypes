import { useEffect, useState } from 'react'
import { formatDistanceStrict } from 'date-fns'
import { detectZone, formatCloseInZone } from '@/lib/gameSetup'

/**
 * Registration close time.
 *
 * Two modes:
 *
 * - **Absolute** (default) — viewer's own local timezone, e.g.
 *   `"Closes 8:30 PM EDT"`. An ET host's deadline reads `"8:30 PM EDT"` in
 *   New York and `"6:00 AM IST"` in India.
 *
 * - **Relative** (`relative` prop) — past-tense distance from now, e.g.
 *   `"Locked 4 hr 30 min ago"`. Used on the post-lock "Locked" line on each
 *   detail page, where the absolute timestamp adds noise (the running-clock
 *   countdown banner already covers the pre-lock case). Re-renders every 30s
 *   so the label stays fresh.
 *
 * The countdown (server-driven) is identical for everyone regardless of mode.
 */
export function CloseTimeLabel({
  utcISO,
  prefix = 'Closes ',
  className,
  relative,
}: {
  utcISO?: string
  prefix?: string
  className?: string
  relative?: boolean
}) {
  // Tick every 30s so the relative label stays fresh without re-rendering the
  // whole page tree. `now` is held in state (not read from Date.now() during
  // render) so the component stays pure for the React Compiler.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!relative) return
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [relative])

  if (!utcISO) return null
  if (relative) {
    const t = Date.parse(utcISO)
    if (Number.isNaN(t)) return null
    const ago = formatDistanceStrict(t, now, { addSuffix: true, roundingMethod: 'floor' })
    // Abbreviate hours/minutes/seconds for the tight metadata strip while
    // keeping the "ago"/"in" suffix that formatDistanceStrict adds AND the
    // singular/plural distinction (so it's "1 hr ago" but "6 hrs ago", never
    // the wrong "6 hr ago"). Consistent across every game's "Locked X ago" line.
    const tight = ago
      .replace(/\bhours\b/, 'hrs').replace(/\bhour\b/, 'hr')
      .replace(/\bminutes\b/, 'mins').replace(/\bminute\b/, 'min')
      .replace(/\bseconds\b/, 'secs').replace(/\bsecond\b/, 'sec')
    return <span className={className}>{prefix}{tight}</span>
  }
  const s = formatCloseInZone(utcISO, detectZone())
  if (!s) return null
  return <span className={className}>{prefix}{s}</span>
}
