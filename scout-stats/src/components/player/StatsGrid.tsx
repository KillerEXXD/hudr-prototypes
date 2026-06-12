import type { PlayerStats } from '@/types'
import { cn } from '@/lib/utils'

interface StatsGridProps {
  stats: PlayerStats
  className?: string
}

const statItems: { key: keyof PlayerStats; label: string }[] = [
  { key: 'vpip', label: 'VPIP' },
  { key: 'pfr', label: 'PFR' },
  { key: 'threeBet', label: '3-Bet' },
  { key: 'af', label: 'AF' },
  { key: 'wtsd', label: 'WTSD' },
  { key: 'wsd', label: 'WSD' },
  { key: 'steal', label: 'Steal' },
  { key: 'foldToSteal', label: 'FTS' },
  { key: 'cbetFlop', label: 'CB Flop' },
]

export default function StatsGrid({ stats, className }: StatsGridProps) {
  return (
    <div className={cn('grid grid-cols-3 gap-2', className)}>
      {statItems.map(({ key, label }) => (
        <div key={key} className="rounded-lg bg-bg-surface p-2 text-center">
          <div className="text-xs text-text-muted">{label}</div>
          <div className="text-sm font-semibold text-text-primary mt-0.5">
            {key === 'af' ? stats[key].toFixed(1) : `${stats[key]}%`}
          </div>
        </div>
      ))}
    </div>
  )
}
