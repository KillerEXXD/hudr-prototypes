import { useLocation, useNavigate } from 'react-router-dom'
import { Compass, Home, Users, Target, Timer, CircleUser } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils/cn'

const REST = [
  { to: '/clubs', label: 'Clubs', icon: Users, match: (p: string) => p === '/clubs' || p.startsWith('/club/') },
  { to: '/fantasy', label: 'Fantasy', icon: Target, match: (p: string) => p.startsWith('/fantasy') || p.startsWith('/host-ft') },
  { to: '/lastlonger', label: 'Last Longer', icon: Timer, match: (p: string) => p.startsWith('/lastlonger') },
  { to: '/me', label: 'Me', icon: CircleUser, match: (p: string) => p.startsWith('/me') || p.startsWith('/admin') },
]

export function BottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  // First tab is role-aware: Players browse via "Discover"; Hosts & Admins land on "Home".
  const first = user?.role === 'player'
    ? { to: '/', label: 'Discover', icon: Compass, match: (p: string) => p === '/' }
    : { to: '/', label: 'Home', icon: Home, match: (p: string) => p === '/' }
  const ITEMS = [first, ...REST]
  return (
    <nav className="sticky bottom-0 z-30 border-t border-border bg-bg-secondary/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch">
        {ITEMS.map((it) => {
          const active = it.match(pathname)
          const Icon = it.icon
          return (
            <button
              key={it.to}
              onClick={() => navigate(it.to)}
              className={cn('flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors cursor-pointer', active ? 'text-accent-blue' : 'text-text-muted hover:text-text-secondary')}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              {it.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
