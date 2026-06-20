import { useState } from 'react'
import { GamesFeed } from './screens/GamesFeed'
import { FtDraft } from './screens/FtDraft'
import { ClubDetail } from './screens/ClubDetail'
import { Notifications } from './screens/Notifications'
import { Onboarding } from './screens/Onboarding'
import { Results } from './screens/Results'

type Screen = 'login' | 'games' | 'draft' | 'club' | 'alerts' | 'results'

const NAV: { key: Screen; label: string; icon: string }[] = [
  { key: 'games', label: 'Games', icon: '🎮' },
  { key: 'draft', label: 'Draft', icon: '🃏' },
  { key: 'club', label: 'Club', icon: '♣' },
  { key: 'alerts', label: 'Alerts', icon: '🔔' },
  { key: 'results', label: 'Results', icon: '🏆' },
]

export function App() {
  const [screen, setScreen] = useState<Screen>('login')

  const body = {
    login: <Onboarding onEnter={() => setScreen('games')} />,
    games: <GamesFeed onOpenDraft={() => setScreen('draft')} onOpenClub={() => setScreen('club')} />,
    draft: <FtDraft />,
    club: <ClubDetail onOpenGame={() => setScreen('draft')} />,
    alerts: <Notifications />,
    results: <Results />,
  }[screen]

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-[#07070b] py-0 sm:py-6 font-sans">
      <div className="relative flex h-[100svh] w-full max-w-[430px] flex-col overflow-hidden bg-[#0a0a0f] text-white sm:h-[900px] sm:rounded-[2.2rem] sm:border sm:border-white/10 sm:shadow-2xl">
        {/* screen */}
        <div className="flex-1 overflow-y-auto">{body}</div>

        {/* bottom nav (hidden on login) */}
        {screen !== 'login' && (
          <nav className="flex shrink-0 items-center justify-around border-t border-white/10 bg-zinc-950/90 px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
            {NAV.map((n) => {
              const on = screen === n.key
              return (
                <button key={n.key} onClick={() => setScreen(n.key)} className={`flex w-14 flex-col items-center gap-0.5 rounded-xl py-1 text-[10px] font-semibold transition ${on ? 'text-sky-400' : 'text-zinc-500'}`}>
                  <span className={`text-lg leading-none transition ${on ? 'scale-110' : ''}`}>{n.icon}</span>
                  {n.label}
                </button>
              )
            })}
          </nav>
        )}
      </div>
      <p className="mt-3 hidden text-xs text-zinc-600 sm:block">ClubrGo redesign prototype · mock data · tap the bottom nav to tour all screens</p>
    </div>
  )
}
