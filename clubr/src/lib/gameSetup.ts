// =====================================================================
// Pure helpers for game scheduling (registration close + timezone) and
// payout structures. No React here so services can import freely.
// =====================================================================

export const TIMEZONES = [
  { id: 'ET', label: 'Eastern · ET' },
  { id: 'CT', label: 'Central · CT' },
  { id: 'MT', label: 'Mountain · MT' },
  { id: 'PT', label: 'Pacific · PT' },
  { id: 'UTC', label: 'UTC' },
] as const

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

/** Readable "Mon, Jun 16 · 8:30 PM ET" from a datetime-local value + tz id. */
export function formatClose(closesAt?: string, tz?: string): string {
  if (!closesAt) return ''
  const d = new Date(closesAt)
  if (Number.isNaN(d.getTime())) return ''
  const s = d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  return tz ? `${s} ${tz}` : s
}
