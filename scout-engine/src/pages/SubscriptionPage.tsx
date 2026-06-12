import { Check, Crown, Loader2 } from 'lucide-react'
import { useCurrentUser, useSubscriptionPlans } from '@/hooks'
import { cn } from '@/lib/utils'

export default function SubscriptionPage() {
  const { data: user } = useCurrentUser()
  const { data: plans = [], isLoading } = useSubscriptionPlans()

  if (isLoading) {
    return <div className="flex items-center justify-center gap-2 py-16 text-sm text-text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
  }

  return (
    <div className="animate-fade-up">
      <h1 className="text-xl font-bold tracking-tight">Subscription</h1>
      <p className="mb-4 mt-0.5 text-sm text-text-secondary">Pick the tier that fits your game. Cancel anytime.</p>

      <div className="space-y-3">
        {plans.map((plan) => {
          const current = user?.planId === plan.id
          return (
            <div
              key={plan.id}
              className={cn(
                'rounded-2xl border bg-bg-card p-4 transition-colors',
                current ? 'border-accent-blue ring-1 ring-accent-blue/40' : plan.highlight ? 'border-accent-amber/40' : 'border-border',
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-text-primary">{plan.name}</h2>
                  {current && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-blue/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-blue">
                      <Crown className="h-3 w-3" /> Current
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="nums text-lg font-bold text-text-primary">${plan.priceMonthly}</span>
                  <span className="text-xs text-text-muted">/mo</span>
                </div>
              </div>
              <p className="mt-0.5 text-xs text-text-muted">{plan.tagline}</p>

              <ul className="mt-3 space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-emerald" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={current}
                className={cn(
                  'mt-4 w-full rounded-lg py-2 text-sm font-semibold transition-colors',
                  current
                    ? 'cursor-default bg-bg-surface text-text-muted'
                    : 'bg-accent-blue text-white hover:bg-accent-blue/90 cursor-pointer',
                )}
              >
                {current ? 'Your current plan' : plan.priceMonthly === 0 ? 'Downgrade to Free' : `Upgrade to ${plan.name}`}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
