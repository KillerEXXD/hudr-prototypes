import { useWithdrawalQueue, useDecideWithdrawal } from '@/hooks/referral'
import { Spinner, Avatar, Badge, Btn } from '@/components/common/ui'
import { money, fmtDate } from '@/lib/referralFormat'
import type { WithdrawalStatus } from '@/types/referral'

const TONE: Record<WithdrawalStatus, 'amber' | 'green' | 'red'> = { pending: 'amber', approved: 'green', rejected: 'red' }
const LABEL: Record<WithdrawalStatus, string> = { pending: 'Pending', approved: 'Paid', rejected: 'Rejected' }

export function AdminWithdrawals() {
  const { data, isLoading } = useWithdrawalQueue()
  const decide = useDecideWithdrawal()
  if (isLoading || !data) return <Spinner />
  const pending = data.filter((w) => w.status === 'pending')
  const processed = data.filter((w) => w.status !== 'pending')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><h1 className="text-lg font-extrabold">Withdrawal queue</h1>{pending.length > 0 && <Badge tone="amber">{pending.length} pending</Badge>}</div>

      {pending.length === 0 && <p className="rounded-xl border border-dashed border-border bg-bg-card/50 px-4 py-6 text-center text-sm text-text-muted">No pending requests. 🎉</p>}
      <div className="space-y-2">
        {pending.map((w) => (
          <div key={w.id} className="rounded-2xl border border-accent-amber/30 bg-accent-amber/5 p-3">
            <div className="flex items-center gap-3">
              <Avatar name={w.name} color={w.avatarColor} pic={w.avatarUrl} size={38} />
              <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{w.name}</div><div className="text-xs text-text-muted">{w.note} · {fmtDate(w.requestedAt)}</div></div>
              <div className="text-lg font-extrabold tabular-nums">{money(w.amountUsd)}</div>
            </div>
            <div className="mt-2.5 flex gap-2">
              <Btn size="sm" className="flex-1" loading={decide.isPending} onClick={() => decide.mutate({ id: w.id, status: 'approved' })}>Approve &amp; pay</Btn>
              <Btn size="sm" variant="danger" onClick={() => decide.mutate({ id: w.id, status: 'rejected' })}>Reject</Btn>
            </div>
          </div>
        ))}
      </div>

      {processed.length > 0 && (
        <div>
          <h2 className="mb-2 px-0.5 text-base font-extrabold">Processed</h2>
          <div className="space-y-2">
            {processed.map((w) => (
              <div key={w.id} className="flex items-center gap-3 rounded-xl border border-border bg-bg-card px-3 py-2.5">
                <Avatar name={w.name} color={w.avatarColor} pic={w.avatarUrl} size={34} />
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{w.name}</div><div className="text-xs text-text-muted">{fmtDate(w.processedAt ?? w.requestedAt)}</div></div>
                <span className="text-sm font-extrabold tabular-nums">{money(w.amountUsd)}</span>
                <Badge tone={TONE[w.status]}>{LABEL[w.status]}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
