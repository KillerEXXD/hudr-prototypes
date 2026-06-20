import { useAuth } from '@/contexts/AuthContext'
import { RailHomePage } from '@/pages/RailHomePage'
import { HostHomePage } from '@/pages/HostHomePage'
import { AdminPage } from '@/pages/AdminPage'

// The first tab is role-aware: App Admin → admin console, Club Host → host
// dashboard, Player → Discover (browse clubs + host-created games).
export function HomePage() {
  const { user } = useAuth()
  if (user?.role === 'admin') return <AdminPage />
  if (user?.role === 'host') return <HostHomePage />
  return <RailHomePage />
}
