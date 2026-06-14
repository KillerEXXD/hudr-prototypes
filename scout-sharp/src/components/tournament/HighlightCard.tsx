import type { Highlight } from '@/types'
import { Card, Badge } from '@/components/ui'
import { fmtChips } from '@/lib/utils'

interface HighlightCardProps {
  highlight: Highlight
}

export default function HighlightCard({ highlight }: HighlightCardProps) {
  return (
    <Card className="space-y-2">
      <div className="flex items-center justify-between">
        <Badge variant="warning">Hand #{highlight.hand}</Badge>
        <span className="text-xs font-medium text-accent-amber">{fmtChips(highlight.pot)}</span>
      </div>
      <p className="text-sm text-text-primary">{highlight.preview}</p>
    </Card>
  )
}
