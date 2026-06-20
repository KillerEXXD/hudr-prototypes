import { useState } from 'react'
import { Sparkles, Trophy } from 'lucide-react'
import { useAddAvailableFT } from '@/hooks/ft'
import { Sheet, Btn, Field } from '@/components/common/ui'

// App Admin → add a final table to the operator slate. Enter the event meta and
// 9 finalists (name + chip stack in BB); the app seats them A..I by stack and
// auto-computes each ICM draft price. Hosts then see it under "FTs to host".

type Fin = { name: string; bb: string }
const EMPTY: Fin[] = Array.from({ length: 9 }, () => ({ name: '', bb: '' }))

const SAMPLE_META = { name: 'WPT World Championship — FT', room: 'WPT', date: 'Today · 9:00pm ET', startsIn: 'in 3h', hoursLeft: 3, prizePool: '$4,000,000', buyIn: '$10,400' }
const SAMPLE_FIN: Fin[] = [
  { name: 'Stephen Chidwick', bb: '88' }, { name: 'Jason Koon', bb: '70' }, { name: 'Ali Imsirovic', bb: '55' },
  { name: 'Kristen Foxen', bb: '42' }, { name: 'Dan Smith', bb: '33' }, { name: 'Sam Greenwood', bb: '25' },
  { name: 'Adrian Mateos', bb: '18' }, { name: 'Isaac Haxton', bb: '11' }, { name: 'Liv Boeree', bb: '6' },
]

export function CreateFTSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const add = useAddAvailableFT()
  const [m, setM] = useState({ name: '', room: '', date: 'Today', startsIn: 'in 2h', hoursLeft: '2', prizePool: '', buyIn: '' })
  const [fin, setFin] = useState<Fin[]>(EMPTY)

  const filled = fin.filter((f) => f.name.trim() && Number(f.bb) > 0)
  const canSave = m.name.trim().length > 0 && filled.length >= 2

  function setFinAt(i: number, patch: Partial<Fin>) {
    setFin((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)))
  }
  function fillSample() {
    setM({ ...SAMPLE_META, hoursLeft: String(SAMPLE_META.hoursLeft) })
    setFin(SAMPLE_FIN.map((f) => ({ ...f })))
  }
  function reset() { setM({ name: '', room: '', date: 'Today', startsIn: 'in 2h', hoursLeft: '2', prizePool: '', buyIn: '' }); setFin(EMPTY) }

  async function submit() {
    if (!canSave) return
    await add.mutateAsync({
      name: m.name, room: m.room, date: m.date, startsIn: m.startsIn, hoursLeft: Number(m.hoursLeft) || 0,
      prizePool: m.prizePool, buyIn: m.buyIn,
      finalists: filled.map((f) => ({ name: f.name.trim(), bbStack: Number(f.bb) })),
    })
    reset(); onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Add a final table">
      <button onClick={fillSample} type="button" className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-accent-purple/30 bg-accent-purple/10 px-3 py-2 text-xs font-bold text-accent-purple hover:bg-accent-purple/20 cursor-pointer">
        <Sparkles className="h-3.5 w-3.5" /> Fill with a sample final table
      </button>

      <div className="flex flex-col gap-2.5">
        <Field label="Event name" value={m.name} onChange={(v) => setM({ ...m, name: v })} placeholder="Lone Star Poker Series — Main Event FT" />
        <div className="grid grid-cols-2 gap-2">
          <Field label="Room / operator" value={m.room} onChange={(v) => setM({ ...m, room: v })} placeholder="Champions Club" />
          <Field label="When" value={m.date} onChange={(v) => setM({ ...m, date: v })} placeholder="Today · 8:00pm CT" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Starts in" value={m.startsIn} onChange={(v) => setM({ ...m, startsIn: v })} placeholder="in 2h" />
          <Field label="Hours left" value={m.hoursLeft} onChange={(v) => setM({ ...m, hoursLeft: v.replace(/[^0-9]/g, '') })} type="number" />
          <Field label="Buy-in" value={m.buyIn} onChange={(v) => setM({ ...m, buyIn: v })} placeholder="$10,000" />
        </div>
        <Field label="Prize pool" value={m.prizePool} onChange={(v) => setM({ ...m, prizePool: v })} placeholder="$5,000,000" />
      </div>

      <p className="mt-4 mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-text-muted"><Trophy className="h-3.5 w-3.5 text-accent-amber" />Finalists · name &amp; chip stack (BB)</p>
      <p className="mb-2 text-[11px] text-text-muted">Seated by stack (leader first); ICM draft prices are computed automatically.</p>
      <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto scrollbar-thin pr-0.5">
        {fin.map((f, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="w-4 text-center text-[11px] font-extrabold text-text-muted">{i + 1}</span>
            <input
              value={f.name}
              onChange={(e) => setFinAt(i, { name: e.target.value })}
              placeholder={`Finalist ${i + 1}`}
              className="min-w-0 flex-1 rounded-lg border border-border bg-bg-surface px-2.5 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-purple"
            />
            <input
              value={f.bb}
              onChange={(e) => setFinAt(i, { bb: e.target.value.replace(/[^0-9]/g, '') })}
              placeholder="BB"
              inputMode="numeric"
              className="w-16 rounded-lg border border-border bg-bg-surface px-2 py-2 text-center font-mono text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-purple"
            />
          </div>
        ))}
      </div>

      <Btn className="mt-4 w-full" disabled={!canSave} loading={add.isPending} onClick={submit}>
        {`Add to slate${filled.length ? ` · ${filled.length} finalists` : ''}`}
      </Btn>
      <p className="mt-1.5 text-center text-[10px] text-text-muted">Hosts will see this under “FTs to host”. Players never see the slate.</p>
    </Sheet>
  )
}
