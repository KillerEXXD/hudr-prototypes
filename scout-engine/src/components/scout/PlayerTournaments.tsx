import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Trophy, X, Loader2 } from 'lucide-react'
import { usePlayerTournaments } from '@/hooks'
import { cn } from '@/lib/utils'

// Button + centered dialog listing the tournaments in the DB this player
// appears in, with hands played per tournament + a total.
export default function PlayerTournaments({ playerId, firstName }: { playerId: string; firstName: string }) {
  const [open, setOpen] = useState(false)
  const { data: tournaments = [], isLoading } = usePlayerTournaments(playerId)
  const totalHands = tournaments.reduce((sum, t) => sum + t.hands, 0)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-bg-surface/60 px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary cursor-pointer"
      >
        <Trophy className="h-3.5 w-3.5 text-accent-amber" />
        Tournaments in DB
        {tournaments.length > 0 && <span className="nums rounded-full bg-bg-card px-1.5 text-[10px] font-bold text-text-primary">{tournaments.length}</span>}
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="animate-fade-up flex max-h-[80vh] w-full max-w-sm flex-col rounded-2xl border border-border bg-bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 border-b border-border p-4">
              <div>
                <h3 className="text-sm font-bold text-text-primary">{firstName}'s tournaments</h3>
                <p className="text-xs text-text-muted">
                  {isLoading ? 'Loading…' : <>{tournaments.length} tournaments · <span className="nums">{totalHands.toLocaleString()}</span> hands in our database</>}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-bg-surface cursor-pointer" aria-label="Close"><X className="h-4 w-4" /></button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
              ) : tournaments.length === 0 ? (
                <div className="py-8 text-center text-sm text-text-muted">No tournaments on record.</div>
              ) : (
                <div className="space-y-1.5">
                  {tournaments.map((t) => (
                    <div key={t.tournamentId} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-bg-surface/40 px-3 py-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-text-primary">{t.name}</div>
                        <div className="truncate text-[11px] text-text-muted">{t.event} · {t.date}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="nums text-sm font-bold text-text-primary">{t.hands.toLocaleString()}</div>
                        <div className="text-[9px] uppercase tracking-wide text-text-muted">hands</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
