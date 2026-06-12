import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { ChevronLeft, Spade } from 'lucide-react'
import ModeToggle from '@/components/common/ModeToggle'
import ProfileMenu from '@/components/layout/ProfileMenu'
import BottomNav from '@/components/layout/BottomNav'

export default function AppShell() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const atHome = pathname === '/'

  return (
    <div className="min-h-screen bg-bg-primary flex justify-center">
      <div className="relative flex w-full max-w-md flex-col min-h-screen bg-bg-secondary shadow-2xl">
        <header className="sticky top-0 z-30 border-b border-border bg-bg-secondary/85 backdrop-blur supports-[backdrop-filter]:bg-bg-secondary/70">
          <div className="flex items-center justify-between gap-2 px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              {atHome ? (
                <Link to="/" className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-blue to-accent-purple">
                    <Spade className="h-4 w-4 text-white" />
                  </span>
                  <span className="text-sm font-bold tracking-tight">Scout<span className="text-accent-blue">Engine</span></span>
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
              <ModeToggle />
              <ProfileMenu />
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 pb-24 pt-4">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
