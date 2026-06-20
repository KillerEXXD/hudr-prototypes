// =====================================================================
// Selectable skins. The SAME app re-skins wholesale by overriding the
// CSS-variable tokens at runtime (ThemeContext). 'engine' is the default
// (the original dark Scout Engine look); the other five are the light
// bake-off directions. Each carries a small swatch for the picker plus
// optional behavioural `flags` that the report reads.
// =====================================================================

export type ThemeName = 'engine' | 'clarivue' | 'terminal' | 'felt' | 'pulse' | 'edge'

export interface ThemeFlags {
  mono?: boolean          // monospace numerals everywhere (Terminal, Edge)
  density?: boolean       // expose a Compact/Comfortable toggle (Terminal)
  reportFirst?: boolean   // report leads; stat table collapsible (Pulse)
  heroExploits?: boolean  // large screenshot-ready exploit cards (Pulse)
  serifHeadline?: boolean // serif nickname/headline (Felt)
  goldRule?: boolean      // hairline gold detail (Felt)
  singleAccent?: boolean  // near-mono; one accent encodes top severity (Edge)
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
  fira: "'Fira Sans', system-ui, -apple-system, sans-serif",
  firaCode: "'Fira Code', ui-monospace, monospace",
  inter: "'Inter', system-ui, -apple-system, sans-serif",
  plexSans: "'IBM Plex Sans', system-ui, sans-serif",
  plexMono: "'IBM Plex Mono', ui-monospace, monospace",
  jetbrains: "'JetBrains Mono', ui-monospace, monospace",
  jakarta: "'Plus Jakarta Sans', system-ui, sans-serif",
  space: "'Space Grotesk', system-ui, sans-serif",
  fraunces: "'Fraunces', Georgia, 'Times New Roman', serif",
}

export const THEMES: Record<ThemeName, ThemeDef> = {
  engine: {
    name: 'engine', label: 'Midnight', tagline: 'Dark & focused',
    flags: {},
    swatch: { bg: '#0e0e15', accent: '#3b82f6', text: '#f2f2f7' },
    vars: {
      '--color-bg-primary': '#07070b', '--color-bg-secondary': '#0e0e15', '--color-bg-card': '#16161f',
      '--color-bg-surface': '#1e1e2a', '--color-bg-elevated': '#26263420', '--color-border': '#262635', '--color-border-light': '#34344a',
      '--color-text-primary': '#f2f2f7', '--color-text-secondary': '#a1a1b5', '--color-text-muted': '#6b6b82',
      '--color-accent-blue': '#3b82f6', '--color-accent-blue-deep': '#1e40af', '--color-accent-amber': '#f59e0b',
      '--color-accent-emerald': '#10b981', '--color-accent-red': '#ef4444', '--color-accent-purple': '#8b5cf6', '--color-accent-cyan': '#06b6d4',
      '--color-tier-reliable': '#10b981', '--color-tier-tentative': '#f59e0b', '--color-tier-noise': '#6b6b82',
      '--color-sev-critical': '#ef4444', '--color-sev-moderate': '#f59e0b', '--color-sev-minor': '#3b82f6',
      '--font-family-sans': F.fira, '--font-family-mono': F.firaCode, '--font-family-display': F.fira,
    },
  },
  clarivue: {
    name: 'clarivue', label: 'Clarivue', tagline: 'Calm analytical SaaS',
    flags: {},
    swatch: { bg: '#FFFFFF', accent: '#2563EB', text: '#1A2332' },
    vars: {
      '--color-bg-primary': '#FAFBFC', '--color-bg-secondary': '#FFFFFF', '--color-bg-card': '#FFFFFF',
      '--color-bg-surface': '#F1F4F8', '--color-bg-elevated': '#F1F4F8', '--color-border': '#E8ECF1', '--color-border-light': '#DCE2EA',
      '--color-text-primary': '#1A2332', '--color-text-secondary': '#5A6678', '--color-text-muted': '#8A94A6',
      '--color-accent-blue': '#2563EB', '--color-accent-blue-deep': '#1E40AF', '--color-accent-amber': '#E8843C',
      '--color-accent-emerald': '#10B981', '--color-accent-red': '#E8603C', '--color-accent-purple': '#7C5CFC', '--color-accent-cyan': '#0891B2',
      '--color-tier-reliable': '#10B981', '--color-tier-tentative': '#E8843C', '--color-tier-noise': '#9AA4B2',
      '--color-sev-critical': '#E8603C', '--color-sev-moderate': '#E8843C', '--color-sev-minor': '#2563EB',
      '--font-family-sans': F.inter, '--font-family-mono': F.inter, '--font-family-display': F.inter,
    },
  },
  terminal: {
    name: 'terminal', label: 'Terminal', tagline: 'Pro data-tool, light',
    flags: { mono: true, density: true },
    swatch: { bg: '#FFFFFF', accent: '#4F46E5', text: '#0D1117' },
    vars: {
      '--color-bg-primary': '#F7F8FA', '--color-bg-secondary': '#FFFFFF', '--color-bg-card': '#FFFFFF',
      '--color-bg-surface': '#EEF0F3', '--color-bg-elevated': '#EEF0F3', '--color-border': '#E3E6EB', '--color-border-light': '#D5D9E0',
      '--color-text-primary': '#0D1117', '--color-text-secondary': '#46505F', '--color-text-muted': '#79818F',
      '--color-accent-blue': '#4F46E5', '--color-accent-blue-deep': '#3730A3', '--color-accent-amber': '#D8842F',
      '--color-accent-emerald': '#0E9F6E', '--color-accent-red': '#D8602F', '--color-accent-purple': '#6D28D9', '--color-accent-cyan': '#0E7490',
      '--color-tier-reliable': '#0E9F6E', '--color-tier-tentative': '#D8842F', '--color-tier-noise': '#9AA1AB',
      '--color-sev-critical': '#D8602F', '--color-sev-moderate': '#D8842F', '--color-sev-minor': '#4F46E5',
      '--font-family-sans': F.plexSans, '--font-family-mono': F.plexMono, '--font-family-display': F.plexSans,
    },
  },
  // "Felt" variant — premium poker-luxe, DARK pine-felt + chip-gold. This is the
  // locked skin for the clubr-felt build (tokens mirror tokens.json at the repo root).
  // A single disciplined gold accent on deep green felt; no neon, no dollar signs.
  felt: {
    name: 'felt', label: 'Felt', tagline: 'Premium poker-luxe — dark felt, chip-gold',
    flags: { goldRule: true },
    swatch: { bg: '#0B1410', accent: '#E9C46A', text: '#F3F6F2' },
    vars: {
      '--color-bg-primary': '#0B1410', '--color-bg-secondary': '#070D0A', '--color-bg-card': '#11201A',
      '--color-bg-surface': '#16291F', '--color-bg-elevated': '#1E3A2C', '--color-border': '#23382C', '--color-border-light': '#2C4636',
      '--color-text-primary': '#F3F6F2', '--color-text-secondary': '#AFC4B6', '--color-text-muted': '#6E8678',
      // The poker-luxe accent is chip-gold; blue is kept cool/secondary, amber = gold for warmth.
      '--color-accent-blue': '#5AA9E6', '--color-accent-blue-deep': '#2E6FA3', '--color-accent-amber': '#E9C46A',
      '--color-accent-emerald': '#36C98B', '--color-accent-red': '#E5604F', '--color-accent-purple': '#A98BE6', '--color-accent-cyan': '#4FB8C9',
      // chip-gold also drives the brand/primary surfaces via these extra tokens
      '--color-accent-gold': '#E9C46A', '--color-accent-gold-deep': '#C99B3E',
      '--color-tier-reliable': '#36C98B', '--color-tier-tentative': '#E9A23B', '--color-tier-noise': '#6E8678',
      '--color-sev-critical': '#E5604F', '--color-sev-moderate': '#E9A23B', '--color-sev-minor': '#5AA9E6',
      '--font-family-sans': F.inter, '--font-family-mono': F.plexMono, '--font-family-display': F.space,
    },
  },
  pulse: {
    name: 'pulse', label: 'Pulse', tagline: 'Friendly, rec-player-first',
    flags: { reportFirst: true, heroExploits: true },
    swatch: { bg: '#FBFAFC', accent: '#7C5CFC', text: '#2A2440' },
    vars: {
      '--color-bg-primary': '#FBFAFC', '--color-bg-secondary': '#FFFFFF', '--color-bg-card': '#FFFFFF',
      '--color-bg-surface': '#F3F0F9', '--color-bg-elevated': '#F3F0F9', '--color-border': '#EDEAF4', '--color-border-light': '#E0DAEF',
      '--color-text-primary': '#2A2440', '--color-text-secondary': '#6B6580', '--color-text-muted': '#9A93AE',
      '--color-accent-blue': '#7C5CFC', '--color-accent-blue-deep': '#5B3FD6', '--color-accent-amber': '#FF9F43',
      '--color-accent-emerald': '#34D399', '--color-accent-red': '#FF6B5C', '--color-accent-purple': '#A855F7', '--color-accent-cyan': '#22D3EE',
      '--color-tier-reliable': '#34D399', '--color-tier-tentative': '#FF9F43', '--color-tier-noise': '#A8A2B8',
      '--color-sev-critical': '#FF6B5C', '--color-sev-moderate': '#FF9F43', '--color-sev-minor': '#7C5CFC',
      '--font-family-sans': F.jakarta, '--font-family-mono': F.jakarta, '--font-family-display': F.jakarta,
    },
  },
  edge: {
    name: 'edge', label: 'Edge', tagline: 'High-contrast, one accent',
    flags: { mono: true, singleAccent: true },
    swatch: { bg: '#FFFFFF', accent: '#FF4D2E', text: '#101010' },
    vars: {
      '--color-bg-primary': '#FFFFFF', '--color-bg-secondary': '#FFFFFF', '--color-bg-card': '#FFFFFF',
      '--color-bg-surface': '#F4F4F5', '--color-bg-elevated': '#F4F4F5', '--color-border': '#E4E4E7', '--color-border-light': '#D4D4D8',
      '--color-text-primary': '#101010', '--color-text-secondary': '#52525B', '--color-text-muted': '#8A8A92',
      '--color-accent-blue': '#FF4D2E', '--color-accent-blue-deep': '#101010', '--color-accent-amber': '#FF4D2E',
      '--color-accent-emerald': '#101010', '--color-accent-red': '#FF4D2E', '--color-accent-purple': '#101010', '--color-accent-cyan': '#52525B',
      '--color-tier-reliable': '#101010', '--color-tier-tentative': '#8A8A92', '--color-tier-noise': '#C4C4C8',
      '--color-sev-critical': '#FF4D2E', '--color-sev-moderate': '#52525B', '--color-sev-minor': '#8A8A92',
      '--font-family-sans': F.space, '--font-family-mono': F.jetbrains, '--font-family-display': F.space,
    },
  },
}

// This is the "Felt" variant: it ships ONE locked skin. THEME_LIST is intentionally
// just Felt so the skin picker has nothing to switch to (and is hidden in MePage).
export const THEME_LIST: ThemeDef[] = [THEMES.felt]
export const DEFAULT_THEME: ThemeName = 'felt'
