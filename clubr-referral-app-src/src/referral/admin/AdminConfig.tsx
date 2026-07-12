import { useEffect, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { useConfig, useUpdateConfig } from '@/hooks/referral'
import { Spinner, Btn } from '@/components/common/ui'
import { cn } from '@/lib/utils/cn'
import type { RefConfig } from '@/types/referral'

function NumField({ label, value, onChange, suffix }: { label: string; value: string; onChange: (v: string) => void; suffix?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-text-secondary">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-surface px-3">
        <input inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent py-2.5 text-sm font-bold focus:outline-none" />
        {suffix && <span className="text-sm text-text-muted">{suffix}</span>}
      </div>
    </label>
  )
}

export function AdminConfig() {
  const { data, isLoading } = useConfig()
  const save = useUpdateConfig()
  const [y1, setY1] = useState(''); const [y2, setY2] = useState(''); const [y3, setY3] = useState(''); const [res, setRes] = useState('')
  const [capEnabled, setCapEnabled] = useState(false); const [capUsd, setCapUsd] = useState(''); const [minW, setMinW] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!data) return
    setY1(String(Math.round(data.y1 * 100))); setY2(String(Math.round(data.y2 * 100))); setY3(String(Math.round(data.y3plus * 100))); setRes(String(Math.round(data.residual * 100)))
    setCapEnabled(data.capEnabled); setCapUsd(String(data.capUsd)); setMinW(String(data.minWithdrawalUsd))
  }, [data])

  if (isLoading || !data) return <Spinner />

  const submit = async () => {
    const cfg: RefConfig = { y1: (+y1 || 0) / 100, y2: (+y2 || 0) / 100, y3plus: (+y3 || 0) / 100, residual: (+res || 0) / 100, capEnabled, capUsd: +capUsd || 0, minWithdrawalUsd: +minW || 0 }
    await save.mutateAsync(cfg); setSaved(true); setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-blue/15 text-accent-blue"><SlidersHorizontal className="h-5 w-5" /></span><h1 className="text-lg font-extrabold">Program settings</h1></div>

      <div className="rounded-2xl border border-border bg-bg-card p-4">
        <h2 className="mb-3 text-sm font-extrabold">Default rate schedule</h2>
        <div className="grid grid-cols-2 gap-3">
          <NumField label="Year 1" value={y1} onChange={setY1} suffix="%" />
          <NumField label="Year 2" value={y2} onChange={setY2} suffix="%" />
          <NumField label="Year 3+" value={y3} onChange={setY3} suffix="%" />
          <NumField label="Residual (flat)" value={res} onChange={setRes} suffix="%" />
        </div>
        <p className="mt-2 text-[11px] text-text-muted">Changing defaults affects only <strong>new</strong> activations. Existing relationships keep their locked rate.</p>
      </div>

      <div className="rounded-2xl border border-border bg-bg-card p-4">
        <div className="flex items-center justify-between">
          <div><h2 className="text-sm font-extrabold">Referral cap</h2><p className="text-[11px] text-text-muted">Off = unlimited, for life (default).</p></div>
          <button type="button" onClick={() => setCapEnabled((v) => !v)} className={cn('relative h-7 w-12 rounded-full transition-colors cursor-pointer', capEnabled ? 'bg-accent-blue' : 'bg-bg-elevated')}>
            <span className={cn('absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform', capEnabled ? 'translate-x-[22px]' : 'translate-x-0.5')} />
          </button>
        </div>
        {capEnabled && <div className="mt-3"><NumField label="Cap per branch (USD)" value={capUsd} onChange={setCapUsd} suffix="$" /></div>}
      </div>

      <div className="rounded-2xl border border-border bg-bg-card p-4">
        <NumField label="Minimum withdrawal (USD)" value={minW} onChange={setMinW} suffix="$" />
      </div>

      {saved && <div className="rounded-lg bg-accent-emerald/10 px-3 py-2 text-xs font-semibold text-accent-emerald">Settings saved.</div>}
      <Btn className="w-full" onClick={submit} loading={save.isPending}>Save settings</Btn>
    </div>
  )
}
