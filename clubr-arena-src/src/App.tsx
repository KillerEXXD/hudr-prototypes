import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { AppShell } from '@/components/layout/AppShell'
import { LoginScreen } from '@/pages/LoginScreen'
import { HomePage } from '@/pages/HomePage'
import { ClubsPage } from '@/pages/ClubsPage'
import { JoinClubsPage } from '@/pages/JoinClubsPage'
import { ClubDetailPage } from '@/pages/ClubDetailPage'
import { FantasyPage } from '@/pages/FantasyPage'
import { GamesPage } from '@/pages/GamesPage'
import { HostFTPage } from '@/pages/HostFTPage'
import { ContestDetailPage } from '@/pages/ContestDetailPage'
import { LastLongerPage } from '@/pages/LastLongerPage'
import { LastLongerGamePage } from '@/pages/LastLongerGamePage'
import { SquaresGamePage } from '@/pages/SquaresGamePage'
import { MePage } from '@/pages/MePage'
import { WalletPage } from '@/pages/WalletPage'
import { AdminPage } from '@/pages/AdminPage'
import { MemberPage } from '@/pages/MemberPage'
import { LedgerPage } from '@/pages/LedgerPage'

export default function App() {
  const { user } = useAuth()
  if (!user) return <LoginScreen />
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/clubs" element={<ClubsPage />} />
        <Route path="/discover/clubs" element={<JoinClubsPage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/club/:id" element={<ClubDetailPage />} />
        <Route path="/fantasy" element={<FantasyPage />} />
        {/* The operator FT slate is host/admin only — players never see it. */}
        <Route path="/host-ft" element={user.role === 'player' ? <Navigate to="/" replace /> : <HostFTPage />} />
        <Route path="/fantasy/:id" element={<ContestDetailPage />} />
        <Route path="/lastlonger" element={<LastLongerPage />} />
        <Route path="/lastlonger/:id" element={<LastLongerGamePage />} />
        <Route path="/squares/:id" element={<SquaresGamePage />} />
        {/* Unified game-detail entry points the redesigned cards link to. They
            render the same canonical detail pages, so the one game-detail spine
            serves every type while the original manifest routes stay valid. */}
        <Route path="/g/ft/:id" element={<ContestDetailPage />} />
        <Route path="/g/ll/:id" element={<LastLongerGamePage />} />
        <Route path="/g/sq/:id" element={<SquaresGamePage />} />
        <Route path="/ledger" element={<LedgerPage />} />
        <Route path="/me" element={<MePage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/member/:id" element={<MemberPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
