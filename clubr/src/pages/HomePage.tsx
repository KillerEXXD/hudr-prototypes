import { useAuth } from '@/contexts/AuthContext'
import { useMyClubs } from '@/hooks'
import { useOnboardingStage } from '@/hooks/useOnboardingStage'
import { DiscoverPage } from '@/pages/DiscoverPage'
import { GetStartedHub } from '@/pages/GetStartedHub'
import { ClubPendingSurface } from '@/pages/ClubPendingSurface'
import { HostHomePage } from '@/pages/HostHomePage'
import { AdminPage } from '@/pages/AdminPage'

// The first tab is role-aware: App Admin → admin console, Club Host → host
// dashboard, Player → Discover. For a brand-new player (onboarding Stage 0), Home
// is the focused Get-Started hub — or, once they've requested a club, the warm
// "waiting on [club]" pending surface — never an empty Discover.
export function HomePage() {
  const { user } = useAuth()
  const { stage } = useOnboardingStage()
  const clubs = useMyClubs()
  if (user?.role === 'admin') return <AdminPage />
  if (user?.role === 'host') return <HostHomePage />
  if (stage === 'fresh') {
    const hasPending = (clubs.data ?? []).some((c) => c.myStatus === 'pending')
    return hasPending ? <ClubPendingSurface /> : <GetStartedHub />
  }
  return <DiscoverPage />
}
