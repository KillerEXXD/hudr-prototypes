import type { Highlight } from '@/types'
import { Card } from '@/components/ui'
import { Badge } from '@/components/ui'
import { fmtChips } from '@/lib/utils'

interface HandCardProps {
  highlight: Highlight
}

const typeLabels: Record<string, string> = {
  biggest_pot: 'Biggest Pot',
  bluff: 'Bluff',
  elimination: 'Elimination',
  hero_call: 'Hero Call',
  cooler: 'Cooler',
  bad_beat: 'Bad Beat',
}

const typeVariants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'purple'> = {
  biggest_pot: 'warning',
  bluff: 'danger',
  elimination: 'purple',
  hero_call: 'success',
  cooler: 'default',
  bad_beat: 'danger',
}

export default function HandCard({ highlight }: HandCardProps) {
  return (
    <Card className="space-y-2">
      <div className="flex items-center justify-between">
        <Badge variant={typeVariants[highlight.type]}>{typeLabels[highlight.type]}</Badge>
        <span className="text-xs text-text-muted">Hand #{highlight.hand}</span>
      </div>
      <p className="text-sm text-text-primary">{highlight.preview}</p>
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>{highlight.board}</span>
        <span className="font-medium text-accent-amber">{fmtChips(highlight.pot)}</span>
      </div>
    </Card>
  )
}
