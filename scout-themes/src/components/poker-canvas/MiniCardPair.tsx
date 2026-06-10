/**
 * MiniCardPair Component
 *
 * Displays two overlapping hole cards for hand history lists.
 * The second card slightly overlaps the first, matching TournamentPro style.
 */

import { cn } from '@/lib/utils'
import type { Card } from '@/types/hand'
import { MiniCard } from './MiniCard'

// =====================
// Types
// =====================

interface MiniCardPairProps {
  cards: [Card, Card]
  /** Size variant */
  size?: 'xs' | 'sm' | 'md'
  /** Additional className */
  className?: string
}

// =====================
// Component
// =====================

export function MiniCardPair({ cards, size = 'sm', className }: MiniCardPairProps) {
  return (
    <div className={cn('flex -space-x-2', className)}>
      <MiniCard card={cards[0]} size={size} className="z-0" />
      <MiniCard card={cards[1]} size={size} className="z-10" />
    </div>
  )
}
