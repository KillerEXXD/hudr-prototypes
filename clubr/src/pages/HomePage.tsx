import { useAuth } from '@/contexts/AuthContext'
import { useMyClubs } from '@/hooks'
import { useOnboardingStage } from '@/hooks/useOnboardingStage'
import { Spinner } from '@/components/common/ui'
import { DiscoverPage } from '@/pages/DiscoverPage'
import { GetStartedHub } from '@/pages/GetStartedHub'
import { HostHomePage } from '@/pages/HostHomePage'
import { AdminPage } from '@/pages/AdminPage'

// The first tab is role-aware: App Admin → admin console, Club Host → host
// dashboard, Player → Discover. For a brand-new player (onboarding Stage 0), Home
// is the focused Get-Started hub — which also carries the "Waiting on [club]" banner
// once they've requested a club (still no nav until admitted) — never an empty Discover.
export function HomePage() {
  const { user } = useAuth()
  const { stage } = useOnboardingStage()
  const clubs = useMyClubs()
  if (user?.role === 'admin') return <AdminPage />
  if (user?.role === 'host') return <HostHomePage />
  if (stage === 'fresh') {
    if (clubs.isLoading) return <div className="flex min-h-[60dvh] items-center justify-center"><Spinner /></div>
    return <GetStartedHub />
  }
  return <DiscoverPage />
}
