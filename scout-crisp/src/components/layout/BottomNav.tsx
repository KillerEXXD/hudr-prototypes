import { Compass, Users, Trophy, Sparkles } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

// 4 content/discovery destinations. Detail routes light up their parent tab
// (e.g. /player/:id → Players, /tournament/:id → Tournaments). Account items
// (Profile / Saved / Subscription) live in the top-right ProfileMenu instead.
const navItems = [
  { to: '/', icon: Compass, label: 'Discover', match: (p: string) => p === '/' },
  { to: '/players', icon: Users, label: 'Players', match: (p: string) => p === '/players' || p.startsWith('/player/') },
  { to: '/tournaments', icon: Trophy, label: 'Tournaments', match: (p: string) => p === '/tournaments' || p.startsWith('/tournament/') },
  { to: '/ai', icon: Sparkles, label: 'AI', match: (p: string) => p.startsWith('/ai') },
]

export default function BottomNav() {
  const { pathname } = useLocation()
  return (
    <nav className="sticky bottom-0 z-40 border-t border-border bg-bg-secondary/90 backdrop-blur supports-[backdrop-filter]:bg-bg-secondary/75">
      <div className="flex items-stretch justify-around px-1 py-1.5">
        {navItems.map(({ to, icon: Icon, label, match }) => {
          const active = match(pathname)
          return (
            <Link
              key={label}
              to={to}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1 transition-colors',
                active ? 'text-accent-blue' : 'text-text-muted hover:text-text-secondary',
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
