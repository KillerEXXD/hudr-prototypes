import { useState } from 'react'
import { Ban, AlertTriangle } from 'lucide-react'
import { Sheet, Btn } from '@/components/common/ui'
import { cn } from '@/lib/utils/cn'

/**
 * Shared "cancel this game" sheet for all three games. Captures a reason as a
 * quick preset + an optional free-text note (joined as "Preset — note"). Voids
 * the game; the reason is shown to everyone. Cancel is disabled until a reason
 * is given (a preset or a note).
 */
const PRESETS = ['Not enough players', 'Event called off', 'Scheduling conflict', 'Duplicate game', 'Other']

export function CancelGameSheet({ open, onClose, busy, onCancel, gameLabel = 'game' }: {
  open: boolean
  onClose: () => void
  busy?: boolean
  onCancel: (reason: string) => void
  gameLabel?: string
}) {
  const [preset, setPreset] = useState<string | null>(null)
  const [note, setNote] = useState('')

  const trimmed = note.trim()
  const reason = preset && trimmed ? `${preset} — ${trimmed}` : (preset ?? trimmed)

  return (
    <Sheet open={open} onClose={onClose} title={`Cancel ${gameLabel}?`}>
      <div className="flex flex-col gap-3">
        <p className="flex items-start gap-1.5 text-xs leading-snug text-text-secondary">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-red" />
          This voids the game — no winner, nothing is paid. Everyone in the game is shown your reason. This can't be undone.
        </p>

        <div>
          <p className="mb-1.5 text-[11px] font-semibold text-text-secondary">Why are you cancelling?</p>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPreset(preset === p ? null : p)}
                className={cn('rounded-full px-3 py-1.5 text-[12px] font-semibold ring-1 cursor-pointer transition-colors',
                  preset === p ? 'bg-accent-red/15 text-accent-red ring-accent-red/40' : 'bg-bg-surface text-text-secondary ring-border hover:bg-bg-card')}
              >{p}</button>
            ))}
          </div>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note (optional)"
          rows={2}
          maxLength={300}
          className="w-full resize-none rounded-xl border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-red"
        />

        <div className="flex gap-2">
          <Btn variant="secondary" className="flex-1" onClick={onClose} disabled={busy}>Keep game</Btn>
          <Btn variant="danger" className="flex-1" loading={busy} disabled={!reason} onClick={() => onCancel(reason)}><Ban className="h-4 w-4" />Cancel game</Btn>
        </div>
      </div>
    </Sheet>
  )
}
