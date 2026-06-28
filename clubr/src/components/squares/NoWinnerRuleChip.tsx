import { Repeat, Users, Undo2, Heart } from 'lucide-react'
import type { NoWinnerRule } from '@/lib/squaresPayouts'

/**
 * Prominent banner shown at the top of a settled / live Squares game so
 * players see — at a glance — what happens to a quarter's prize when no
 * one wins that period. The host picks this at game creation; once
 * registration locks, the rule applies for the rest of the game.
 *
 * Each rule has its own color so the chip is hard to miss:
 *   rollover → emerald (default)
 *   split    → blue
 *   refund   → amber
 *   charity  → pink
 */
const STYLE: Record<NoWinnerRule, { icon: typeof Repeat; label: string; body: string; tone: string }> = {
  rollover: {
    icon: Repeat,
    label: 'Rollover',
    body: "If a quarter has no winner, its prize rolls onto Q4. If Q4 also has no winner, the whole pool carries to the next game's Q4 — contact the host.",
    tone: 'border-accent-emerald/40 bg-accent-emerald/10 text-accent-emerald',
  },
  split: {
    icon: Users,
    label: 'Split equally',
    body: 'If a quarter has no winner, its prize splits equally among the players who won other periods.',
    tone: 'border-accent-blue/40 bg-accent-blue/10 text-accent-blue',
  },
  refund: {
    icon: Undo2,
    label: 'Refund (pro-rated)',
    body: 'If a quarter has no winner, its prize is returned to players in proportion to the squares they own.',
    tone: 'border-accent-amber/40 bg-accent-amber/10 text-accent-amber',
  },
  charity: {
    icon: Heart,
    label: 'Charity',
    body: 'If a quarter has no winner, its prize is donated. ClubR records it — donations settle off-app.',
    tone: 'border-pink-400/40 bg-pink-400/10 text-pink-400',
  },
}

export function NoWinnerRuleChip({ rule, charityName }: { rule: NoWinnerRule; charityName?: string | null }) {
  const s = STYLE[rule]
  const Icon = s.icon
  return (
    <div data-testid="sq-no-winner-rule" className={`flex items-start gap-2.5 rounded-xl border p-2.5 ${s.tone}`}>
      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${s.tone}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide">
          House rule · {s.label}
          {rule === 'charity' && charityName && (
            <span className="rounded-full bg-pink-400/20 px-1.5 py-0.5 text-[10px] font-bold text-pink-400">{charityName}</span>
          )}
        </p>
        <p className="mt-0.5 text-[11px] leading-snug text-text-secondary">{s.body}</p>
      </div>
    </div>
  )
}
