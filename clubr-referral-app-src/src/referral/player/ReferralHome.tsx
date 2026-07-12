import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, Check, Share2, Gift, Calculator, Banknote, Users } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useSummary } from '@/hooks/referral'
import { Spinner, EmptyState, Badge, Btn } from '@/components/common/ui'
import { Stat, PersonRow, NoCapStrip } from '@/referral/parts'
import { money, tierLabel } from '@/lib/referralFormat'

export function ReferralHome() {
  const { user } = useAuth()
  const nav = useNavigate()
  const { data, isLoading } = useSummary(user?.id)
  const [copied, setCopied] = useState(false)

  if (isLoading || !data) return <Spinner label="Loading your referrals…" />

  const link = `clubrgo.app/r/${data.code}`
  const copy = () => { navigator.clipboard?.writeText(`https://${link}`).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1600) }
  const share = () => { navigator.share?.({ title: 'Join me on ClubrGo', text: 'Use my referral link to join ClubrGo', url: `https://${link}` }).catch(() => {}) }

  return (
    <div className="space-y-4">
      {/* Balance hero */}
      <div className="rounded-3xl border border-accent-emerald/25 bg-gradient-to-b from-accent-emerald/12 to-transparent p-5">
        <div className="text-xs font-bold uppercase tracking-wide text-text-muted">Available to withdraw</div>
        <div className="mt-1 text-4xl font-extrabold tabular-nums text-accent-emerald">{money(data.available)}</div>
        <div className="mt-1 text-xs text-text-muted">Lifetime earned {money(data.lifetimeEarned)} · withdrawn {money(data.withdrawn)}{data.pending > 0 ? ` · ${money(data.pending)} pending` : ''}</div>
        <div className="mt-3 flex gap-2">
          <Btn size="sm" onClick={() => nav('/referrals/withdraw')}><Banknote className="h-4 w-4" /> Withdraw</Btn>
          <Btn size="sm" variant="secondary" onClick={() => nav('/referrals/projector')}><Calculator className="h-4 w-4" /> Projector</Btn>
        </div>
      </div>

      {/* Share card */}
      <div className="rounded-2xl border border-border bg-bg-card p-4">
        <div className="text-xs font-bold uppercase tracking-wide text-text-muted">Your referral link</div>
        <div className="mt-2 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-xl border border-dashed border-border bg-bg-surface px-3 py-2.5 font-mono text-sm">{link}</code>
          <button type="button" onClick={copy} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-surface transition-colors hover:bg-bg-elevated cursor-pointer" aria-label="Copy link">{copied ? <Check className="h-4 w-4 text-accent-emerald" /> : <Copy className="h-4 w-4" />}</button>
          <button type="button" onClick={share} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-surface transition-colors hover:bg-bg-elevated cursor-pointer" aria-label="Share"><Share2 className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5">
        <Stat label="Direct referrals" value={String(data.directCount)} tone="blue" />
        <Stat label="Residual (their referrals)" value={String(data.residualCount)} tone="purple" />
      </div>
      <NoCapStrip />

      {/* Direct referrals */}
      <div>
        <div className="mb-2 flex items-center gap-2 px-0.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-blue/15 text-accent-blue"><Users className="h-4 w-4" /></span>
          <h2 className="text-base font-extrabold">People you referred</h2>
          <span className="ml-auto text-xs text-text-muted">tap to drill in</span>
        </div>
        {data.directReferrals.length === 0 ? (
          <EmptyState icon={<Gift className="h-7 w-7" />} title="No referrals yet" sub="Share your link above. The moment someone you invite makes a real coin purchase, you start earning — 50% in year one, for life." />
        ) : (
          <div className="space-y-2">
            {data.directReferrals.map((r) => (
              <PersonRow
                key={r.referral.id}
                name={r.name}
                color={r.avatarColor}
                pic={r.avatarUrl}
                onClick={() => nav(`/referrals/r/${r.referral.id}`)}
                badge={<Badge tone="blue">{tierLabel(r.tierYearNow)}</Badge>}
                sub={`${money(r.directEarned)} direct${r.subCount > 0 ? ` · ${money(r.residualFromThem)} residual from ${r.subCount} sub-referral${r.subCount > 1 ? 's' : ''}` : ''}`}
                right={<div className="text-right"><div className="text-sm font-extrabold tabular-nums text-accent-emerald">{money(r.directEarned + r.residualFromThem)}</div><div className="text-[10px] text-text-muted">total</div></div>}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
