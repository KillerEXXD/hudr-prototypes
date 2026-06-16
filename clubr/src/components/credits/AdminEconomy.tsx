import { useEffect, useState } from 'react'
import { Coins, Plus, Trash2, Pencil } from 'lucide-react'
import { useEconomy, useUpdateCosts, useUpsertPackage, useDeletePackage } from '@/hooks/credits'
import { Section, Card, Btn, Sheet, Field, Spinner } from '@/components/common/ui'
import { cn } from '@/lib/utils/cn'
import type { CreditPackage, EconomyConfig } from '@/types/credits'

const fmt = (n: number) => n.toLocaleString('en-US')
const blank = (): CreditPackage => ({ id: '', label: '', credits: 0, priceUSD: 0, active: true, sortOrder: 99 })

// App-Admin "Economy" — set the three action costs + CRUD the purchase packages.
export function AdminEconomy() {
  const economy = useEconomy()
  const updateCosts = useUpdateCosts()
  const upsert = useUpsertPackage()
  const del = useDeletePackage()
  const [costs, setCosts] = useState<EconomyConfig>({ joinGameCost: 100, createClubCost: 200, hostGameCost: 100 })
  const [edit, setEdit] = useState<CreditPackage | null>(null)

  useEffect(() => { if (economy.data) setCosts(economy.data.costs) }, [economy.data?.costs.joinGameCost, economy.data?.costs.createClubCost, economy.data?.costs.hostGameCost]) // eslint-disable-line

  const packages = [...(economy.data?.packages ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)
  const num = (v: string) => Math.max(0, Number(v.replace(/[^0-9]/g, '')) || 0)

  return (
    <Section title="Economy" action={<Coins className="h-4 w-4 text-accent-amber" />}>
      {economy.isLoading ? <Spinner /> : (
        <>
          {/* action costs */}
          <Card className="p-3">
            <p className="mb-2 text-[11px] text-text-muted">What each action costs players &amp; hosts (in credits).</p>
            <div className="grid grid-cols-3 gap-2">
              {([['Join game', 'joinGameCost'], ['Create club', 'createClubCost'], ['Host game', 'hostGameCost']] as const).map(([label, key]) => (
                <label key={key} className="block">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-text-muted">{label}</span>
                  <input type="number" min={0} value={costs[key]} onChange={(e) => setCosts((c) => ({ ...c, [key]: num(e.target.value) }))}
                    className="w-full rounded-lg border border-border bg-bg-surface px-2 py-1.5 text-center font-mono text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-amber" />
                </label>
              ))}
            </div>
            <Btn size="sm" className="mt-2 w-full" disabled={updateCosts.isPending} onClick={() => updateCosts.mutate(costs)}>Save costs</Btn>
          </Card>

          {/* packages */}
          <div className="mt-3 mb-1.5 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-text-muted">Purchase packages</p>
            <Btn size="sm" onClick={() => setEdit(blank())}><Plus className="h-3.5 w-3.5" />Add</Btn>
          </div>
          <div className="flex flex-col gap-1.5">
            {packages.map((p) => (
              <div key={p.id} className={cn('flex items-center gap-2.5 rounded-xl border bg-bg-card px-3 py-2', p.active ? 'border-border' : 'border-dashed border-border opacity-60')}>
                <Coins className="h-4 w-4 shrink-0 text-accent-amber" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-text-primary">{fmt(p.credits)} cr <span className="font-normal text-text-muted">· {p.label}</span></p>
                  <p className="text-[11px] text-text-muted">${p.priceUSD}{p.bonus ? ` · ${p.bonus}` : ''}{!p.active ? ' · hidden' : ''}</p>
                </div>
                <button onClick={() => setEdit(p)} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-bg-surface cursor-pointer"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => del.mutate(p.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-accent-red hover:bg-accent-red/10 cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
          <p className="mt-1.5 text-[10px] text-text-muted">Players buy these in their Wallet (mock checkout in the prototype; real payment at launch).</p>
        </>
      )}

      {edit && <PackageSheet pkg={edit} onClose={() => setEdit(null)} onSave={(p) => { upsert.mutate(p); setEdit(null) }} />}
    </Section>
  )
}

function PackageSheet({ pkg, onClose, onSave }: { pkg: CreditPackage; onClose: () => void; onSave: (p: CreditPackage) => void }) {
  const [p, setP] = useState<CreditPackage>(pkg)
  const valid = p.label.trim() && p.credits > 0 && p.priceUSD > 0
  return (
    <Sheet open onClose={onClose} title={pkg.id ? 'Edit package' : 'Add package'}>
      <div className="flex flex-col gap-3">
        <Field label="Label" value={p.label} onChange={(v) => setP({ ...p, label: v })} placeholder="e.g. Starter" />
        <div className="grid grid-cols-2 gap-2">
          <label className="block"><span className="mb-1 block text-xs font-semibold text-text-secondary">Credits</span>
            <input type="number" min={1} value={p.credits || ''} onChange={(e) => setP({ ...p, credits: Math.max(0, Number(e.target.value) || 0) })} className="w-full rounded-xl border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-amber" /></label>
          <label className="block"><span className="mb-1 block text-xs font-semibold text-text-secondary">Price (USD)</span>
            <input type="number" min={1} value={p.priceUSD || ''} onChange={(e) => setP({ ...p, priceUSD: Math.max(0, Number(e.target.value) || 0) })} className="w-full rounded-xl border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-amber" /></label>
        </div>
        <Field label="Bonus tag (optional)" value={p.bonus ?? ''} onChange={(v) => setP({ ...p, bonus: v || undefined })} placeholder="e.g. Best value" />
        <label className="flex items-center gap-2 text-sm text-text-secondary"><input type="checkbox" checked={p.active} onChange={(e) => setP({ ...p, active: e.target.checked })} /> Active (visible to buyers)</label>
        <Btn className="w-full" disabled={!valid} onClick={() => onSave({ ...p, id: p.id || `pk_${Date.now()}`, sortOrder: p.sortOrder ?? 99 })}>{pkg.id ? 'Save package' : 'Add package'}</Btn>
      </div>
    </Sheet>
  )
}
