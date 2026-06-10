import PlayingCard from './PlayingCard'
import { cn } from '@/lib/utils'

interface CommunityCardsProps {
  cards: string[]
  className?: string
}

export default function CommunityCards({ cards, className }: CommunityCardsProps) {
  return (
    <div className={cn('flex gap-1', className)}>
      {cards.map((card, i) => (
        <PlayingCard key={i} card={card} />
      ))}
    </div>
  )
}
