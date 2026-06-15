import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { THEMES, THEME_LIST, DEFAULT_THEME, type ThemeName, type ThemeFlags, type ThemeDef } from '@/themes/themes'

// Runtime skin system. The selected skin overrides the CSS-variable tokens on
// <html>, so the whole app re-skins instantly. Persisted to localStorage and
// applied at module load (before first paint) to avoid a flash of the default.
// The key is namespaced per prototype (build base) so each one defaults to
// Scout Engine independently and a skin picked in one demo never bleeds into the
// others (they share the same origin).

const STORAGE_KEY = `clubr-skin:${import.meta.env.BASE_URL}`

function readStored(): ThemeName {
  try {
    const v = localStorage.getItem(STORAGE_KEY) as ThemeName | null
    if (v && v in THEMES) return v
  } catch { /* SSR / disabled storage */ }
  return DEFAULT_THEME
}

function applyTheme(name: ThemeName) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  for (const [k, v] of Object.entries(THEMES[name].vars)) root.style.setProperty(k, v)
  root.setAttribute('data-theme', name)
}

// Apply persisted skin immediately on import (before React mounts).
applyTheme(readStored())

interface ThemeCtx {
  theme: ThemeName
  setTheme: (t: ThemeName) => void
  label: string
  tagline: string
  flags: ThemeFlags
  themes: ThemeDef[]
}

const Ctx = createContext<ThemeCtx | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(readStored)
  const setTheme = useCallback((t: ThemeName) => {
    applyTheme(t)
    try { localStorage.setItem(STORAGE_KEY, t) } catch { /* ignore */ }
    setThemeState(t)
  }, [])
  const def = THEMES[theme]
  return (
    <Ctx.Provider value={{ theme, setTheme, label: def.label, tagline: def.tagline, flags: def.flags, themes: THEME_LIST }}>
      {children}
    </Ctx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
