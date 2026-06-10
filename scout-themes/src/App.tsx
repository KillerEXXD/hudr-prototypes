import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { ModeProvider } from './contexts/ModeContext'
import AppShell from './components/layout/AppShell'
import FindPage from './pages/FindPage'
import TournamentPage from './pages/TournamentPage'
import ScoutingPage from './pages/ScoutingPage'

export default function App() {
  return (
    <ThemeProvider>
      <ModeProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<FindPage />} />
            <Route path="/tournament/:id" element={<TournamentPage />} />
            <Route path="/player/:id" element={<ScoutingPage />} />
          </Route>
        </Routes>
      </ModeProvider>
    </ThemeProvider>
  )
}
