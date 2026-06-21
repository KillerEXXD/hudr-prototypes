import { useAuth } from '@/contexts/AuthContext'
import { useMyClubs } from '@/hooks'
import { useOnboardingStage } from '@/hooks/useOnboardingStage'
import { FeltGamesFeed } from '@/pages/FeltGamesFeed'
import { GetStartedHub } from '@/pages/GetStartedHub'
import { ClubPendingSurface } from '@/pages/ClubPendingSurface'
import { HostHomePage } from '@/pages/HostHomePage'
import { AdminPage } from '@/pages/AdminPage'

// Role-aware home with the canonical onboarding gate. Admin → admin console,
// Host → host dashboard. Fresh players (no clubs) get GetStartedHub or
// ClubPendingSurface (when a join request is waiting on the host); everyone
// else lands on the ClubrGo JSX Games Feed (FeltGamesFeed), Golden Real's
// distinctive steady-state home.
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
  return <FeltGamesFeed />
}
