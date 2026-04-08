import { createContext, useContext, useState, type ReactNode } from 'react'

export type UXMode = 'pulse' | 'nexus' | 'oracle' | 'atlas' | 'prism'

interface ThemeContextType {
  mode: UXMode
  setMode: (mode: UXMode) => void
}

const ThemeContext = createContext<ThemeContextType>({ mode: 'pulse', setMode: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<UXMode>('pulse')
  return <ThemeContext.Provider value={{ mode, setMode }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
