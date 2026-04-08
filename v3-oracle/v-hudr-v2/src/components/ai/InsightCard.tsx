import type { Insight } from '@/types'
import { Card } from '@/components/ui'

interface InsightCardProps {
  insight: Insight
}

export default function InsightCard({ insight }: InsightCardProps) {
  return (
    <Card className="border-l-4" style={{ borderLeftColor: insight.border }}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{insight.icon}</span>
        <div>
          <h4 className="font-semibold text-sm text-text-primary">{insight.title}</h4>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">{insight.text}</p>
        </div>
      </div>
    </Card>
  )
}
