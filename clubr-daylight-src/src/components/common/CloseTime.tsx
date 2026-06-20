import { detectZone, formatCloseInZone } from '@/lib/gameSetup'

/**
 * Registration close time, shown in the VIEWER's own local timezone. Every viewer
 * sees the same absolute instant, formatted for wherever they are — e.g. an
 * ET host's 8:30 PM deadline reads "8:30 PM EDT" in New York and "6:00 AM IST"
 * in India. The countdown (server-driven) is identical for everyone regardless.
 */
export function CloseTimeLabel({ utcISO, prefix = 'Closes ', className }: { utcISO?: string; prefix?: string; className?: string }) {
  if (!utcISO) return null
  const s = formatCloseInZone(utcISO, detectZone())
  if (!s) return null
  return <span className={className}>{prefix}{s}</span>
}
