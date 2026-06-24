import { useState } from 'react'
import { Lock, X } from 'lucide-react'

/**
 * Shown on a game page when the host closed registration EARLY (before the
 * scheduled deadline) so joined players immediately understand why the game
 * started sooner than expected. Dismissible per game (localStorage).
 */
export function RegClosedBanner({ gameId, show }: { gameId: string; show: boolean }) {
  const key = `clubr.regclosed.${gameId}`
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(key) === '1' } catch { return false }
  })
  if (!show || dismissed) return null
  return (
    <div className="mt-3 flex items-start gap-2 rounded-xl border border-accent-amber/40 bg-accent-amber/10 px-3 py-2.5 text-accent-amber">
      <Lock className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="flex-1 text-xs font-semibold leading-snug">Registration was closed early by the host — no new players can join.</p>
      <button type="button" aria-label="Dismiss" onClick={() => { try { localStorage.setItem(key, '1') } catch { /* ignore */ } setDismissed(true) }} className="shrink-0 rounded-md p-0.5 hover:bg-accent-amber/20 cursor-pointer"><X className="h-3.5 w-3.5" /></button>
    </div>
  )
}
