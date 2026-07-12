export function money(n: number): string {
  const neg = n < 0
  const v = Math.abs(Math.round(n * 100) / 100)
  const s = v.toLocaleString(undefined, { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 })
  return `${neg ? '−' : ''}$${s}`
}
export const pct = (n: number): string => `${Math.round(n * 100)}%`

export function fmtDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
export const tierLabel = (ty: number): string => (ty >= 3 ? 'Year 3+' : `Year ${ty}`)
export const rateForYear = (ty: number, y1: number, y2: number, y3: number): number => (ty <= 1 ? y1 : ty === 2 ? y2 : y3)
