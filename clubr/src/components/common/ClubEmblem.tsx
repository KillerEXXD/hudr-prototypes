import { cn } from '@/lib/utils/cn'

// Procedural "3D glass" club emblem (ported from the live app). Deterministic from
// the club id, or explicit glyph/gradient keys. Self-contained glass layers.

export const GLYPHS: Record<string, string> = {
  spade: '♠', heart: '♥', diamond: '♦', club: '♣',
  chip: '◉', ring: '⧉', target: '◎',
  gem: '◆', prism: '◈', flower: '❖',
  crown: '♛', king: '♔', star: '✦',
}
const GLYPH_KEYS = Object.keys(GLYPHS)

export const EMBLEM_GRADIENTS: Record<string, string> = {
  aurora: 'linear-gradient(135deg,#7c3aed,#2dd4bf)',
  sunset: 'linear-gradient(135deg,#f59e0b,#ef4444)',
  ocean: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
  magma: 'linear-gradient(135deg,#fb7185,#7c3aed)',
  jade: 'linear-gradient(135deg,#34d399,#84cc16)',
  gold: 'linear-gradient(135deg,#fcd34d,#d97706)',
  rose: 'linear-gradient(135deg,#f472b6,#a855f7)',
  ice: 'linear-gradient(135deg,#22d3ee,#6366f1)',
}
const GRADIENT_KEYS = Object.keys(EMBLEM_GRADIENTS)

function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

export function ClubEmblem({ id, glyph, gradient, size = 44, className }: {
  id: string; glyph?: string; gradient?: string; size?: number; className?: string
}) {
  const radius = Math.round(size * 0.3)
  const h = hashStr(id || 'club')
  const gKey = (glyph && GLYPHS[glyph]) ? glyph : GLYPH_KEYS[(h >>> 5) % GLYPH_KEYS.length]
  const grKey = (gradient && EMBLEM_GRADIENTS[gradient]) ? gradient : GRADIENT_KEYS[h % GRADIENT_KEYS.length]
  return (
    <span
      aria-hidden="true"
      className={cn('relative inline-grid shrink-0 place-items-center overflow-hidden ring-1 ring-border shadow-lg shadow-black/30', className)}
      style={{ width: size, height: size, borderRadius: radius, backgroundImage: EMBLEM_GRADIENTS[grKey] }}
    >
      <span className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(120% 120% at 28% 20%, rgba(255,255,255,0.6), rgba(255,255,255,0.06) 42%, transparent 64%)' }} />
      <span className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(150deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.12) 20%, transparent 40%)' }} />
      <span className="pointer-events-none absolute inset-0" style={{ borderRadius: radius, boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.7), inset 0 0 0 1px rgba(255,255,255,0.14), inset 0 -9px 16px rgba(0,0,0,0.25)' }} />
      <span className="relative font-black text-white" style={{ fontSize: size * 0.5, lineHeight: 1, textShadow: '0 1px 3px rgba(0,0,0,0.45)' }}>{GLYPHS[gKey]}</span>
    </span>
  )
}
