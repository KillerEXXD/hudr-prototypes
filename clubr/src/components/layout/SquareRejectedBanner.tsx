import { useNavigate } from 'react-router-dom'
import { XCircle, X } from 'lucide-react'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks'
import { GAME_ROUTE } from '@/lib/contract/gameInvite'

/**
 * Sticky, shell-level banner shown to a Football-Squares player when the host REJECTS one
 * of their pending squares (BUG-912). It pops in the instant the notification lands — even
 * when the player is scrolled mid-page — and stays pinned to the top of the viewport until
 * they dismiss it (tap the X). Tapping a row opens the board so they can claim another
 * square. Never in chat — this is the private channel.
 *
 * Source: unread notifications of type `square_rejected`. The body already reads
 * "Your square (R3·C5) on {game} wasn't approved — {reason}".
 */
const MAX_VISIBLE = 3

export function SquareRejectedBanner() {
  const navigate = useNavigate()
  const { data } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()
  const items = (data?.items ?? []).filter((n) => n.type === 'square_rejected' && !n.read)
  if (items.length === 0) return null

  const sorted = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const shown = sorted.slice(0, MAX_VISIBLE)
  const extra = sorted.length - shown.length

  function open(gameId: string | null) {
    if (gameId) navigate(GAME_ROUTE.sq(gameId))
  }

  function dismissAll() {
    if (sorted.length <= MAX_VISIBLE + 2) {
      for (const n of sorted) markRead.mutate(n.id)
    } else {
      markAll.mutate()
    }
  }

  return (
    <div data-testid="square-rejected-banner" className="sticky top-2 z-20 mx-3 mt-2">
      <div className="overflow-hidden rounded-2xl border border-accent-red/40 bg-bg-card/95 shadow-lg shadow-black/30 backdrop-blur">
        <div className="flex items-start gap-2.5 px-3.5 py-2.5">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-red/15 text-accent-red">
            <XCircle className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-accent-red">
              {sorted.length > 1 ? 'Squares not approved' : 'Square not approved'}
            </p>
            <ul className="mt-1 flex flex-col gap-1">
              {shown.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => open(n.gameId)}
                    className="block w-full truncate text-left text-sm font-bold text-text-primary hover:underline cursor-pointer"
                  >
                    {n.body}
                  </button>
                </li>
              ))}
            </ul>
            {extra > 0 && (
              <p className="mt-1 text-[11px] font-semibold text-text-muted">+ {extra} more — see all in the bell</p>
            )}
          </div>
          <button
            type="button"
            onClick={dismissAll}
            aria-label="Dismiss"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-bg-surface text-text-muted hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
