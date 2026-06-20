import { Search, UserPlus, Layers, Lock, Award, Coins } from 'lucide-react'

// Plain-English "how to play FT Fantasy" — a numbered, visual walkthrough shown
// in a sheet from the FT Fantasy page. Keep it short and friendly for first-timers.
const STEPS = [
  { icon: Search, title: 'Find a contest', body: 'Your club host opens an FT Fantasy contest on an upcoming streamed final table.' },
  { icon: UserPlus, title: 'Request to enter', body: 'Tap “Request to enter” — the host admits you, then you can draft.' },
  { icon: Layers, title: 'Draft your team', body: 'Pick 4 of the 9 finalists within your budget. Bigger chip stacks cost more (priced by ICM).' },
  { icon: Lock, title: 'Picks lock', body: 'Your draft locks 10 minutes before the final table starts — no changes after.' },
  { icon: Award, title: 'Watch & score', body: 'Each of your 4 players scores by where they finish — 1st 100 · 2nd 70 · 3rd 50 … 9th 3. Your score is the sum.' },
  { icon: Coins, title: 'Win the pool', body: 'Highest total wins. The pool is split per the host’s payout (e.g. Top 3 — 50/30/20), settled offline.' },
]

export function HowItWorksFT({ onShowPricing }: { onShowPricing?: () => void } = {}) {
  return (
    <div className="flex flex-col gap-3">
      {STEPS.map((s, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-purple text-xs font-extrabold text-white">{i + 1}</span>
            {i < STEPS.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
          </div>
          <div className="pb-1">
            <p className="flex items-center gap-1.5 text-sm font-bold text-text-primary"><s.icon className="h-4 w-4 text-accent-purple" />{s.title}</p>
            <p className="mt-0.5 text-xs leading-snug text-text-secondary">{s.body}</p>
            {/* ICM pricing + scoring matters most at the draft decision — surface the link right here. */}
            {onShowPricing && s.title === 'Draft your team' && (
              <button
                type="button"
                onClick={onShowPricing}
                className="mt-1.5 rounded-lg border border-border bg-bg-surface/60 px-2.5 py-1.5 text-[11px] font-bold text-accent-blue hover:bg-bg-surface cursor-pointer"
              >
                See ICM pricing &amp; scoring details →
              </button>
            )}
          </div>
        </div>
      ))}
      <p className="mt-1 rounded-lg bg-bg-surface/60 p-2 text-[11px] leading-snug text-text-muted">
        ClubR is just the <strong className="text-text-secondary">scorekeeper</strong> — it tracks picks &amp; results transparently and <strong className="text-text-secondary">holds no cash</strong>. All stakes are settled between players offline.
      </p>
    </div>
  )
}
