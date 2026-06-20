import type { LucideIcon } from 'lucide-react'

// Reusable plain-English "how to play" walkthrough shown in a sheet. Each game
// type passes its own steps + accent (literal Tailwind classes, per the v4
// purge rule). Mirrors the original FT Fantasy walkthrough across every type.
export interface HowStep { icon: LucideIcon; title: string; body: string }

export function HowItWorks({ steps, dotBg, iconColor }: { steps: HowStep[]; dotBg: string; iconColor: string }) {
  return (
    <div className="flex flex-col gap-3">
      {steps.map((s, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white ${dotBg}`}>{i + 1}</span>
            {i < steps.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
          </div>
          <div className="pb-1">
            <p className="flex items-center gap-1.5 text-sm font-bold text-text-primary"><s.icon className={`h-4 w-4 ${iconColor}`} />{s.title}</p>
            <p className="mt-0.5 text-xs leading-snug text-text-secondary">{s.body}</p>
          </div>
        </div>
      ))}
      <p className="mt-1 rounded-lg bg-bg-surface/60 p-2 text-[11px] leading-snug text-text-muted">
        ClubR is just the <strong className="text-text-secondary">scorekeeper</strong> — it tracks everything transparently and <strong className="text-text-secondary">holds no cash</strong>. All stakes are settled between players offline.
      </p>
    </div>
  )
}
