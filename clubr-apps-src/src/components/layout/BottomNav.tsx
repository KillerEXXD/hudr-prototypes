import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Users, BarChart3, CircleUser, Plus } from 'lucide-react'
import { useState } from 'react'
import { CreateGameSheet } from '@/components/games/CreateGameSheet'
import { cn } from '@/lib/utils/cn'

/**
 * Apps-shell bottom dock: 5 surfaces with a raised CENTER button.
 *   Home  ·  Clubs  ·  [ + ]  ·  Board  ·  Me
 *
 * The center [+] opens a small sheet that lets the player pick which game
 * type to create — single global Create entry, no per-page CTAs.
 */
export function BottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)

  const items = [
    { id: 'home', to: '/', label: 'Home', icon: Home, match: (p: string) => p === '/' },
    { id: 'clubs', to: '/clubs', label: 'Clubs', icon: Users, match: (p: string) => p === '/clubs' || p.startsWith('/club/') || p.startsWith('/discover') },
    { id: 'create', center: true as const, icon: Plus, label: 'Create' },
    { id: 'board', to: '/leaderboard', label: 'Board', icon: BarChart3, match: (p: string) => p.startsWith('/leaderboard') },
    { id: 'me', to: '/me', label: 'Me', icon: CircleUser, match: (p: string) => p.startsWith('/me') || p.startsWith('/admin') || p.startsWith('/wallet') },
  ]

  return (
    <>
      <nav className="sticky bottom-0 z-30 border-t border-border/40 bg-bg-secondary/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-end justify-around px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          {items.map((it) => {
            const Icon = it.icon
            if (it.center) {
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  aria-label="Create a game"
                  className="relative -mt-7 flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-br from-accent-blue to-blue-700 text-white shadow-lg shadow-accent-blue/40 ring-2 ring-bg-primary transition-transform active:scale-95"
                >
                  <Icon className="h-6 w-6" strokeWidth={2.5} />
                </button>
              )
            }
            const active = it.match!(pathname)
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => navigate(it.to!)}
                className={cn(
                  'flex cursor-pointer flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-bold transition-colors',
                  active ? 'text-accent-gold' : 'text-text-muted hover:text-text-secondary',
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                {it.label}
              </button>
            )
          })}
        </div>
      </nav>
      <CreateGameSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}
