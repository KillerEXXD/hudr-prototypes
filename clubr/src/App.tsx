import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { LoginScreen } from '@/pages/LoginScreen'
import { DiscoverPage } from '@/pages/DiscoverPage'
import { ClubsPage } from '@/pages/ClubsPage'
import { ClubDetailPage } from '@/pages/ClubDetailPage'
import { FantasyPage } from '@/pages/FantasyPage'
import { ContestDetailPage } from '@/pages/ContestDetailPage'
import { LastLongerPage } from '@/pages/LastLongerPage'
import { MePage } from '@/pages/MePage'
import { AdminPage } from '@/pages/AdminPage'

export default function App() {
  const { user } = useAuth()
  if (!user) return <LoginScreen />
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DiscoverPage />} />
        <Route path="/clubs" element={<ClubsPage />} />
        <Route path="/club/:id" element={<ClubDetailPage />} />
        <Route path="/fantasy" element={<FantasyPage />} />
        <Route path="/fantasy/:id" element={<ContestDetailPage />} />
        <Route path="/lastlonger" element={<LastLongerPage />} />
        <Route path="/me" element={<MePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
