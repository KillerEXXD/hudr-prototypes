import { useLocation, useNavigate } from 'react-router-dom'
import { Compass, Home, Users, Gamepad2, CircleUser } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useOnboardingStage } from '@/hooks/useOnboardingStage'
import type { NavTab } from '@/lib/onboarding/resolveOnboarding'
import { cn } from '@/lib/utils/cn'

const REST = [
  { tab: 'clubs' as NavTab, to: '/clubs', label: 'Clubs', icon: Users, match: (p: string) => p === '/clubs' || p.startsWith('/club/') },
  { tab: 'games' as NavTab, to: '/games', label: 'Games', icon: Gamepad2, match: (p: string) => p.startsWith('/games') || p.startsWith('/fantasy') || p.startsWith('/lastlonger') || p.startsWith('/squares') },
  { tab: 'me' as NavTab, to: '/me', label: 'Me', icon: CircleUser, match: (p: string) => p.startsWith('/me') || p.startsWith('/admin') },
]

export function BottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  // Progressive reveal: only the tabs the user has earned (Home always; Clubs+Games on
  // a confirmed club; Me after the first settled game). See useOnboardingStage.
  const { unlockedTabs } = useOnboardingStage()
  // First tab is role-aware: Players browse via "Discover"; Hosts & Admins land on "Home".
  // /host-ft (choose-an-FT-to-host) is reached from the host Home, so it keeps Home lit.
  const first = user?.role === 'player'
    ? { tab: 'home' as NavTab, to: '/', label: 'Discover', icon: Compass, match: (p: string) => p === '/' }
    : { tab: 'home' as NavTab, to: '/', label: 'Home', icon: Home, match: (p: string) => p === '/' || p.startsWith('/host-ft') }
  const ITEMS = [first, ...REST].filter((it) => unlockedTabs.includes(it.tab))
  // A lone Home tab reads as a broken nav — hide the bar entirely until a 2nd tab unlocks.
  if (ITEMS.length < 2) return null
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
