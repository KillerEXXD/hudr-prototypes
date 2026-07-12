import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ReferralShell } from '@/referral/ReferralShell'
import { ReferralLogin } from '@/referral/ReferralLogin'
import { ReferralHome } from '@/referral/player/ReferralHome'
import { ReferralDetail } from '@/referral/player/ReferralDetail'
import { ResidualDetail } from '@/referral/player/ResidualDetail'
import { Projector } from '@/referral/player/Projector'
import { Withdraw } from '@/referral/player/Withdraw'
import { AdminHome } from '@/referral/admin/AdminHome'
import { AdminPlayers } from '@/referral/admin/AdminPlayers'
import { AdminPlayerDetail } from '@/referral/admin/AdminPlayerDetail'
import { AdminWithdrawals } from '@/referral/admin/AdminWithdrawals'
import { AdminConfig } from '@/referral/admin/AdminConfig'

export default function App() {
  const { user, realRole } = useAuth()
  if (!user) return <ReferralLogin />
  const isAdmin = realRole === 'admin'
  const home = isAdmin ? '/admin' : '/referrals'
  return (
    <Routes>
      <Route element={<ReferralShell />}>
        {/* Player */}
        <Route path="/referrals" element={<ReferralHome />} />
        <Route path="/referrals/r/:id" element={<ReferralDetail />} />
        <Route path="/referrals/res/:sourceId" element={<ResidualDetail />} />
        <Route path="/referrals/projector" element={<Projector />} />
        <Route path="/referrals/withdraw" element={<Withdraw />} />
        {/* Admin (gated) */}
        <Route path="/admin" element={isAdmin ? <AdminHome /> : <Navigate to="/referrals" replace />} />
        <Route path="/admin/players" element={isAdmin ? <AdminPlayers /> : <Navigate to="/referrals" replace />} />
        <Route path="/admin/players/:id" element={isAdmin ? <AdminPlayerDetail /> : <Navigate to="/referrals" replace />} />
        <Route path="/admin/withdrawals" element={isAdmin ? <AdminWithdrawals /> : <Navigate to="/referrals" replace />} />
        <Route path="/admin/config" element={isAdmin ? <AdminConfig /> : <Navigate to="/referrals" replace />} />
        <Route path="*" element={<Navigate to={home} replace />} />
      </Route>
    </Routes>
  )
}
