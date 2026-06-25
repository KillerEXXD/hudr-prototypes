import { X } from 'lucide-react'
import { Card } from '@/components/common/ui'
import type { AppNotification } from '@/types'

/**
 * Member-facing banner (BUG-912): the host rejected one or more of your pending
 * squares, with their reason. Driven by unread `square_rejected` notifications (the
 * same source the bell uses) — never chat, so the reject stays private to you. Each
 * notification body already reads "Your square (R3·C5) on {game} wasn't approved —
 * {reason}". Dismiss marks the notification read (clears the banner + the bell item).
 */
export function SquaresRejectionBanner({ rejections, onDismiss, canClaimMore }: {
  rejections: AppNotification[]
  onDismiss: (id: string) => void
  canClaimMore: boolean
}) {
  if (rejections.length === 0) return null
  return (
    <Card className="mt-3 flex items-start gap-2 border-accent-red/30 bg-accent-red/10">
      <X className="mt-0.5 h-5 w-5 shrink-0 text-accent-red" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-text-primary">
          {rejections.length > 1 ? 'Some of your squares weren’t approved' : 'Your square wasn’t approved'}
        </p>
        <ul className="mt-1 flex flex-col gap-1.5">
          {rejections.map((n) => (
            <li key={n.id} className="flex items-start justify-between gap-2">
              <span className="min-w-0 break-words text-xs leading-snug text-text-secondary">{n.body}</span>
              <button type="button" onClick={() => onDismiss(n.id)} title="Dismiss" className="shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold text-text-muted hover:bg-bg-surface hover:text-text-primary cursor-pointer">Dismiss</button>
            </li>
          ))}
        </ul>
        {canClaimMore && <p className="mt-1 text-[11px] text-text-muted">You can claim another empty square.</p>}
      </div>
    </Card>
  )
}
