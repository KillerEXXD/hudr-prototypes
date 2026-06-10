import { useState } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { ChevronLeft, Spade } from 'lucide-react'
import ModeToggle from '@/components/common/ModeToggle'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

// Terminal-only Compact/Comfortable density toggle. Scales the root font-size,
// so all rem-based spacing/type tightens together (clean, global density).
function DensityToggle() {
  const [compact, setCompact] = useState(false)
  const set = (c: boolean) => {
    setCompact(c)
    document.documentElement.dataset.density = c ? 'compact' : 'comfortable'
  }
  return (
    <div className="flex items-center rounded-md border border-border bg-bg-surface/60 p-0.5 text-[10px] font-semibold">
      {([['Comfortable', false], ['Compact', true]] as const).map(([label, c]) => (
        <button
          key={label}
          onClick={() => set(c)}
          className={cn('rounded px-1.5 py-0.5 transition-colors cursor-pointer', compact === c ? 'bg-accent-blue text-white' : 'text-text-muted')}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default function AppShell() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { label, flags } = useTheme()
  const atHome = pathname === '/'

  return (
    <div className="min-h-screen bg-bg-primary flex justify-center">
      <div className="relative w-full max-w-md min-h-screen bg-bg-secondary shadow-2xl">
        <header className="sticky top-0 z-30 border-b border-border bg-bg-secondary/85 backdrop-blur supports-[backdrop-filter]:bg-bg-secondary/70">
          <div className="flex items-center justify-between gap-2 px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              {atHome ? (
                <Link to="/" className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple">
                    <Spade className="h-4 w-4 text-white" />
                  </span>
                  <span className="text-sm font-bold tracking-tight" style={flags.serifHeadline ? { fontFamily: 'var(--font-family-display)' } : undefined}>
                    Scout<span className="text-accent-blue"> · {label}</span>
                  </span>
                </Link>
              ) : (
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-text-secondary hover:bg-bg-surface hover:text-text-primary cursor-pointer transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {flags.density && <DensityToggle />}
              <ModeToggle />
            </div>
          </div>
        </header>
        <main className="px-4 pb-24 pt-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
