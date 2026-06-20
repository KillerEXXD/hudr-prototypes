import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, UserPlus, CheckCircle2, Gamepad2, PartyPopper } from 'lucide-react'
import { Badge, Sheet, EmptyState } from '@/components/common/ui'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks'
import { GAME_ROUTE } from '@/lib/contract/gameInvite'
import type { AppNotification, NotificationType } from '@/types'

const PAGE = 15 // show the latest 15; "More" reveals the next 15.

// Per-kind icon + colour so each notification type is visually distinct at a
// glance (was all one colour). Tints use accent tokens so they re-skin too.
const STYLE: Record<NotificationType, { icon: typeof UserPlus; color: string; bg: string }> = {
  club_join_request:  { icon: UserPlus,     color: 'text-accent-blue',    bg: 'bg-accent-blue/15' },
  club_join_approved: { icon: CheckCircle2, color: 'text-accent-emerald', bg: 'bg-accent-emerald/15' },
  game_join_request:  { icon: Gamepad2,     color: 'text-accent-purple',  bg: 'bg-accent-purple/15' },
  game_join_approved: { icon: PartyPopper,  color: 'text-accent-amber',   bg: 'bg-accent-amber/15' },
}
const FALLBACK = { icon: Bell, color: 'text-text-secondary', bg: 'bg-bg-surface' }

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
  const [visible, setVisible] = useState(PAGE)
  const { data } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()
  const items = data?.items ?? []
  const unread = data?.unread ?? 0
  const shown = items.slice(0, visible)

  function openPanel() { setVisible(PAGE); setOpen(true) }

  function onTap(n: AppNotification) {
    if (!n.read) markRead.mutate(n.id)
    setOpen(false)
    if (n.gameType && n.gameId) navigate(GAME_ROUTE[n.gameType](n.gameId))
    else if (n.clubId) navigate(`/club/${n.clubId}`)
  }

  return (
    <>
      <button onClick={openPanel} aria-label="Notifications" title="Notifications" className="relative rounded-full p-1.5 hover:bg-bg-surface cursor-pointer">
        <Bell className="h-5 w-5 text-text-secondary" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-red px-1 text-[10px] font-bold leading-none text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Recent notifications">
        {unread > 0 && (
          <button onClick={() => markAll.mutate()} className="mb-2 ml-auto block text-xs font-semibold text-accent-blue hover:underline cursor-pointer">Mark all read</button>
        )}
        {items.length === 0 ? (
          <EmptyState icon={<Bell className="h-7 w-7" />} title="No notifications yet" sub="Join requests and approvals will show up here." />
        ) : (
          <>
            <div className="-mx-1 max-h-[60vh] overflow-y-auto px-1">
              <div className="flex flex-col gap-1.5">
                {shown.map((n) => {
                  const st = STYLE[n.type] ?? FALLBACK
                  const Icon = st.icon
                  return (
                    <button
                      key={n.id}
                      onClick={() => onTap(n)}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer ${n.read ? 'border-border bg-bg-card hover:bg-bg-surface' : 'border-border bg-bg-surface hover:bg-bg-card'}`}
                    >
                      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${st.bg} ${st.color}`}><Icon className="h-4 w-4" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className={`truncate text-sm font-extrabold ${st.color}`}>{n.title}</span>
                          {!n.read && <Badge tone="blue">New</Badge>}
                          <span className="ml-auto shrink-0 text-[11px] text-text-muted">{ago(n.createdAt)}</span>
                        </span>
                        <span className="mt-0.5 block text-xs leading-snug text-text-secondary">{n.body}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            {visible < items.length && (
              <button
                onClick={() => setVisible((v) => v + PAGE)}
                className="mt-2 w-full rounded-lg border border-border bg-bg-surface py-2 text-xs font-bold text-text-secondary transition-colors hover:bg-bg-card hover:text-text-primary cursor-pointer"
              >
                More · {items.length - visible} older
              </button>
            )}
          </>
        )}
      </Sheet>
    </>
  )
}
