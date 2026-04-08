import { cn } from '@/lib/utils'

interface PlayingCardProps {
  card: string
  size?: 'sm' | 'md'
  className?: string
}

const suitColors: Record<string, string> = {
  h: 'text-red-500',
  d: 'text-red-500',
  s: 'text-text-primary',
  c: 'text-text-primary',
}

const suitSymbols: Record<string, string> = {
  h: '\u2665',
  d: '\u2666',
  s: '\u2660',
  c: '\u2663',
}

export default function PlayingCard({ card, size = 'md', className }: PlayingCardProps) {
  const rank = card.slice(0, -1)
  const suit = card.slice(-1)

  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 rounded bg-bg-surface px-1.5 py-0.5 font-mono font-bold',
      suitColors[suit],
      size === 'sm' ? 'text-xs' : 'text-sm',
      className
    )}>
      {rank}{suitSymbols[suit]}
    </span>
  )
}
