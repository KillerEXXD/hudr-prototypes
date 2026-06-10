import { createContext, useContext, type ReactNode } from 'react'
import { THEMES, ACTIVE_THEME, type ThemeName, type ThemeFlags } from '@/themes/themes'

// Apply the build-selected theme's tokens at module load (before first paint,
// so there's no dark-default flash), then expose flags via context.
const def = THEMES[ACTIVE_THEME]
if (typeof document !== 'undefined') {
  const root = document.documentElement
  for (const [k, v] of Object.entries(def.vars)) root.style.setProperty(k, v)
  root.setAttribute('data-theme', def.name)
}

interface ThemeCtx { theme: ThemeName; label: string; tagline: string; flags: ThemeFlags }
const Ctx = createContext<ThemeCtx>({ theme: def.name, label: def.label, tagline: def.tagline, flags: def.flags })

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <Ctx.Provider value={{ theme: def.name, label: def.label, tagline: def.tagline, flags: def.flags }}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() { return useContext(Ctx) }
