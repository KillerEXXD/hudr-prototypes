// Plain-English "how to play FT Fantasy" — a numbered, visual walkthrough shown
// in a sheet from the FT Fantasy page. The steps live in games/gameExplainers
// (shared with the onboarding cards + the /how-games-work help page).
import { FT_STEPS as STEPS } from '@/games/gameExplainers'

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
