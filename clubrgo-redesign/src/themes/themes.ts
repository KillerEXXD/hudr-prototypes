// =====================================================================
// ClubrGo — Nocturne: a SINGLE skin. The app keeps ClubR's runtime theme
// plumbing (ThemeContext overrides CSS-variable tokens on <html>), but there
// is exactly one skin — the dark, premium "Nocturne" direction — so there is
// no picker. The token/flag shapes are preserved so nothing downstream changes.
// =====================================================================

export type ThemeName = 'nocturne'

export interface ThemeFlags {
  mono?: boolean
  density?: boolean
  reportFirst?: boolean
  heroExploits?: boolean
  serifHeadline?: boolean
  goldRule?: boolean
  singleAccent?: boolean
}

export interface ThemeSwatch { bg: string; accent: string; text: string }

export interface ThemeDef {
  name: ThemeName
  label: string
  tagline: string
  vars: Record<string, string>
  flags: ThemeFlags
  swatch: ThemeSwatch
}

const F = {
  jakarta: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  firaCode: "'Fira Code', ui-monospace, monospace",
}

export const THEMES: Record<ThemeName, ThemeDef> = {
  nocturne: {
    name: 'nocturne', label: 'Nocturne', tagline: 'Dark & premium',
    flags: {},
    swatch: { bg: '#0c0c12', accent: '#38bdf8', text: '#f4f4f8' },
    vars: {
      '--color-bg-primary': '#07070b', '--color-bg-secondary': '#0c0c12', '--color-bg-card': '#14141c',
      '--color-bg-surface': '#1d1d28', '--color-bg-elevated': '#24243220', '--color-border': '#262633', '--color-border-light': '#343444',
      '--color-text-primary': '#f4f4f8', '--color-text-secondary': '#a6a6b8', '--color-text-muted': '#6c6c80',
      '--color-accent-blue': '#38bdf8', '--color-accent-blue-deep': '#0ea5e9', '--color-accent-amber': '#f59e0b',
      '--color-accent-emerald': '#10b981', '--color-accent-red': '#f43f5e', '--color-accent-purple': '#8b5cf6', '--color-accent-cyan': '#22d3ee',
      '--color-tier-reliable': '#10b981', '--color-tier-tentative': '#f59e0b', '--color-tier-noise': '#6c6c80',
      '--color-sev-critical': '#f43f5e', '--color-sev-moderate': '#f59e0b', '--color-sev-minor': '#38bdf8',
      '--font-family-sans': F.jakarta, '--font-family-mono': F.firaCode, '--font-family-display': F.jakarta,
    },
  },
}

export const THEME_LIST: ThemeDef[] = Object.values(THEMES)
export const DEFAULT_THEME: ThemeName = 'nocturne'
