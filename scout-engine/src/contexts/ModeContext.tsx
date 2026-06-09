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
  mode: 'plain', setMode: () => {}, toggle: () => {}, isPro: false,
})

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>('plain')
  return (
    <ModeContext.Provider value={{ mode, setMode, toggle: () => setMode((m) => (m === 'plain' ? 'pro' : 'plain')), isPro: mode === 'pro' }}>
      {children}
    </ModeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMode() { return useContext(ModeContext) }
