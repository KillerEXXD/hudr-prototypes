import { useState } from 'react'
import { UserPlus, CheckCircle2, Gamepad2, PartyPopper, type LucideIcon } from 'lucide-react'
import { useNotifications } from '@/hooks'
import { cn } from '@/lib/utils/cn'
import type { NotifType } from '@/types'

const PAGE = 8
const STYLE: Record<NotifType, { icon: LucideIcon; text: string; bg: string; title: string }> = {
  club_req: { icon: UserPlus, text: 'text-accent-blue', bg: 'bg-accent-blue/15', title: 'New join request' },
  club_ok: { icon: CheckCircle2, text: 'text-accent-emerald', bg: 'bg-accent-emerald/15', title: 'Approved' },
  game_req: { icon: Gamepad2, text: 'text-accent-violet', bg: 'bg-accent-violet/15', title: 'New game request' },
  game_ok: { icon: PartyPopper, text: 'text-accent-amber', bg: 'bg-accent-amber/15', title: "You're in!" },
}

export function NotificationsPage() {
  const { data: notifs = [] } = useNotifications()
  const [visible, setVisible] = useState(PAGE)
  const shown = notifs.slice(0, visible)

  return (
    <div className="px-4 pb-6 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black tracking-tight">Recent notifications</h1>
        <button className="text-xs font-bold text-accent-blue">Mark all read</button>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        {shown.map((n) => {
          const s = STYLE[n.type]
          return (
            <div key={n.id} className={cn('flex items-start gap-3 rounded-xl border border-border p-3', n.unread ? 'bg-bg-surface' : 'bg-bg-card')}>
              <span className={cn('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg', s.bg, s.text)}><s.icon className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className={cn('truncate text-sm font-extrabold', s.text)}>{s.title}</span>
                  {n.unread && <span className="rounded bg-accent-blue/20 px-1.5 py-0.5 text-[10px] font-bold text-accent-blue">New</span>}
                  <span className="ml-auto shrink-0 text-[11px] text-text-muted">{n.ago}</span>
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-text-secondary">{n.body}</span>
              </span>
            </div>
          )
        })}
      </div>

      {visible < notifs.length && (
        <button onClick={() => setVisible((v) => v + 15)} className="mt-2 w-full rounded-lg border border-border bg-bg-surface py-2 text-xs font-bold text-text-secondary transition hover:bg-bg-card hover:text-text-primary">
          More · {notifs.length - visible} older
        </button>
      )}
    </div>
  )
}
