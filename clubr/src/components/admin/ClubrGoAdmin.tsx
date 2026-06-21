import { useState } from 'react'
import { DownloadCloud, Link2, Trophy, Eye, EyeOff, Trash2, Check } from 'lucide-react'
import { useEligibleFTs, useAdminSlate, usePullFinalTable, useSetFTPublished, useUpdateFTIcm, useRemoveFT } from '@/hooks/ft'
import { Badge, Btn, Card, Section, Spinner } from '@/components/common/ui'
import type { AdminSlateFT } from '@/types/ft'

// App Admin dashboard — pull TournamentPro final tables into the ClubrGo slate,
// re-price ICM, then publish so hosts can run contests on them.
export function ClubrGoAdmin() {
  const eligible = useEligibleFTs()
  const slate = useAdminSlate()
  const pull = usePullFinalTable()
  const pulled = (slate.data ?? []).filter((f) => f.source === 'tpro')

  return (
    <Section title="ClubrGo · TournamentPro final tables">
      <p className="mb-2 text-[11px] text-text-muted">
        Pull a final table TournamentPro marked for ClubrGo, set ICM draft prices, then <span className="text-text-secondary">publish</span> it so hosts can run a contest. Pulled tables stay hidden from hosts until published.
      </p>

      {/* Eligible pool */}
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-text-muted">Eligible from TournamentPro</p>
      {eligible.isLoading ? <Spinner /> : eligible.data?.length === 0 ? (
        <p className="mb-3 text-xs text-text-muted">Nothing marked for ClubrGo yet. Mark a tournament in TournamentPro.</p>
      ) : (
        <div className="mb-3 flex flex-col gap-2">
          {eligible.data?.map((e) => (
            <Card key={e.tournamentId} className="p-3">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-text-primary">{e.name}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-text-muted">
                    {e.venue && <span>{e.venue}</span>}
                    <span>· {e.finalistCount} finalists</span>
                    <span className="flex items-center gap-1"><Trophy className="h-3 w-3 text-accent-amber" />{e.prizePool}</span>
                    <span>· {e.level}</span>
                  </p>
                </div>
                {e.pulled ? (
                  <Badge tone={e.published ? 'green' : 'amber'}>{e.published ? 'Published' : 'Pulled'}</Badge>
                ) : (
                  <Btn size="sm" variant="secondary" loading={pull.isPending} onClick={() => pull.mutate(e.tournamentId)}>
                    <DownloadCloud className="h-3.5 w-3.5" /> Pull
                  </Btn>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pulled — ICM pricing + publish/remove */}
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-text-muted">Pulled · price &amp; publish</p>
      {slate.isLoading ? <Spinner /> : pulled.length === 0 ? (
        <p className="text-xs text-text-muted">No pulled final tables yet.</p>
      ) : (
        <div className="flex flex-col gap-2">{pulled.map((f) => <PulledCard key={f.id} ft={f} />)}</div>
      )}
    </Section>
  )
}

function PulledCard({ ft }: { ft: AdminSlateFT }) {
  const setPublished = useSetFTPublished()
  const updateIcm = useUpdateFTIcm()
  const remove = useRemoveFT()
  const [prices, setPrices] = useState<Record<string, number>>(() => Object.fromEntries(ft.players.map((p) => [p.seat, p.icmPrice])))
  const [open, setOpen] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const dirty = ft.players.some((p) => prices[p.seat] !== p.icmPrice)

  const onRemove = async () => {
    setErr(null)
    try { await remove.mutateAsync(ft.id) } catch (e) { setErr(e instanceof Error && e.message.includes('CONFLICT') ? 'Cancel the contests on this table first.' : 'Remove failed.') }
  }

  return (
    <Card className="p-3">
      <div className="flex items-center gap-2">
        <Link2 className="h-3.5 w-3.5 shrink-0 text-accent-blue" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-text-primary">{ft.name}</p>
          <p className="truncate text-[11px] text-text-muted">{ft.prizePool} · {ft.level ?? '—'} · {ft.players.length} finalists</p>
        </div>
        <Badge tone={ft.published ? 'green' : 'amber'}>{ft.published ? 'Published' : 'Staged'}</Badge>
      </div>

      <button onClick={() => setOpen((v) => !v)} className="mt-2 text-[11px] font-semibold text-accent-blue cursor-pointer">
        {open ? 'Hide ICM pricing' : 'Edit ICM pricing'}
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-border bg-bg-card p-2">
          {ft.players.map((p) => (
            <div key={p.seat} className="flex items-center gap-2 py-1">
              <span className="w-5 text-center text-[11px] font-extrabold text-text-muted">{p.seat}</span>
              <span className="min-w-0 flex-1 truncate text-xs text-text-primary">{p.name}</span>
              <span className="font-mono text-[10px] text-text-muted">{p.bbStack} BB</span>
              <input
                type="text" inputMode="numeric"
                value={(prices[p.seat] ?? 0).toLocaleString('en-US')}
                onChange={(e) => setPrices((prev) => ({ ...prev, [p.seat]: Number(e.target.value.replace(/[^0-9]/g, '')) || 0 }))}
                className="w-24 rounded border border-border bg-bg-surface px-2 py-1 text-right font-mono text-xs text-text-primary"
              />
            </div>
          ))}
          <Btn size="sm" className="mt-2 w-full" disabled={!dirty || updateIcm.isPending} loading={updateIcm.isPending}
            onClick={() => updateIcm.mutate({ ftId: ft.id, prices: ft.players.map((p) => ({ seat: p.seat, icmPrice: prices[p.seat] ?? 0 })) })}>
            <Check className="h-3.5 w-3.5" /> Save ICM prices
          </Btn>
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        <Btn size="sm" variant={ft.published ? 'ghost' : 'primary'} loading={setPublished.isPending}
          onClick={() => setPublished.mutate({ ftId: ft.id, published: !ft.published })}>
          {ft.published ? <><EyeOff className="h-3.5 w-3.5" /> Unpublish</> : <><Eye className="h-3.5 w-3.5" /> Publish</>}
        </Btn>
        <button onClick={onRemove} disabled={remove.isPending} className="ml-auto flex items-center gap-1 text-[11px] font-medium text-accent-red hover:underline disabled:opacity-50 cursor-pointer">
          <Trash2 className="h-3.5 w-3.5" /> Remove
        </button>
      </div>
      {err && <p className="mt-1 text-[11px] text-accent-red">{err}</p>}
    </Card>
  )
}
