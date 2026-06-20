// =====================================================================
// Pure helpers for game scheduling (registration close + timezone) and
// payout structures. No React here so services can import freely.
//
// Timezone model (the bulletproof clock): a game's close time is ONE absolute
// UTC instant (locksAtTs). At creation we convert the host's wall-clock pick in
// their chosen IANA zone -> UTC (DST-correct). Everyone counts down to the same
// instant; the close time is DISPLAYED in the game's home zone + the viewer's.
// =====================================================================

/** Default payout split — top 3, 50/30/20. */
export const DEFAULT_PAYOUTS = [50, 30, 20]

export const PAYOUT_PRESETS: { label: string; payouts: number[] }[] = [
  { label: 'Winner takes all', payouts: [100] },
  { label: 'Top 2 · 60/40', payouts: [60, 40] },
  { label: 'Top 3 · 50/30/20', payouts: [50, 30, 20] },
]

export const payoutsSum = (p: number[]) => p.reduce((a, b) => a + b, 0)

/** Valid when there's ≥1 place, every place > 0, and the splits sum to 100%. */
export const arePayoutsValid = (p: number[]) => p.length >= 1 && p.every((n) => n > 0) && payoutsSum(p) === 100

/** Short, human label for a payout structure (for cards). */
export function payoutSummary(payouts?: number[]): { label: string; splits: string; wta: boolean } {
  const p = payouts && payouts.length ? payouts : DEFAULT_PAYOUTS
  if (p.length === 1) return { label: 'Winner takes all', splits: '100%', wta: true }
  return { label: `${p.length} winners`, splits: p.join('/'), wta: false }
}

/** A `datetime-local` value ~2 hours out (sensible default for the picker). */
export function defaultCloseLocal(): string {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000)
  d.setSeconds(0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// =====================================================================
// Timezones (IANA) — the source of truth for the registration clock.
// =====================================================================

/** The runtime's IANA zone, e.g. 'America/New_York', 'Asia/Kolkata'. */
export function detectZone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' }
}

/** Curated zones pinned to the top of the picker (covers our common audiences). */
export const COMMON_ZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Asia/Kolkata',
  'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney', 'UTC',
]

/** Every selectable IANA zone (full list when the runtime supports it). */
export function allZones(): string[] {
  try {
    const sv = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf
    if (sv) return sv('timeZone')
  } catch { /* older runtime — fall back to the curated set */ }
  return COMMON_ZONES
}

/** Map a legacy abbreviation (ET/CT/IST/…) to an IANA zone; pass IANA through. */
const LEGACY_ZONE: Record<string, string> = {
  ET: 'America/New_York', CT: 'America/Chicago', MT: 'America/Denver',
  PT: 'America/Los_Angeles', IST: 'Asia/Kolkata', GMT: 'UTC', UTC: 'UTC',
}
export function resolveZone(tz?: string): string {
  if (!tz) return 'UTC'
  return LEGACY_ZONE[tz] ?? tz
}

/** Short zone label at an instant, e.g. 'EDT', 'IST' (DST-aware). */
export function zoneAbbrev(timeZone: string, atMs = Date.now()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: resolveZone(timeZone), timeZoneName: 'short' }).formatToParts(new Date(atMs))
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? timeZone
  } catch { return timeZone }
}

/** Picker option label: 'Asia/Kolkata (IST)'. */
export function zoneOptionLabel(timeZone: string): string {
  const ab = zoneAbbrev(timeZone)
  const pretty = timeZone.replace(/_/g, ' ')
  return ab && ab !== timeZone ? `${pretty} (${ab})` : pretty
}

/** The wall-clock instant (as if-UTC ms) that `zone` shows for a UTC instant. */
function wallMsInZone(utcMs: number, zone: string): number {
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(new Date(utcMs))
  const g = (t: string) => Number(p.find((x) => x.type === t)?.value)
  let hour = g('hour'); if (hour === 24) hour = 0 // Intl may emit '24' at midnight
  return Date.UTC(g('year'), g('month') - 1, g('day'), hour, g('minute'), g('second'))
}

/**
 * Convert a naive `datetime-local` wall string interpreted IN `timeZone` to an
 * absolute UTC ISO instant. DST-correct: the offset is measured for that date.
 * Returns '' for an unparseable input.
 */
export function zonedWallToUtcISO(wall: string, timeZone: string): string {
  const m = wall.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!m) return ''
  const [y, mo, d, h, mi] = [m[1], m[2], m[3], m[4], m[5]].map(Number)
  const zone = resolveZone(timeZone)
  const asUTC = Date.UTC(y, mo - 1, d, h, mi)          // pretend the wall time is UTC
  const offset = wallMsInZone(asUTC, zone) - asUTC      // what the zone shows for it
  return new Date(asUTC - offset).toISOString()
}

/** Readable 'Fri, Jun 20 · 8:30 PM EDT' for an absolute instant in a zone. */
export function formatCloseInZone(utcISO?: string, timeZone?: string, withZone = true): string {
  if (!utcISO) return ''
  const t = Date.parse(utcISO)
  if (Number.isNaN(t)) return ''
  const zone = resolveZone(timeZone)
  const date = new Intl.DateTimeFormat('en-US', { timeZone: zone, weekday: 'short', month: 'short', day: 'numeric' }).format(t)
  const time = new Intl.DateTimeFormat('en-US', { timeZone: zone, hour: 'numeric', minute: '2-digit', ...(withZone ? { timeZoneName: 'short' } : {}) }).format(t)
  return `${date} · ${time}`
}
