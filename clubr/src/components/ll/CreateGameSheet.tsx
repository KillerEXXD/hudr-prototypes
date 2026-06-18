import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Globe, Lock } from 'lucide-react'
import { useMyClubs } from '@/hooks'
import { useCreateGame } from '@/hooks/ll'
import { useEconomy } from '@/hooks/credits'
import { useSpend } from '@/components/credits/SpendProvider'
import { Sheet, Btn, Field } from '@/components/common/ui'
import { CityField } from '@/components/common/CityField'
import { ScheduleFields, PayoutEditor } from '@/components/common/GameSetup'
import { defaultCloseLocal, DEFAULT_PAYOUTS, arePayoutsValid } from '@/lib/gameSetup'
import { cn } from '@/lib/utils/cn'

// Shared "create a Last Longer" sheet. Pass `fixedClubId` from a club page
// (no picker); omit it on the Last Longer tab to show a club picker.
export function CreateGameSheet({ open, onClose, fixedClubId }: { open: boolean; onClose: () => void; fixedClubId?: string }) {
  const navigate = useNavigate()
  const myClubs = useMyClubs()
  const create = useCreateGame()
  const spend = useSpend()
  const hostCost = useEconomy().data?.costs.hostGameCost ?? 100
  const managed = (myClubs.data ?? []).filter((c) => c.canManage)
  const [clubId, setClubId] = useState(fixedClubId ?? '')
  const [title, setTitle] = useState('')
  const [loc, setLoc] = useState('')
  const [mode, setMode] = useState<'in-person' | 'online'>('in-person')
  const [stake, setStake] = useState(100)
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [access, setAccess] = useState<string[]>([])
  const [closesAt, setClosesAt] = useState(defaultCloseLocal())
  const [tz, setTz] = useState('ET')
  const [payouts, setPayouts] = useState<number[]>(DEFAULT_PAYOUTS)

  useEffect(() => {
    if (fixedClubId) setClubId(fixedClubId)
    else if (managed.length === 1) setClubId(managed[0].id)
  }, [fixedClubId, managed.length])

  const club = managed.find((c) => c.id === clubId)
  const members = (club?.members ?? []).filter((m) => m.status === 'member')

  async function submit() {
    if (!(await spend({ cost: hostCost, kind: 'host_game', label: `Hosted ${title.trim() || 'a Last Longer'}`, title: 'Host this Last Longer', verb: 'Host' }))) return
    const newId = await create.mutateAsync({ clubId, title, location: loc, mode, stake, visibility, accessUserIds: access, closesAt, timezone: tz, payouts })
    onClose(); setTitle(''); setLoc('')
    if (newId) navigate(`/lastlonger/${newId}`)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Create a Last Longer">
      <div className="flex flex-col gap-3">
        {!fixedClubId && (
          <div>
            <span className="mb-1 block text-xs font-semibold text-text-secondary">Which club?</span>
            <div className="flex flex-wrap gap-2">
              {managed.length === 0 && <p className="text-xs text-text-muted">You don't host any clubs yet.</p>}
              {managed.map((c) => (
                <button key={c.id} onClick={() => setClubId(c.id)} className={cn('flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-sm font-semibold cursor-pointer', clubId === c.id ? 'border-accent-amber bg-accent-amber/15 text-accent-amber' : 'border-border text-text-secondary')}>
                  <span>{c.emoji}</span>{c.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <Field label="Tournament name" value={title} onChange={setTitle} placeholder="e.g. Friday Night Last Longer" />
        <CityField label="Location" value={loc} onChange={setLoc} placeholder="e.g. a city, or a venue name" />
        <div>
          <span className="mb-1 block text-xs font-semibold text-text-secondary">Format</span>
          <div className="flex gap-2">
            {(['in-person', 'online'] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={cn('flex-1 rounded-xl border py-2 text-sm font-bold cursor-pointer', mode === m ? 'border-accent-amber bg-accent-amber/15 text-accent-amber' : 'border-border text-text-secondary')}>
                {m === 'in-person' ? <><MapPin className="mr-1 inline h-3.5 w-3.5" />In person</> : 'Online'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="mb-1 block text-xs font-semibold text-text-secondary">Stake</span>
          <div className="flex gap-2">
            {[50, 100, 250].map((s) => (
              <button key={s} type="button" onClick={() => setStake(s)} className={cn('flex-1 rounded-xl border py-2 text-sm font-bold cursor-pointer', stake === s ? 'border-accent-amber bg-accent-amber/15 text-accent-amber' : 'border-border text-text-secondary')}>{s}</button>
            ))}
            <input
              type="number" min={1} inputMode="numeric"
              value={[50, 100, 250].includes(stake) ? '' : stake || ''}
              onChange={(e) => setStake(Math.max(0, Number(e.target.value) || 0))}
              placeholder="Custom"
              className={cn('w-20 rounded-xl border bg-bg-surface px-2 py-2 text-center text-sm font-bold text-text-primary placeholder:font-normal placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-amber', ![50, 100, 250].includes(stake) && stake > 0 ? 'border-accent-amber text-accent-amber' : 'border-border')}
            />
          </div>
        </div>
        <ScheduleFields accent="amber" closesAt={closesAt} onCloseChange={setClosesAt} tz={tz} onTzChange={setTz} />
        <PayoutEditor accent="amber" payouts={payouts} onChange={setPayouts} />
        <div>
          <span className="mb-1 block text-xs font-semibold text-text-secondary">Visibility</span>
          <div className="flex gap-2">
            {(['public', 'private'] as const).map((v) => (
              <button key={v} onClick={() => setVisibility(v)} className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-sm font-bold capitalize cursor-pointer', visibility === v ? 'border-accent-amber bg-accent-amber/15 text-accent-amber' : 'border-border text-text-secondary')}>
                {v === 'public' ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}{v}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-text-muted">{visibility === 'public' ? 'All club members can see it & request to join.' : 'Only the members you pick can see it. Approval still required.'}</p>
          {visibility === 'private' && (
            <div className="mt-2 max-h-32 overflow-y-auto scrollbar-thin rounded-xl border border-border p-2">
              {members.length === 0 ? <p className="text-xs text-text-muted">No members to add yet.</p> : members.map((m) => (
                <label key={m.userId} className="flex items-center gap-2 py-1 text-sm cursor-pointer">
                  <input type="checkbox" checked={access.includes(m.userId)} onChange={(e) => setAccess((a) => e.target.checked ? [...a, m.userId] : a.filter((x) => x !== m.userId))} />
                  <span className="text-text-primary">{m.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <Btn className="w-full" disabled={!clubId || !title.trim() || !closesAt || !arePayoutsValid(payouts)} loading={create.isPending} onClick={submit}>Create Last Longer · {hostCost} cr</Btn>
      </div>
    </Sheet>
  )
}
