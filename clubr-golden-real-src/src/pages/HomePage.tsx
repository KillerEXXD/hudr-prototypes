import { useAuth } from '@/contexts/AuthContext'
import { FeltGamesFeed } from '@/pages/FeltGamesFeed'
import { AdminPage } from '@/pages/AdminPage'

// The first tab is role-aware: App Admin → admin console, Club Host → host
// dashboard, Player → Discover (browse clubs + host-created games).
export function HomePage() {
  const { user } = useAuth()
  if (user?.role === 'admin') return <AdminPage />
  // The ClubrGo JSX Games Feed is the landing for players and hosts alike.
  return <FeltGamesFeed />
}
