import { Card, CardTitle, CardContent } from '@/components/ui'
import { SCOUTING_TEXT } from '@/data'

interface ScoutingReportProps {
  playerId: string
}

export default function ScoutingReport({ playerId }: ScoutingReportProps) {
  const text = SCOUTING_TEXT[playerId]
  if (!text) return null

  return (
    <Card>
      <CardTitle className="text-sm">Scouting Report</CardTitle>
      <CardContent>
        <p className="text-sm text-text-secondary leading-relaxed mt-2">{text}</p>
      </CardContent>
    </Card>
  )
}
