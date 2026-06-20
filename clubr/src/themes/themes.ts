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
  // 'Midnight' retuned to the premium poker-luxe FELT skin (dark pine-felt +
  // chip-gold), the default. Mirrors the live app (HudrTechLLC/Clubr #174).
  engine: {
    name: 'engine', label: 'Midnight', tagline: 'Premium poker-luxe — dark felt, chip-gold',
    flags: { goldRule: true },
    swatch: { bg: '#0B1410', accent: '#E9C46A', text: '#F3F6F2' },
    vars: {
      '--color-bg-primary': '#0B1410', '--color-bg-secondary': '#070D0A', '--color-bg-card': '#11201A',
      '--color-bg-surface': '#16291F', '--color-bg-elevated': '#1E3A2C', '--color-border': '#23382C', '--color-border-light': '#2C4636',
      '--color-text-primary': '#F3F6F2', '--color-text-secondary': '#AFC4B6', '--color-text-muted': '#6E8678',
      '--color-accent-blue': '#5AA9E6', '--color-accent-blue-deep': '#2E6FA3', '--color-accent-amber': '#E9C46A',
      '--color-accent-emerald': '#36C98B', '--color-accent-red': '#E5604F', '--color-accent-purple': '#A98BE6', '--color-accent-cyan': '#4FB8C9',
      '--color-accent-gold': '#E9C46A', '--color-accent-gold-deep': '#C99B3E',
      '--color-tier-reliable': '#36C98B', '--color-tier-tentative': '#E9A23B', '--color-tier-noise': '#6E8678',
      '--color-sev-critical': '#E5604F', '--color-sev-moderate': '#E9A23B', '--color-sev-minor': '#5AA9E6',
      '--font-family-sans': F.inter, '--font-family-mono': F.plexMono, '--font-family-display': F.space,
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
  felt: {
    name: 'felt', label: 'Midnight Light', tagline: 'Premium poker, light cream',
    flags: { serifHeadline: true, goldRule: true },
    swatch: { bg: '#F6F4EF', accent: '#1B5E47', text: '#14241C' },
    vars: {
      '--color-bg-primary': '#F6F4EF', '--color-bg-secondary': '#FFFFFF', '--color-bg-card': '#FFFFFF',
      '--color-bg-surface': '#EFEBE3', '--color-bg-elevated': '#EFEBE3', '--color-border': '#E3DDD1', '--color-border-light': '#D6CFBF',
      '--color-text-primary': '#14241C', '--color-text-secondary': '#4C5B52', '--color-text-muted': '#8A968D',
      '--color-accent-blue': '#1B5E47', '--color-accent-blue-deep': '#134635', '--color-accent-amber': '#B08A3E',
      '--color-accent-emerald': '#1B5E47', '--color-accent-red': '#C05A36', '--color-accent-purple': '#6B4E8E', '--color-accent-cyan': '#2A7D6B',
      '--color-tier-reliable': '#1B5E47', '--color-tier-tentative': '#B08A3E', '--color-tier-noise': '#9C9586',
      '--color-sev-critical': '#C05A36', '--color-sev-moderate': '#B08A3E', '--color-sev-minor': '#1B5E47',
      '--font-family-sans': F.inter, '--font-family-mono': F.plexMono, '--font-family-display': F.fraunces,
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

// 'felt' (now "Midnight Light") retired from the picker — the felt-skinned
// 'Midnight' (engine) replaces it. Def kept so a persisted selection resolves.
export const THEME_LIST: ThemeDef[] = Object.values(THEMES).filter((t) => t.name !== 'felt')
export const DEFAULT_THEME: ThemeName = 'engine'
