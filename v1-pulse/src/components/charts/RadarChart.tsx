import type { PlayerDimensions } from '@/types'

interface RadarChartProps {
  dimensions: PlayerDimensions
  color?: string
  size?: number
}

const LABELS = ['AGG', 'RISK', 'ICM', 'PREC', 'ADAPT', 'CLUTCH']

export default function RadarChart({ dimensions, color = '#2563eb', size = 180 }: RadarChartProps) {
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38
  const values = [dimensions.aggression, dimensions.risk, dimensions.icm, dimensions.precision, dimensions.adaptability, dimensions.clutch]

  const polarXY = (angle: number, radius: number) => {
    const rad = ((angle - 90) * Math.PI) / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }

  const gridRings = [0.25, 0.5, 0.75, 1.0]
  const dataPoints = values.map((v, i) => polarXY(i * 60, r * (v / 100)))

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {gridRings.map(pct => {
        const pts = Array.from({ length: 6 }, (_, i) => {
          const p = polarXY(i * 60, r * pct)
          return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
        }).join(' ')
        return <polygon key={pct} points={pts} fill="none" stroke="#4b5563" strokeWidth={pct === 1 ? 1 : 0.5} opacity={0.4} />
      })}

      {Array.from({ length: 6 }, (_, i) => {
        const p = polarXY(i * 60, r)
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#4b5563" strokeWidth={0.5} opacity={0.3} />
      })}

      <polygon
        points={dataPoints.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
        fill={color}
        fillOpacity={0.2}
        stroke={color}
        strokeWidth={2}
      />

      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
      ))}

      {LABELS.map((label, i) => {
        const p = polarXY(i * 60, r + 16)
        return (
          <text key={label} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" className="fill-text-muted text-[9px] font-medium">
            {label}
          </text>
        )
      })}
    </svg>
  )
}
