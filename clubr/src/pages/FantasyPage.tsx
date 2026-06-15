import { Target, Lock, Sparkles } from 'lucide-react'
import { Badge, Card, Section } from '@/components/common/ui'

export function FantasyPage() {
  return (
    <div className="animate-fade-up">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-extrabold tracking-tight text-text-primary"><Target className="mr-1 inline h-5 w-5 text-accent-purple" />FT Fantasy</h1>
        <Badge tone="purple">Stack Draft</Badge>
      </div>
      <p className="mt-1 text-sm text-text-secondary">Draft 4 of the 9 finalists within a budget — players priced by ICM. Highest points takes the bucket; the club settles offline.</p>

      <Card className="mt-4 flex items-start gap-2.5 border-accent-blue/30 bg-accent-blue/10">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent-blue" />
        <p className="text-xs leading-snug text-text-secondary"><span className="font-bold text-text-primary">Coming in Phase 2.</span> The full Stack Draft flow — operator-priced FTs, the 100k budget draft board, the 10-minute lock, and points-per-finish scoring.</p>
      </Card>

      <Section title="What it'll do">
        {['Operator enters chip stacks → app computes & publishes ICM prices', 'Browse open contests in your club; pick a Stakes bucket', 'Draft 4 players within your 100k budget (use-it-or-lose-it)', 'Picks lock 10 minutes before the FT starts', 'Scored from the public finishing order → 50/30/20'].map((t) => (
          <div key={t} className="mt-1.5 flex items-center gap-2 rounded-xl border border-border bg-bg-card px-3 py-2.5 text-sm text-text-secondary">
            <Lock className="h-3.5 w-3.5 shrink-0 text-text-muted" />{t}
          </div>
        ))}
      </Section>
    </div>
  )
}
