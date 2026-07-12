import { useEffect, useState } from 'react'
import { LogOut, AlertTriangle, Loader2 } from 'lucide-react'
import { Sheet, Btn, Card } from '@/components/common/ui'
import { usePreviewLeaveClub, useLeaveClub } from '@/hooks'
import type { Club, User } from '@/types'

/**
 * Member-initiated "Leave this club" flow. Shows EXACTLY what the user is
 * giving up via the previewLeaveClub mock (B3 per-game-type consequence rule
 * from the plan: refund pending claims, forfeit paid ones, mark out of LL,
 * lock FT picks).
 *
 * NB: The Creator can't use this — they get routed to the Dissolve flow
 * from the club Danger zone instead.
 */
export function LeaveClubSheet({
  open,
  onClose,
  club,
  user,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  club: Club
  user: User
  onSuccess?: () => void
}) {
  const preview = usePreviewLeaveClub()
  const leave = useLeaveClub()
  const [previewData, setPreviewData] = useState<Awaited<ReturnType<typeof preview.mutateAsync>> | null>(null)
  const [err, setErr] = useState('')
  const isCreator = club.creatorId === user.id

  useEffect(() => {
    if (!open) { setPreviewData(null); setErr(''); return }
    preview.mutateAsync({ clubId: club.id, userId: user.id }).then(setPreviewData)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, club.id, user.id])

  async function onConfirm() {
    setErr('')
    const r = await leave.mutateAsync({ clubId: club.id, userId: user.id })
    if (r.ok) { onSuccess?.(); onClose() }
    else if (r.reason === 'creator_must_dissolve') setErr("You're the Creator. Use Dissolve from Settings → Danger zone instead.")
  }

  return (
    <Sheet open={open} onClose={onClose} title={`Leave ${club.name}?`}>
      {isCreator ? (
        <Card className="border-accent-amber/30 bg-accent-amber/10">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" />
            <p className="text-xs leading-snug text-text-secondary">
              You are the <b className="text-text-primary">Creator</b> of this club. Leaving requires either
              <b className="text-text-primary"> Dissolving</b> the club entirely
              (Settings → Danger zone) — the Creator role can't be transferred.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <p className="text-xs leading-snug text-text-secondary">
            Here's what'll happen the moment you leave. <b className="text-text-primary">Each item is final.</b>
          </p>
          {!previewData ? (
            <div className="mt-3 flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-text-muted" /></div>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              <Item ok={previewData.paidSquares === 0} label={`${previewData.paidSquares} paid Squares cells forfeited`} sub="Cells become unowned. No refund." />
              <Item ok={previewData.pendingSquares === 0} label={`${previewData.pendingSquares} pending Squares claims refunded`} sub={`+ ${previewData.pendingSquares * 25} credits returned to your wallet.`} />
              <Item ok={previewData.liveLLChips === 0} label="Marked out of Last Longer 'Sunday LL'" sub={`Your ${(previewData.liveLLChips / 1000).toFixed(0)}K chips stay in the leaderboard as Out.`} />
              <Item ok={previewData.lockedFTPicks === 0} label={`${previewData.lockedFTPicks} FT picks locked`} sub="Picks finalize as-is, no refund." />
              <Item ok label="Your club_members row deleted" sub="Past finished games stay attributed to you." />
            </ul>
          )}
          {err && <p className="mt-2 text-xs font-semibold text-accent-red">{err}</p>}
          <div className="mt-4 flex gap-2">
            <Btn variant="secondary" className="flex-1" onClick={onClose}>Cancel</Btn>
            <Btn variant="danger" className="flex-1" loading={leave.isPending} disabled={!previewData} onClick={onConfirm}>
              <LogOut className="h-4 w-4" />Leave club
            </Btn>
          </div>
        </>
      )}
    </Sheet>
  )
}

function Item({ ok, label, sub }: { ok: boolean; label: string; sub?: string }) {
  return (
    <li className="flex items-start gap-2 rounded-lg border border-border bg-bg-surface/40 p-2.5">
      <span className={ok ? 'mt-1 h-2 w-2 shrink-0 rounded-full bg-accent-emerald' : 'mt-1 h-2 w-2 shrink-0 rounded-full bg-accent-amber'} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-text-primary">{label}</p>
        {sub && <p className="mt-0.5 text-[11px] text-text-muted">{sub}</p>}
      </div>
    </li>
  )
}
