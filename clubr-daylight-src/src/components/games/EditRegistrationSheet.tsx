import { useState, useEffect } from 'react'
import { Clock, Plus, Lock, AlertTriangle } from 'lucide-react'
import { Sheet, Btn } from '@/components/common/ui'
import { cn } from '@/lib/utils/cn'

// Prototype note: the live app drives this off SERVER time (lib/time/serverClock).
// The mock has no server, so it uses the device clock — fine for a local demo.
const now = () => Date.now()

/**
 * Host control to EXTEND the registration deadline or CLOSE registration now.
 * Pre-filled with the current remaining time. Extend-only — the host can never set
 * it below what it was when the sheet opened.
 */
export function EditRegistrationSheet({ open, onClose, currentCloseISO, busy, onExtend, onCloseReg }: {
  open: boolean
  onClose: () => void
  currentCloseISO?: string
  busy?: boolean
  onExtend: (closesAtISO: string) => void
  onCloseReg: () => void
}) {
  const [h, setH] = useState(0)
  const [m, setM] = useState(0)
  const [floorMin, setFloorMin] = useState(0)
  const [confirmClose, setConfirmClose] = useState(false)

  useEffect(() => {
    if (!open) return
    const closeMs = currentCloseISO ? Date.parse(currentCloseISO) : NaN
    const remMin = !Number.isNaN(closeMs) ? Math.max(0, Math.round((closeMs - now()) / 60_000)) : 0
    setH(Math.floor(remMin / 60)); setM(remMin % 60); setFloorMin(remMin); setConfirmClose(false)
  }, [open, currentCloseISO])

  const totalMin = Math.max(0, h) * 60 + Math.max(0, Math.min(59, m))
  const belowFloor = totalMin < floorMin
  const step15 = () => { const t = totalMin + 15; setH(Math.floor(t / 60)); setM(t % 60) }

  function save() {
    if (belowFloor) return
    onExtend(new Date(now() + totalMin * 60_000).toISOString())
  }

  return (
    <Sheet open={open} onClose={onClose} title="Registration time">
      <div className="flex flex-col gap-3">
        <p className="text-xs text-text-muted">Set how long from now registration stays open. You can only extend it — never shorten.</p>

        <div className="flex items-end gap-2">
          <NumField label="Hours" value={h} onChange={setH} max={999} />
          <span className="pb-2 text-lg font-bold text-text-muted">:</span>
          <NumField label="Minutes" value={m} onChange={(v) => setM(Math.max(0, Math.min(59, v)))} max={59} />
          <Btn variant="secondary" className="mb-0.5" onClick={step15}><Plus className="h-4 w-4" />15 min</Btn>
        </div>

        {belowFloor && (
          <p className="flex items-center gap-1 text-[11px] font-semibold text-accent-red"><AlertTriangle className="h-3 w-3" />Can't be less than the {Math.floor(floorMin / 60)}h {floorMin % 60}m left when you opened this.</p>
        )}

        <Btn className="w-full" disabled={belowFloor || busy} loading={busy} onClick={save}><Clock className="h-4 w-4" />Save new deadline</Btn>

        <div className="my-1 h-px bg-border" />

        {!confirmClose ? (
          <Btn variant="danger" className="w-full" onClick={() => setConfirmClose(true)}><Lock className="h-4 w-4" />Close registration now</Btn>
        ) : (
          <div className="rounded-xl border border-accent-red/40 bg-accent-red/10 p-3">
            <p className="flex items-start gap-1.5 text-xs font-semibold text-accent-red"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />This closes registration now — earlier than the scheduled time. No new players can join and the game starts. This can't be undone.</p>
            <div className="mt-2.5 flex gap-2">
              <Btn variant="secondary" className={cn('flex-1')} onClick={() => setConfirmClose(false)} disabled={busy}>Cancel</Btn>
              <Btn variant="danger" className="flex-1" loading={busy} onClick={onCloseReg}><Lock className="h-4 w-4" />Close it</Btn>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  )
}

function NumField({ label, value, onChange, max }: { label: string; value: number; onChange: (v: number) => void; max: number }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-text-secondary">{label}</span>
      <input
        type="number" min={0} max={max} value={value}
        onChange={(e) => onChange(Math.max(0, Math.min(max, Math.floor(Number(e.target.value) || 0))))}
        className="w-20 rounded-xl border border-border bg-bg-surface px-3 py-2 text-center text-base font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
      />
    </label>
  )
}
