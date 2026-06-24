import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronDown, Target, Clock, Trophy, Ticket } from 'lucide-react'
import { useAvailableFTs } from '@/hooks/ft'
import { Badge, Btn, Card, Spinner } from '@/components/common/ui'
import { CreateContestSheet } from '@/components/ft/CreateContestSheet'
import { cn } from '@/lib/utils/cn'

const fmtK = (n: number) => `${Math.round(n / 1000)}k`

export function HostFTPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // ?ft=<id> (from the Host home FT cards) pre-expands that final table.
  const preselect = params.get('ft')
  const { data, isLoading } = useAvailableFTs()
  const [expanded, setExpanded] = useState<string | null>(preselect)
  const [hostFt, setHostFt] = useState<string | null>(null)

  // Scroll the pre-expanded card into view once the list has loaded.
  useEffect(() => {
    if (!preselect || !data) return
    document.getElementById(`ft-card-${preselect}`)?.scrollIntoView?.({ block: 'center' })
  }, [preselect, data])

  return (
    <div className="animate-fade-up">
      <button onClick={() => navigate(-1)} className="mb-2 flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary cursor-pointer"><ChevronLeft className="h-4 w-4" />Back</button>
      <h1 className="flex items-center gap-1.5 text-xl font-extrabold tracking-tight text-text-primary"><Target className="h-5 w-5 text-accent-purple" />Choose a Final Table</h1>
      <p className="mt-1 text-sm text-text-secondary">The operator's upcoming, ICM‑priced final tables. Pick one to review the table, then host it in your club.</p>

      {isLoading ? <Spinner /> : (
        <div className="mt-3 flex flex-col gap-2">
          {data?.map((f) => {
            const open = expanded === f.id
            return (
              <Card key={f.id} id={`ft-card-${f.id}`} className="overflow-hidden p-0">
                <button onClick={() => setExpanded(open ? null : f.id)} className="flex w-full items-start gap-2 p-3.5 text-left cursor-pointer">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[11px] text-text-muted"><Badge tone="purple">{f.room}</Badge>{f.date}</div>
                    <p className="mt-1 text-sm font-bold text-text-primary">{f.name}</p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-text-muted">
                      <span className="flex items-center gap-1"><Trophy className="h-3 w-3 text-accent-amber" />{f.prizePool} Stakes</span>
                      <span className="flex items-center gap-1"><Ticket className="h-3 w-3" />{f.buyIn} Stakes</span>
                      <span className="ml-auto flex items-center gap-1"><Clock className="h-3 w-3" />{f.startsIn}</span>
                    </div>
                  </div>
                  <ChevronDown className={cn('mt-1 h-4 w-4 shrink-0 text-text-muted transition-transform', open && 'rotate-180')} />
                </button>
                {open && (
                  <div className="border-t border-border p-3">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-text-muted">9 finalists · stack &amp; ICM price</p>
                    <div className="flex flex-col gap-1">
                      {f.players.map((p) => (
                        <div key={p.seat} className="flex items-center gap-2.5 rounded-lg bg-bg-surface/50 px-2.5 py-1.5 text-sm">
                          <span className="flex h-5 w-5 items-center justify-center rounded bg-accent-purple/20 text-xs font-extrabold text-accent-purple">{p.seat}</span>
                          <span className="flex-1 truncate font-semibold text-text-primary">{p.name}</span>
                          <span className="font-mono text-xs text-text-muted">{p.bbStack} BB</span>
                          <span className="w-12 text-right font-mono text-xs font-bold text-accent-purple">{fmtK(p.icmPrice)}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] text-text-muted">Prize pool shown is the real event's — informational. Your contest pays its own Stakes bucket, settled offline.</p>
                    <Btn className="mt-3 w-full" onClick={() => setHostFt(f.id)}>Host this FT in my club</Btn>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <CreateContestSheet open={!!hostFt} onClose={() => setHostFt(null)} presetFtId={hostFt ?? undefined} />
    </div>
  )
}
