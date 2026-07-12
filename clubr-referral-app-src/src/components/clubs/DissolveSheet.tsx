import { useEffect, useState } from 'react'
import { AlertTriangle, Skull, ChevronRight } from 'lucide-react'
import { Sheet, Btn, Card, Field } from '@/components/common/ui'
import { useDissolveClub } from '@/hooks'
import type { Club } from '@/types'

/**
 * Creator-only "Dissolve <club name>" sheet. 3-step confirmation per the plan:
 *
 *   Step 1: Type the exact club name to enable the next step
 *   Step 2: Read the 6-line consequences list
 *   Step 3: Red "Dissolve forever" button is disabled for 3 seconds (anti-
 *           fat-finger). Inspired by the GitHub / Stripe "irreversible
 *           action" pattern.
 *
 * The flow lives inside the club Danger zone (ClubSettingsSheet). The legacy
 * empty-only "Delete club" affordance is removed in favour of this.
 */
export function DissolveSheet({
  open,
  onClose,
  club,
  callerUserId,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  club: Club
  callerUserId: string
  onSuccess?: () => void
}) {
  const dissolve = useDissolveClub()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [typed, setTyped] = useState('')
  const [delayEnds, setDelayEnds] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const [err, setErr] = useState('')

  // Reset when sheet opens / closes.
  useEffect(() => {
    if (open) { setStep(1); setTyped(''); setDelayEnds(null); setErr('') }
  }, [open])

  // Tick once per 100ms while step 3 is counting down so the "Wait 3s" UI updates.
  useEffect(() => {
    if (step !== 3 || delayEnds == null) return
    const id = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(id)
  }, [step, delayEnds])

  const nameMatches = typed.trim().toLowerCase() === club.name.toLowerCase()
  const delayRemaining = delayEnds == null ? 3000 : Math.max(0, delayEnds - now)
  const canDissolve = step === 3 && delayRemaining === 0

  function goToStep2() { setStep(2) }
  function goToStep3() {
    setStep(3)
    setDelayEnds(Date.now() + 3000)
    setNow(Date.now())
  }

  async function onConfirm() {
    if (!canDissolve) return
    setErr('')
    const r = await dissolve.mutateAsync({ clubId: club.id, callerUserId })
    if (r.ok) { onSuccess?.(); onClose() }
    else if (r.reason === 'creator_only') setErr('Only the Creator can dissolve the club.')
  }

  return (
    <Sheet open={open} onClose={onClose} title="Dissolve club permanently">
      <Card className="border-accent-red/30 bg-accent-red/10">
        <div className="flex items-start gap-2">
          <Skull className="mt-0.5 h-4 w-4 shrink-0 text-accent-red" />
          <div>
            <p className="text-xs font-bold text-accent-red">Dissolving {club.name} cannot be undone.</p>
            <p className="mt-1 text-[11px] leading-snug text-text-secondary">
              Every member's active game in this club will be auto-settled with refunds. Past games stay in personal histories but read-only.
            </p>
          </div>
        </div>
      </Card>

      {/* === Step 1: type the club name === */}
      <div className="mt-4">
        <StepHeading n={1} active={step === 1} done={nameMatches} title="Confirm the name" />
        {step === 1 && (
          <div className="mt-2">
            <Field label={`Type "${club.name}" to confirm`} value={typed} onChange={setTyped} placeholder={club.name} />
            <Btn variant="secondary" className="mt-2 w-full" onClick={goToStep2} disabled={!nameMatches}>
              Continue<ChevronRight className="h-4 w-4" />
            </Btn>
          </div>
        )}
      </div>

      {/* === Step 2: consequences === */}
      <div className="mt-4">
        <StepHeading n={2} active={step === 2} done={step === 3} title="Read what happens" />
        {step === 2 && (
          <Card className="mt-2 border-accent-amber/30">
            <ul className="flex flex-col gap-1.5 text-[11px] leading-snug text-text-secondary">
              <li>• <b className="text-text-primary">2 active games</b> will auto-settle (Last Longer marked complete, Squares cancelled).</li>
              <li>• <b className="text-text-primary">~125 credits</b> in refunds will be returned to members.</li>
              <li>• <b className="text-text-primary">{club.members.length} members</b> will be notified and removed from the club.</li>
              <li>• All <b className="text-text-primary">chat history</b> stays preserved (read-only) in member personal histories.</li>
              <li>• The <b className="text-text-primary">club-wide leaderboard</b> becomes a frozen snapshot.</li>
              <li>• <b className="text-accent-red">This action cannot be reversed.</b></li>
            </ul>
            <Btn variant="secondary" className="mt-3 w-full" onClick={goToStep3}>
              I understand — Continue<ChevronRight className="h-4 w-4" />
            </Btn>
          </Card>
        )}
      </div>

      {/* === Step 3: final dissolve button with delay === */}
      <div className="mt-4">
        <StepHeading n={3} active={step === 3} done={false} title="Final confirmation" />
        {step === 3 && (
          <div className="mt-2">
            <div className="flex items-start gap-2 rounded-lg border border-accent-red/30 bg-accent-red/5 p-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-red" />
              <p className="text-[11px] text-text-secondary">
                {delayRemaining > 0
                  ? <>The button below unlocks in <b className="text-accent-red tabular-nums">{Math.ceil(delayRemaining / 1000)}s</b>. This guard prevents accidental taps on an irreversible action.</>
                  : <>The action is irreversible. Tap <b className="text-accent-red">Dissolve forever</b> when you're ready.</>}
              </p>
            </div>
            {err && <p className="mt-2 text-xs font-semibold text-accent-red">{err}</p>}
            <Btn
              variant="danger"
              className="mt-3 w-full"
              loading={dissolve.isPending}
              disabled={!canDissolve}
              onClick={onConfirm}
            >
              <Skull className="h-4 w-4" />Dissolve forever
            </Btn>
          </div>
        )}
      </div>
    </Sheet>
  )
}

function StepHeading({ n, active, done, title }: { n: number; active: boolean; done: boolean; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${done ? 'bg-accent-emerald text-bg-primary' : active ? 'bg-accent-blue text-white' : 'bg-bg-surface text-text-muted'}`}>{done ? '✓' : n}</span>
      <p className={`text-[11px] font-bold uppercase tracking-wider ${active ? 'text-text-primary' : 'text-text-muted'}`}>{title}</p>
    </div>
  )
}
