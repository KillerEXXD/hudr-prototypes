import { createContext, useContext, useState, type ReactNode } from 'react'

// =====================================================================
// Dual-mode: "plain" (casual players who don't know stats) vs "pro"
// (stat-literate). A single global toggle drives copy + data density
// across every screen.
// =====================================================================

export type Mode = 'plain' | 'pro'

interface ModeContextType {
  mode: Mode
  setMode: (m: Mode) => void
  toggle: () => void
  isPro: boolean
}

const ModeContext = createContext<ModeContextType>({
  mode: 'pro', setMode: () => {}, toggle: () => {}, isPro: true,
})

// Scout Sharp is Pro-first: there is no Amateur mode and no toggle. The
// context is retained (default 'pro') so existing `isPro` branches resolve
// to the stat-literate path everywhere.
export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>('pro')
  return (
    <ModeContext.Provider value={{ mode, setMode, toggle: () => setMode((m) => (m === 'plain' ? 'pro' : 'plain')), isPro: mode === 'pro' }}>
      {children}
    </ModeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMode() { return useContext(ModeContext) }
