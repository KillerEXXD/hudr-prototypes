import { Timer, Lock, Sparkles } from 'lucide-react'
import { Badge, Card, Section } from '@/components/common/ui'

export function LastLongerPage() {
  return (
    <div className="animate-fade-up">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-extrabold tracking-tight text-text-primary"><Timer className="mr-1 inline h-5 w-5 text-accent-amber" />Last Longer</h1>
        <Badge tone="amber">Live</Badge>
      </div>
      <p className="mt-1 text-sm text-text-secondary">Your club's own live tournament — a public, un-hideable headcount, host-judged eliminations, chat &amp; chop. The app proves it; the cash is offline.</p>

      <Card className="mt-4 flex items-start gap-2.5 border-accent-amber/30 bg-accent-amber/10">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" />
        <p className="text-xs leading-snug text-text-secondary"><span className="font-bold text-text-primary">Coming in Phase 3.</span> The live leaderboard (in/waiting/out), chip updates with a stale-pulse, eliminations, in-app chat, chop voting, and a visible audit log.</p>
      </Card>

      <Section title="What it'll do">
        {['Host creates a game; players self-join (public in/waiting list)', 'Live leaderboard — active by chips, eliminated drop to the bottom', 'Self-report chips every ~20 min (stale-pulse reminder)', 'Eliminations by host / self / flagged by others — host decides', 'Chat + chop voting; every host action in a visible audit log'].map((t) => (
          <div key={t} className="mt-1.5 flex items-center gap-2 rounded-xl border border-border bg-bg-card px-3 py-2.5 text-sm text-text-secondary">
            <Lock className="h-3.5 w-3.5 shrink-0 text-text-muted" />{t}
          </div>
        ))}
      </Section>
    </div>
  )
}
