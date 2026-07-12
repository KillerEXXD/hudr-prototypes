import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useResidualDetail } from '@/hooks/referral'
import { Spinner, EmptyState, Badge } from '@/components/common/ui'
import { LedgerRow, EarningSheet } from '@/referral/parts'
import { money } from '@/lib/referralFormat'
import type { EarningDetail } from '@/types/referral'

export function ResidualDetail() {
  const { sourceId } = useParams()
  const { user } = useAuth()
  const nav = useNavigate()
  const { data, isLoading } = useResidualDetail(user?.id, sourceId)
  const [sheet, setSheet] = useState<EarningDetail | null>(null)

  if (isLoading) return <Spinner />
  if (!data) return <EmptyState title="Not found" />
  const total = data.ledger.reduce((a, d) => a + (d.purchaseStatus === 'refunded' ? 0 : d.amountUsd), 0)

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => nav(-1)} className="flex items-center gap-1 text-sm font-semibold text-text-secondary hover:text-text-primary cursor-pointer"><ChevronLeft className="h-4 w-4" /> Back</button>
      <div>
        <div className="flex items-center gap-2"><h1 className="text-xl font-extrabold">Residual from {data.sourceName}</h1><Badge tone="green">10% for life</Badge></div>
        <p className="text-xs text-text-muted">You earn a flat 10% because {data.sourceName} was referred by someone <em>you</em> referred.</p>
      </div>
      <div className="rounded-2xl border border-accent-purple/25 bg-accent-purple/5 p-4">
        <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted">Total residual earned</div>
        <div className="mt-1 text-3xl font-extrabold tabular-nums text-accent-purple">{money(total)}</div>
      </div>
      <div className="rounded-2xl border border-border bg-bg-card px-3 py-1">
        {data.ledger.length === 0 ? <p className="py-4 text-center text-sm text-text-muted">No purchases yet.</p> : data.ledger.map((d) => <LedgerRow key={d.id} d={d} onClick={() => setSheet(d)} />)}
      </div>
      <EarningSheet open={!!sheet} onClose={() => setSheet(null)} d={sheet} />
    </div>
  )
}
