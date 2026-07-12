import { cn } from '@/lib/utils/cn'

// Ornate "game-mode" pill emblems (gold-framed, transparent cutout). BASE_URL-aware.
type PillType = 'ft' | 'll' | 'sq'
const SRC: Record<PillType, string> = {
  ft: `${import.meta.env.BASE_URL}badges/pill-ft-fantasy.png`,
  ll: `${import.meta.env.BASE_URL}badges/pill-last-longer.png`,
  sq: `${import.meta.env.BASE_URL}badges/pill-football-squares.png`,
}
const ALT: Record<PillType, string> = { ft: 'FT Fantasy', ll: 'Last Longer', sq: 'Football Squares' }

/**
 * The game-mode "pill" badge — a horizontal gold-framed emblem with the mode name.
 * Aspect is ~3:1; size it by `height` (width auto). Use ~64px on detail headers,
 * ~36–40px on cards.
 */
export function PillBadge({ type, height = 40, className }: { type: PillType; height?: number; className?: string }) {
  return (
    <img
      src={SRC[type]}
      alt={ALT[type]}
      height={height}
      loading="lazy"
      className={cn('block w-auto max-w-full', className)}
      style={{ height }}
    />
  )
}
