import { CheckCircle2 } from 'lucide-react'
import type { Strength } from '@/engine'

// Player strengths (positive mirror of the exploit cards).
// Crisp Amateur (plain): compact chips, title only. Pro: detailed cards with the
// explanatory line.
export default function Strengths({ strengths, plain }: { strengths: Strength[]; plain?: boolean }) {
  if (!strengths.length) {
    return <div className="rounded-xl border border-border bg-bg-card p-4 text-sm text-text-muted">No standout strengths at this sample.</div>
  }
  if (plain) {
    return (
      <div className="flex flex-wrap gap-2">
        {strengths.map((s) => (
          <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full border border-accent-emerald/30 bg-accent-emerald/10 px-2.5 py-1 text-xs font-medium text-text-primary">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent-emerald" />
            {s.title}
          </span>
        ))}
      </div>
    )
  }
  return (
    <div className="space-y-2">
      {strengths.map((s) => (
        <div key={s.id} className="flex items-start gap-2.5 rounded-xl border border-accent-emerald/25 bg-accent-emerald/5 p-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-emerald" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-text-primary">{s.title}</div>
            {s.detail && <div className="text-xs leading-snug text-text-muted">{s.detail}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}
