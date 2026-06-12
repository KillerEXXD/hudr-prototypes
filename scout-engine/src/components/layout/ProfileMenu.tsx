import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CircleUser, Bookmark, Crown, LogOut, Palette, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCurrentUser } from '@/hooks'
import { useTheme } from '@/contexts/ThemeContext'
import PlayerAvatar from '@/components/player/PlayerAvatar'
import SkinPicker from '@/components/common/SkinPicker'

const ITEMS = [
  { to: '/me', icon: CircleUser, label: 'Profile' },
  { to: '/saved', icon: Bookmark, label: 'Saved' },
  { to: '/subscription', icon: Crown, label: 'Subscription' },
]

// Top-right avatar → account popover. Anchored inline (no portal) so it tracks
// the avatar; a fixed backdrop catches outside clicks. An "Appearance" row opens
// an in-place skin picker sub-view.
export default function ProfileMenu() {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'menu' | 'appearance'>('menu')
  const { data: user } = useCurrentUser()
  const { label: themeLabel } = useTheme()
  if (!user) return null

  const close = () => { setOpen(false); setView('menu') }

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
          <button className="fixed inset-0 z-40 cursor-default" aria-hidden tabIndex={-1} onClick={close} />
          <div role="menu" className="animate-fade-up absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-bg-card shadow-2xl">
            {view === 'menu' ? (
              <>
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
                      onClick={close}
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
                  {/* Appearance → opens the skin picker sub-view */}
                  <button
                    type="button"
                    onClick={() => setView('appearance')}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary cursor-pointer"
                  >
                    <Palette className="h-4 w-4 text-text-muted" />
                    Appearance
                    <span className="ml-auto flex items-center gap-1 text-[11px] text-text-muted">
                      <span className="h-2 w-2 rounded-full bg-accent-blue" /> {themeLabel}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </button>
                </div>
                <div className="border-t border-border p-1.5">
                  <button
                    type="button"
                    onClick={close}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-bg-surface hover:text-text-primary cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 border-b border-border p-2.5">
                  <button type="button" onClick={() => setView('menu')} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-bg-surface cursor-pointer" aria-label="Back"><ChevronLeft className="h-4 w-4" /></button>
                  <h3 className="text-sm font-bold text-text-primary">Appearance</h3>
                </div>
                <div className="p-2.5">
                  <SkinPicker columns={2} />
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
