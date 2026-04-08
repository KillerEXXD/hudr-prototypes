import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { Player } from '@/types'
import { STACK_TIMELINE } from '@/data'
import { fmtChips } from '@/lib/utils'

interface ChipChartProps {
  players: Player[]
  className?: string
}

export default function ChipChart({ players, className }: ChipChartProps) {
  const maxLen = Math.max(...players.map(p => (STACK_TIMELINE[p.id] ?? []).length))
  const data = Array.from({ length: maxLen }, (_, i) => {
    const point: Record<string, number | string> = { hand: i + 1 }
    players.forEach(p => {
      const timeline = STACK_TIMELINE[p.id]
      if (timeline && i < timeline.length) {
        point[p.id] = timeline[i]
      }
    })
    return point
  })

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis dataKey="hand" tick={{ fontSize: 10, fill: '#6b7280' }} />
          <YAxis tickFormatter={(v: number) => fmtChips(v)} tick={{ fontSize: 10, fill: '#6b7280' }} width={55} />
          <Tooltip
            contentStyle={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#9ca3af' }}
            formatter={(value) => [fmtChips(value as number), '']}
          />
          {players.map(p => (
            <Line key={p.id} type="monotone" dataKey={p.id} stroke={p.color} strokeWidth={2} dot={false} name={p.name} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
