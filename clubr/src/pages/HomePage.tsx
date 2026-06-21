import { useAuth } from '@/contexts/AuthContext'
import { useOnboardingStage } from '@/hooks/useOnboardingStage'
import { DiscoverPage } from '@/pages/DiscoverPage'
import { GetStartedHub } from '@/pages/GetStartedHub'
import { HostHomePage } from '@/pages/HostHomePage'
import { AdminPage } from '@/pages/AdminPage'

// The first tab is role-aware: App Admin → admin console, Club Host → host
// dashboard, Player → Discover. For a brand-new player with no club yet
// (onboarding Stage 0), Home is the focused Get-Started hub, not an empty Discover.
export function HomePage() {
  const { user } = useAuth()
  const { stage } = useOnboardingStage()
  if (user?.role === 'admin') return <AdminPage />
  if (user?.role === 'host') return <HostHomePage />
  if (stage === 'fresh') return <GetStartedHub />
  return <DiscoverPage />
}
