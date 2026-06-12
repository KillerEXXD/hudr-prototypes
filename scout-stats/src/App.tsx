import { Routes, Route } from 'react-router-dom'
import { ModeProvider } from './contexts/ModeContext'
import AppShell from './components/layout/AppShell'
import FindPage from './pages/FindPage'
import TournamentPage from './pages/TournamentPage'
import ScoutingPage from './pages/ScoutingPage'
import PlayersPage from './pages/PlayersPage'
import TournamentsPage from './pages/TournamentsPage'
import AskAIPage from './pages/AskAIPage'
import ProfilePage from './pages/ProfilePage'
import SavedPage from './pages/SavedPage'
import SubscriptionPage from './pages/SubscriptionPage'
import TournamentPlayerStatsPage from './pages/TournamentPlayerStatsPage'

export default function App() {
  return (
    <ModeProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<FindPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/tournaments" element={<TournamentsPage />} />
          <Route path="/ai" element={<AskAIPage />} />
          <Route path="/tournament/:id" element={<TournamentPage />} />
          <Route path="/tournament/:tid/player/:pid" element={<TournamentPlayerStatsPage />} />
          <Route path="/player/:id" element={<ScoutingPage />} />
          <Route path="/me" element={<ProfilePage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
        </Route>
      </Routes>
    </ModeProvider>
  )
}
