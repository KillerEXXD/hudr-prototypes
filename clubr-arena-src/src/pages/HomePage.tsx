import { useAuth } from '@/contexts/AuthContext'
import { ArenaHomePage } from '@/pages/ArenaHomePage'
import { HostHomePage } from '@/pages/HostHomePage'
import { AdminPage } from '@/pages/AdminPage'

// The first tab is role-aware: App Admin → admin console, Club Host → host
// dashboard, Player → the redesigned live-state Arena home.
export function HomePage() {
  const { user } = useAuth()
  if (user?.role === 'admin') return <AdminPage />
  if (user?.role === 'host') return <HostHomePage />
  return <ArenaHomePage />
}
