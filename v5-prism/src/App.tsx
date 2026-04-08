import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import TournamentDetailPage from './pages/TournamentDetailPage'
import PlayerProfilePage from './pages/PlayerProfilePage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
        <Route path="/players/:id" element={<PlayerProfilePage />} />
      </Route>
    </Routes>
  )
}
