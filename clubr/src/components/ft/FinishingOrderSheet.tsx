import { useState } from 'react'
import { countryFlag } from '@/lib/countries'
import { Trophy, X, RotateCcw, Flag } from 'lucide-react'
import { Sheet, Btn } from '@/components/common/ui'
import { cn } from '@/lib/utils/cn'
import { playerFull } from '@/lib/utils/ftFormat'
import type { FTPlayer } from '@/types/ft'

const ord = (n: number) => (n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`)

/**
 * Host completes an FT contest by entering the public finishing order — tap the
 * players in the order they finished (1st → last). That ranks the whole table
 * (a permutation of the 9 seats), which is what scores every draft and crowns a
 * winner. Submit is disabled until every seat is placed.
 */
export function FinishingOrderSheet({ open, onClose, players, busy, onSubmit }: {
  open: boolean
  onClose: () => void
  players: FTPlayer[]
  busy?: boolean
  onSubmit: (order: string[]) => void
}) {
  const [order, setOrder] = useState<string[]>([])
  const remaining = players.filter((p) => !order.includes(p.seat))
  const complete = players.length > 0 && order.length === players.length

  return (
    <Sheet open={open} onClose={onClose} title="Enter the finishing order">
      <div className="flex flex-col gap-3">
        <p className="text-xs leading-snug text-text-secondary">
          Tap the players in the order they finished — <b>1st first</b>, down to last. This scores every
          draft and crowns the winner. Once submitted, the contest is settled.
        </p>

        {order.length > 0 && (
          <div className="flex flex-col gap-1">
            {order.map((seat, i) => {
              const p = players.find((x) => x.seat === seat)
              return (
                <div key={seat} className={cn('flex items-center gap-2 rounded-xl border px-3 py-2',
                  i === 0 ? 'border-accent-amber/50 bg-accent-amber/10' : 'border-border bg-bg-card')}>
                  <span className={cn('flex w-9 shrink-0 items-center text-[12px] font-extrabold', i === 0 ? 'text-accent-amber' : 'text-text-muted')}>
                    {i === 0 ? <Trophy className="h-4 w-4" /> : ord(i + 1)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary"><span className="mr-1">{countryFlag(p?.country) || '🃏'}</span>{playerFull(p)}</span>
                  <button type="button" aria-label="Remove" onClick={() => setOrder(order.filter((s) => s !== seat))} className="text-text-muted hover:text-accent-red cursor-pointer"><X className="h-4 w-4" /></button>
                </div>
              )
            })}
          </div>
        )}

        {remaining.length > 0 && (
          <div>
            <p className="mb-1.5 text-[11px] font-semibold text-text-secondary">Tap who finished <b>{ord(order.length + 1)}</b></p>
            <div className="flex flex-wrap gap-1.5">
              {remaining.map((p) => (
                <button key={p.seat} type="button" onClick={() => setOrder([...order, p.seat])}
                  className="rounded-full border border-border bg-bg-surface px-3 py-1.5 text-[12px] font-semibold text-text-primary hover:bg-bg-card cursor-pointer">
                  <span className="mr-1">{countryFlag(p.country) || '🃏'}</span>{playerFull(p)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Btn variant="secondary" onClick={() => setOrder([])} disabled={busy || order.length === 0}><RotateCcw className="h-4 w-4" />Reset</Btn>
          <Btn className="flex-1" disabled={!complete} loading={busy} onClick={() => onSubmit(order)}><Flag className="h-4 w-4" />Complete contest</Btn>
        </div>
      </div>
    </Sheet>
  )
}
