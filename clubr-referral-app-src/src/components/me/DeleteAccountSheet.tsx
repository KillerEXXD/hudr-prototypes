import { useEffect, useState } from 'react'
import { Trash2, AlertTriangle, Loader2, Building2 } from 'lucide-react'
import { Sheet, Btn, Card } from '@/components/common/ui'
import { usePreviewDeleteAccount, useDeleteAccount } from '@/hooks'
import type { User } from '@/types'

/**
 * Self-initiated account deletion with the 2-step flow from the plan:
 *
 *   Step 1: Show every membership + Creator-of-N clubs + active games count.
 *           Each Creator-of row is a hard-block — the user must Dissolve those
 *           clubs first (or the API refuses with `creator_must_resolve`).
 *
 *   Step 2: Explain the 14-day grace window. PII wipes immediately
 *           (anonymization to "Removed Player"); the account row hard-purges
 *           via cron at 14d. Logging in any time before that cancels deletion.
 */
export function DeleteAccountSheet({
  open,
  onClose,
  user,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  user: User
  onSuccess?: () => void
}) {
  const preview = usePreviewDeleteAccount()
  const del = useDeleteAccount()
  const [data, setData] = useState<Awaited<ReturnType<typeof preview.mutateAsync>> | null>(null)
  const [step, setStep] = useState<1 | 2>(1)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!open) { setData(null); setStep(1); setErr(''); return }
    preview.mutateAsync({ userId: user.id }).then(setData)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user.id])

  const blockedByCreator = (data?.createdClubs.length ?? 0) > 0

  async function onConfirm() {
    setErr('')
    const r = await del.mutateAsync({ userId: user.id })
    if (r.ok) { onSuccess?.(); onClose() }
    else if (r.reason === 'creator_must_resolve') setErr("You're the Creator of one or more clubs. Dissolve or transfer them first.")
  }

  return (
    <Sheet open={open} onClose={onClose} title={step === 1 ? 'Delete your account' : 'Confirm anonymization'}>
      {!data ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-text-muted" /></div>
      ) : step === 1 ? (
        <>
          <p className="text-xs leading-snug text-text-secondary">
            Before you delete your account, here's what we'll need to handle. <b className="text-text-primary">Creator-of clubs must be resolved first.</b>
          </p>

          <div className="mt-3 flex flex-col gap-2">
            <Row label="Club memberships" value={`${data.clubMemberCount}`} sub="You'll auto-leave these. Active-game refunds and forfeits run per club." />
            <Row label="Active games" value={`${data.activeGamesCount}`} sub="Auto-handled per game type (refund pending, forfeit paid, mark out)." />
            <div className={`rounded-lg border p-2.5 ${blockedByCreator ? 'border-accent-red/40 bg-accent-red/10' : 'border-border bg-bg-surface/40'}`}>
              <div className="flex items-center gap-1.5">
                <Building2 className={`h-3.5 w-3.5 ${blockedByCreator ? 'text-accent-red' : 'text-text-muted'}`} />
                <p className={`text-[10px] font-bold uppercase tracking-wider ${blockedByCreator ? 'text-accent-red' : 'text-text-muted'}`}>Clubs you created</p>
                <span className={`ml-auto text-[10px] font-bold ${blockedByCreator ? 'text-accent-red' : 'text-text-muted'}`}>{data.createdClubs.length}</span>
              </div>
              {data.createdClubs.length === 0 ? (
                <p className="mt-1 text-[11px] text-text-muted">None.</p>
              ) : (
                <>
                  <ul className="mt-1.5 flex flex-col gap-1">
                    {data.createdClubs.map((c) => (
                      <li key={c.id} className="text-[11px] font-bold text-text-primary">• {c.name}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[11px] leading-snug text-text-secondary">
                    The Creator role is <b className="text-text-primary">permanent</b>. To proceed you must
                    open each club's Danger zone and <b className="text-text-primary">Dissolve</b> it (or stay as Creator).
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Btn variant="secondary" className="flex-1" onClick={onClose}>Cancel</Btn>
            <Btn variant="danger" className="flex-1" disabled={blockedByCreator} onClick={() => setStep(2)}>
              Continue
            </Btn>
          </div>
        </>
      ) : (
        <>
          <Card className="border-accent-amber/30 bg-accent-amber/10">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" />
              <p className="text-xs leading-snug text-text-secondary">
                Your data is anonymized <b className="text-text-primary">immediately</b> — name becomes "Removed Player",
                phone/email/avatar wiped. Your past wins stay in leaderboards.
                The row is hard-purged after <b className="text-text-primary">14 days</b>.
                Logging in any time before that cancels the deletion.
              </p>
            </div>
          </Card>

          <ul className="mt-3 flex flex-col gap-1.5 text-[11px] leading-snug text-text-secondary">
            <li>• Name → <b className="text-text-primary">Removed Player</b></li>
            <li>• Phone, email, avatar → <b className="text-text-primary">cleared</b></li>
            <li>• Memberships across <b className="text-text-primary">{data.clubMemberCount} clubs</b> → leave with full refund/forfeit cascade</li>
            <li>• Telegram link → <b className="text-text-primary">disconnected</b></li>
            <li>• Credits balance → <b className="text-text-primary">refunded</b> (if non-zero)</li>
            <li>• Past game wins → <b className="text-text-primary">preserved</b> as "Removed Player"</li>
          </ul>

          {err && <p className="mt-2 text-xs font-semibold text-accent-red">{err}</p>}

          <div className="mt-4 flex gap-2">
            <Btn variant="secondary" className="flex-1" onClick={() => setStep(1)}>Back</Btn>
            <Btn variant="danger" className="flex-1" loading={del.isPending} onClick={onConfirm}>
              <Trash2 className="h-4 w-4" />Anonymize my account
            </Btn>
          </div>
        </>
      )}
    </Sheet>
  )
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg-surface/40 p-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</p>
        <p className="font-mono text-sm font-bold text-text-primary tabular-nums">{value}</p>
      </div>
      {sub && <p className="mt-0.5 text-[11px] text-text-muted">{sub}</p>}
    </div>
  )
}
