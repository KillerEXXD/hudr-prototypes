import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { LoginScreen } from '@/pages/LoginScreen'
import { HomePage } from '@/pages/HomePage'
import { ClubsPage } from '@/pages/ClubsPage'
import { ClubDetailPage } from '@/pages/ClubDetailPage'
import { FantasyPage } from '@/pages/FantasyPage'
import { GamesPage } from '@/pages/GamesPage'
import { HostFTPage } from '@/pages/HostFTPage'
import { ContestDetailPage } from '@/pages/ContestDetailPage'
import { LastLongerPage } from '@/pages/LastLongerPage'
import { LastLongerGamePage } from '@/pages/LastLongerGamePage'
import { MePage } from '@/pages/MePage'
import { AdminPage } from '@/pages/AdminPage'
import { MemberPage } from '@/pages/MemberPage'

export default function App() {
  const { user } = useAuth()
  if (!user) return <LoginScreen />
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/clubs" element={<ClubsPage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/club/:id" element={<ClubDetailPage />} />
        <Route path="/fantasy" element={<FantasyPage />} />
        {/* The operator FT slate is host/admin only — players never see it. */}
        <Route path="/host-ft" element={user.role === 'player' ? <Navigate to="/" replace /> : <HostFTPage />} />
        <Route path="/fantasy/:id" element={<ContestDetailPage />} />
        <Route path="/lastlonger" element={<LastLongerPage />} />
        <Route path="/lastlonger/:id" element={<LastLongerGamePage />} />
        <Route path="/me" element={<MePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/member/:id" element={<MemberPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
