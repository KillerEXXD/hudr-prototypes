import { NavLink, Outlet } from 'react-router-dom'
import { Gamepad2, Layers, Users, Bell, Trophy, Coins, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useCredits, useNotifications } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'

const NAV: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'Games', icon: Gamepad2, end: true },
  { to: '/draft', label: 'Draft', icon: Layers },
  { to: '/club', label: 'Club', icon: Users },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/results', label: 'Results', icon: Trophy },
]

export function AppShell() {
  const { user } = useAuth()
  const { data: credits } = useCredits()
  const { data: notifs } = useNotifications()
  const unread = (notifs ?? []).filter((n) => n.unread).length

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-bg-primary py-0 sm:py-6">
      <div className="relative flex h-[100svh] w-full max-w-[430px] flex-col overflow-hidden bg-bg-primary text-text-primary sm:h-[900px] sm:rounded-[2.2rem] sm:border sm:border-border sm:shadow-2xl">
        {/* shared header */}
        <header className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-1 text-lg font-black tracking-tight">
            <span className="text-accent-blue">♣</span>Clubr<span className="text-accent-blue">GO</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1 rounded-full bg-accent-amber/15 px-2.5 py-1 text-xs font-bold text-accent-amber ring-1 ring-accent-amber/30"><Coins className="h-3.5 w-3.5" />{credits ?? '—'}</span>
            <NavLink to="/alerts" className="relative text-text-secondary">
              <Bell className="h-5 w-5" />
              {unread > 0 && <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent-red px-1 text-[10px] font-bold text-white">{unread}</span>}
            </NavLink>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-accent-blue text-xs font-bold text-white">{user?.name?.split(' ').map((x) => x[0]).join('') ?? 'GO'}</div>
          </div>
        </header>

        {/* routed page */}
        <main className="animate-fade-up flex-1 overflow-y-auto no-scrollbar"><Outlet /></main>

        {/* bottom nav */}
        <nav className="flex shrink-0 items-center justify-around border-t border-border bg-bg-secondary/90 px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => cn('flex w-14 flex-col items-center gap-0.5 rounded-xl py-1 text-[10px] font-semibold transition', isActive ? 'text-accent-blue' : 'text-text-muted')}>
              {({ isActive }) => (<><n.icon className={cn('h-5 w-5 transition', isActive && 'scale-110')} />{n.label}</>)}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
