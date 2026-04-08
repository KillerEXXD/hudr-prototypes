import { useState } from 'react'
import type { QuizHand } from '@/types'
import { Card, Button } from '@/components/ui'
import { PlayingCard } from '@/components/hand'
import { cn } from '@/lib/utils'

interface QuizCardProps {
  quiz: QuizHand
}

export default function QuizCard({ quiz }: QuizCardProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const isAnswered = selected !== null
  const isCorrect = selected === quiz.correct

  return (
    <Card className="space-y-3">
      <div className="text-xs text-text-muted">Hand #{quiz.hand} &middot; {quiz.street}</div>
      <p className="text-sm text-text-primary">{quiz.situation}</p>
      <p className="text-sm text-text-secondary">{quiz.facing}</p>

      <div className="flex gap-1">
        {quiz.holeCards.map(card => (
          <PlayingCard key={card} card={card} />
        ))}
      </div>

      {quiz.board.length > 0 && (
        <div className="flex gap-1">
          {quiz.board.map(card => (
            <PlayingCard key={card} card={card} size="sm" />
          ))}
        </div>
      )}

      <div className="space-y-2">
        {quiz.options.map((option, i) => (
          <Button
            key={option}
            variant={!isAnswered ? 'outline' : i === quiz.correct ? 'default' : selected === i ? 'secondary' : 'ghost'}
            size="sm"
            className={cn('w-full justify-start', isAnswered && i === quiz.correct && 'bg-accent-emerald/20 border-accent-emerald text-accent-emerald')}
            onClick={() => !isAnswered && setSelected(i)}
            disabled={isAnswered}
          >
            {option}
          </Button>
        ))}
      </div>

      {isAnswered && (
        <div className={cn('text-xs p-2 rounded-lg', isCorrect ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-red/10 text-accent-red')}>
          <p className="font-medium">{isCorrect ? 'Correct!' : `The pro chose: ${quiz.proAction}`}</p>
          <p className="mt-1 text-text-secondary">{quiz.explanation}</p>
        </div>
      )}
    </Card>
  )
}
