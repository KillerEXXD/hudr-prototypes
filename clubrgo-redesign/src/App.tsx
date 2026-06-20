import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { OnboardingPage } from '@/pages/OnboardingPage'
import { GamesPage } from '@/pages/GamesPage'
import { FtDraftPage } from '@/pages/FtDraftPage'
import { ClubDetailPage } from '@/pages/ClubDetailPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { ResultsPage } from '@/pages/ResultsPage'

// Same shape as the ClubR app: no user -> login (Onboarding); else routed pages
// under a shared AppShell layout.
export default function App() {
  const { user } = useAuth()
  if (!user) return <OnboardingPage />
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<GamesPage />} />
        <Route path="/draft" element={<FtDraftPage />} />
        <Route path="/club" element={<ClubDetailPage />} />
        <Route path="/alerts" element={<NotificationsPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
