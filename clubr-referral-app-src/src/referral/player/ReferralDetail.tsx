import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Lock } from 'lucide-react'
import { useReferralDetail } from '@/hooks/referral'
import { Avatar, Badge, Spinner, EmptyState } from '@/components/common/ui'
import { Stat, PersonRow, LedgerRow, EarningSheet } from '@/referral/parts'
import { money, pct, fmtDate, tierLabel } from '@/lib/referralFormat'
import type { EarningDetail } from '@/types/referral'

export function ReferralDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { data, isLoading } = useReferralDetail(id)
  const [sheet, setSheet] = useState<EarningDetail | null>(null)

  if (isLoading) return <Spinner />
  if (!data) return <EmptyState title="Referral not found" />
  const { row, subs, ledger } = data
  const sc = row.referral.locked

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => nav(-1)} className="flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-text-primary cursor-pointer"><ChevronLeft className="h-4 w-4" /> Back</button>

      <div className="flex items-center gap-3">
        <Avatar name={row.name} color={row.avatarColor} pic={row.avatarUrl} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><h1 className="truncate text-xl font-extrabold">{row.name}</h1><Badge tone="blue">{tierLabel(row.tierYearNow)}</Badge></div>
          <div className="text-xs text-text-muted">Your direct referral · activated {fmtDate(row.referral.activatedAt)}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-surface px-3 py-2 text-xs">
        <Lock className="h-3.5 w-3.5 text-accent-amber" />
        <span className="font-semibold">Locked rate</span>
        <span className="ml-auto font-mono">{pct(sc.y1)} / {pct(sc.y2)} / {pct(sc.y3plus)} · {pct(sc.residual)} residual</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Stat label="Direct from them" value={money(row.directEarned)} tone="emerald" />
        <Stat label="Residual from their referrals" value={money(row.residualFromThem)} tone="purple" />
      </div>

      {subs.length > 0 && (
        <div>
          <h2 className="mb-2 px-0.5 text-base font-extrabold">Their referrals <span className="text-sm font-semibold text-text-muted">· you earn {pct(sc.residual)} residual</span></h2>
          <div className="space-y-2">
            {subs.map((r) => (
              <PersonRow key={r.referral.id} name={r.name} color={r.avatarColor} pic={r.avatarUrl}
                onClick={() => nav(`/referrals/res/${r.referral.referredId}`)}
                sub={`${money(r.residualFromThem)} residual earned`}
                right={<div className="text-sm font-extrabold tabular-nums text-accent-purple">{money(r.residualFromThem)}</div>}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-1 px-0.5 text-base font-extrabold">Your direct earnings</h2>
        <div className="rounded-2xl border border-border bg-bg-card px-3 py-1">
          {ledger.length === 0 ? <p className="py-4 text-center text-sm text-text-muted">No purchases yet.</p> : ledger.map((d) => <LedgerRow key={d.id} d={d} onClick={() => setSheet(d)} />)}
        </div>
      </div>

      <EarningSheet open={!!sheet} onClose={() => setSheet(null)} d={sheet} />
    </div>
  )
}
