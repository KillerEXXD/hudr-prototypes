import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { THEMES, THEME_LIST, DEFAULT_THEME, type ThemeName, type ThemeFlags, type ThemeDef } from '@/themes/themes'

// Runtime skin system. The selected skin overrides the CSS-variable tokens on
// <html>, so the whole app re-skins instantly. Persisted to localStorage and
// applied at module load (before first paint) to avoid a flash of the default.
// The key is namespaced per prototype (build base) so each one defaults to
// Scout Engine independently and a skin picked in one demo never bleeds into the
// others (they share the same origin).

const STORAGE_KEY = `clubr-skin:${import.meta.env.BASE_URL}`
const EPOCH_KEY = `clubr-skin-epoch:${import.meta.env.BASE_URL}`

// Force-reset lever. Bump this (or set VITE_SKIN_EPOCH) whenever the DB is wiped to
// push EVERY browser back to the default skin on its next load, independent of auth.
const SKIN_EPOCH = import.meta.env.VITE_SKIN_EPOCH || '2026-06-24'

function enforceSkinEpoch() {
  try {
    if (localStorage.getItem(EPOCH_KEY) !== SKIN_EPOCH) {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.setItem(EPOCH_KEY, SKIN_EPOCH)
    }
  } catch { /* SSR / disabled storage */ }
}

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

// Force-reset stale skins (DB wipe) first, then apply the persisted skin on import.
enforceSkinEpoch()
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
  // The skin lives in localStorage, which outlives a server-side DB reset — so a
  // fresh account in the same browser would inherit the last-used skin. AuthContext
  // dispatches 'clubr:skin-reset' on logout / new account; drop back to default.
  useEffect(() => {
    const reset = () => setTheme(DEFAULT_THEME)
    window.addEventListener('clubr:skin-reset', reset)
    return () => window.removeEventListener('clubr:skin-reset', reset)
  }, [setTheme])
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
