import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleUser, Bookmark, Crown, LogOut } from 'lucide-react'
import { useCurrentUser } from '@/hooks'
import PlayerAvatar from '@/components/player/PlayerAvatar'
import { cn } from '@/lib/utils'

const ITEMS = [
  { to: '/me', icon: CircleUser, label: 'Profile' },
  { to: '/saved', icon: Bookmark, label: 'Saved' },
  { to: '/subscription', icon: Crown, label: 'Subscription' },
]

// Top-right avatar → account popover. Anchored inline (no portal) so it tracks
// the avatar; a fixed backdrop catches outside clicks.
export default function ProfileMenu() {
  const [open, setOpen] = useState(false)
  const { data: user } = useCurrentUser()
  if (!user) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="rounded-full ring-2 ring-transparent transition hover:ring-border-light cursor-pointer"
      >
        <PlayerAvatar initials={user.initials} color={user.color} size="sm" />
      </button>

      {open && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" aria-hidden tabIndex={-1} onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="animate-fade-up absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-bg-card shadow-2xl"
          >
            <div className="flex items-center gap-2.5 border-b border-border p-3">
              <PlayerAvatar initials={user.initials} color={user.color} size="md" />
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-text-primary">{user.name}</div>
                <div className="truncate text-[11px] text-text-muted">{user.email}</div>
              </div>
            </div>
            <div className="p-1.5">
              {ITEMS.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary cursor-pointer"
                >
                  <Icon className="h-4 w-4 text-text-muted" />
                  {label}
                  {label === 'Subscription' && (
                    <span className="ml-auto rounded-full bg-accent-blue/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-blue">
                      {user.planId}
                    </span>
                  )}
                </Link>
              ))}
            </div>
            <div className="border-t border-border p-1.5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={cn('flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-bg-surface hover:text-text-primary cursor-pointer')}
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
