/**
 * MiniCard Component
 *
 * A small card display component for use in hand history lists.
 * Matches the card style from TournamentPro's hand history table.
 */

import { cn } from '@/lib/utils'
import type { Card, Suit } from '@/types/hand'

// =====================
// Types
// =====================

interface MiniCardProps {
  card: Card
  /** Size variant */
  size?: 'xs' | 'sm' | 'md'
  /** Additional className */
  className?: string
}

// =====================
// Helpers
// =====================

interface SuitStyle {
  symbol: string
  color: string
  bgGradient: string
}

const getSuitStyle = (suit: Suit): SuitStyle => {
  const suitMap: Record<Suit, SuitStyle> = {
    spades: { symbol: '♠', color: 'text-gray-900', bgGradient: 'from-gray-50 to-gray-100' },
    hearts: { symbol: '♥', color: 'text-red-600', bgGradient: 'from-red-50 to-rose-100' },
    diamonds: { symbol: '♦', color: 'text-red-600', bgGradient: 'from-red-50 to-rose-100' },
    clubs: { symbol: '♣', color: 'text-gray-900', bgGradient: 'from-gray-50 to-gray-100' },
  }
  return suitMap[suit]
}

const getSizeClasses = (size: 'xs' | 'sm' | 'md') => {
  switch (size) {
    case 'xs':
      return {
        card: 'w-5 h-7 rounded',
        rank: 'text-[9px] leading-none font-bold',
        suit: 'text-[7px] leading-none -mt-0.5',
      }
    case 'sm':
      return {
        card: 'w-6 h-8 rounded',
        rank: 'text-[10px] leading-none font-bold',
        suit: 'text-[8px] leading-none -mt-0.5',
      }
    case 'md':
    default:
      return {
        card: 'w-8 h-11 rounded-md',
        rank: 'text-sm leading-none font-bold',
        suit: 'text-xs leading-none',
      }
  }
}

// =====================
// Component
// =====================

export function MiniCard({ card, size = 'sm', className }: MiniCardProps) {
  const suitStyle = getSuitStyle(card.suit)
  const sizeClasses = getSizeClasses(size)

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center',
        'bg-gradient-to-br border border-gray-200/80 shadow-sm',
        suitStyle.bgGradient,
        sizeClasses.card,
        className
      )}
    >
      {/* Shine effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent rounded-[inherit]" />

      {/* Card content */}
      <span className={cn(sizeClasses.rank, suitStyle.color, 'relative z-10')}>
        {card.rank === '10' ? 'T' : card.rank}
      </span>
      <span className={cn(sizeClasses.suit, suitStyle.color, 'relative z-10')}>
        {suitStyle.symbol}
      </span>
    </div>
  )
}
