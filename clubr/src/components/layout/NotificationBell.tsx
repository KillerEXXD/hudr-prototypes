import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, UserPlus, CheckCircle2 } from 'lucide-react'
import { Badge, Sheet, EmptyState } from '@/components/common/ui'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks'
import type { AppNotification, NotificationType } from '@/types'

const ICON: Record<NotificationType, typeof UserPlus> = {
  club_join_request: UserPlus,
  club_join_approved: CheckCircle2,
}

/** Compact "2m"/"3h"/"5d" relative time; falls back to the date for older items. */
function ago(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (s < 60) return 'now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  if (s < 604800) return `${Math.floor(s / 86400)}d`
  return new Date(iso).toLocaleDateString()
}

export function NotificationBell() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const { data } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()
  const items = data?.items ?? []
  const unread = data?.unread ?? 0

  function onTap(n: AppNotification) {
    if (!n.read) markRead.mutate(n.id)
    setOpen(false)
    if (n.clubId) navigate(`/club/${n.clubId}`)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Notifications" title="Notifications" className="relative rounded-full p-1.5 hover:bg-bg-surface cursor-pointer">
        <Bell className="h-5 w-5 text-text-secondary" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-red px-1 text-[10px] font-bold leading-none text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Notifications">
        {unread > 0 && (
          <button onClick={() => markAll.mutate()} className="mb-2 ml-auto block text-xs font-semibold text-accent-blue hover:underline cursor-pointer">Mark all read</button>
        )}
        {items.length === 0 ? (
          <EmptyState icon={<Bell className="h-7 w-7" />} title="No notifications yet" sub="Join requests and approvals will show up here." />
        ) : (
          <div className="flex flex-col gap-1.5">
            {items.map((n) => {
              const Icon = ICON[n.type] ?? Bell
              return (
                <button
                  key={n.id}
                  onClick={() => onTap(n)}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer ${n.read ? 'border-border bg-bg-card hover:bg-bg-surface' : 'border-accent-blue/40 bg-accent-blue/5 hover:bg-accent-blue/10'}`}
                >
                  <span className={`mt-0.5 ${n.read ? 'text-text-muted' : 'text-accent-blue'}`}><Icon className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-text-primary">{n.title}</span>
                      {!n.read && <Badge tone="blue">New</Badge>}
                      <span className="ml-auto shrink-0 text-[11px] text-text-muted">{ago(n.createdAt)}</span>
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-text-secondary">{n.body}</span>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </Sheet>
    </>
  )
}
