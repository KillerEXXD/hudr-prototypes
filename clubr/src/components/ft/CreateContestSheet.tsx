import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, Clock, Check, Globe, Lock } from 'lucide-react'
import { useMyClubs } from '@/hooks'
import { useAvailableFTs, useCreateContest } from '@/hooks/ft'
import { Sheet, Btn } from '@/components/common/ui'
import { ScheduleFields, PayoutEditor } from '@/components/common/GameSetup'
import { defaultCloseLocal, DEFAULT_PAYOUTS, arePayoutsValid } from '@/lib/gameSetup'
import { cn } from '@/lib/utils/cn'

// Shared "host an FT Fantasy contest" sheet. Pass `fixedClubId` from a club
// page (no picker); omit it on the Fantasy tab to show a club picker.
export function CreateContestSheet({ open, onClose, fixedClubId, presetFtId }: { open: boolean; onClose: () => void; fixedClubId?: string; presetFtId?: string }) {
  const navigate = useNavigate()
  const myClubs = useMyClubs()
  const availableFts = useAvailableFTs()
  const create = useCreateContest()
  const managed = (myClubs.data ?? []).filter((c) => c.canManage)
  const [clubId, setClubId] = useState(fixedClubId ?? '')
  const [ftId, setFtId] = useState('')
  const [stake, setStake] = useState(250)
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [access, setAccess] = useState<string[]>([])
  const [closesAt, setClosesAt] = useState(defaultCloseLocal())
  const [tz, setTz] = useState('ET')
  const [payouts, setPayouts] = useState<number[]>(DEFAULT_PAYOUTS)

  useEffect(() => {
    if (fixedClubId) setClubId(fixedClubId)
    else if (managed.length === 1) setClubId(managed[0].id)
  }, [fixedClubId, managed.length])
  useEffect(() => { if (presetFtId) setFtId(presetFtId) }, [presetFtId])

  const club = managed.find((c) => c.id === clubId)
  const members = (club?.members ?? []).filter((m) => m.status === 'member')

  async function submit() {
    const newId = await create.mutateAsync({ clubId, ftId, stake, budget: 100000, visibility, accessUserIds: access, closesAt, timezone: tz, payouts })
    onClose(); setFtId('')
    if (newId) navigate(`/fantasy/${newId}`)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Host an FT Fantasy contest">
      {!fixedClubId && (
        <>
          <p className="mb-1 text-xs font-semibold text-text-secondary">Which club?</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {managed.length === 0 && <p className="text-xs text-text-muted">You don't host any clubs yet.</p>}
            {managed.map((c) => (
              <button key={c.id} onClick={() => setClubId(c.id)} className={cn('flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-sm font-semibold cursor-pointer', clubId === c.id ? 'border-accent-purple bg-accent-purple/15 text-accent-purple' : 'border-border text-text-secondary')}>
                <span>{c.emoji}</span>{c.name}
              </button>
            ))}
          </div>
        </>
      )}
      {presetFtId ? (
        <div className="mb-1 flex items-center gap-2 rounded-xl border border-accent-purple/30 bg-accent-purple/10 p-2.5 text-sm font-bold text-text-primary"><Target className="h-4 w-4 shrink-0 text-accent-purple" />{availableFts.data?.find((f) => f.id === presetFtId)?.name ?? 'Final table'}</div>
      ) : (
        <>
          <p className="mb-2 text-xs text-text-muted">Pick an upcoming final table (priced by the ClubR operator) and set the bucket.</p>
          <div className="flex max-h-44 flex-col gap-2 overflow-y-auto scrollbar-thin">
            {availableFts.data?.map((f) => (
              <button key={f.id} onClick={() => setFtId(f.id)} className={cn('flex items-center gap-2 rounded-xl border p-2.5 text-left cursor-pointer', ftId === f.id ? 'border-accent-purple ring-1 ring-accent-purple/40' : 'border-border hover:bg-bg-surface')}>
                <Target className="h-4 w-4 shrink-0 text-accent-purple" />
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-text-primary">{f.name}</span><span className="flex items-center gap-1 text-[11px] text-text-muted"><Clock className="h-3 w-3" />{f.startsIn} · ICM priced ✓</span></span>
                {ftId === f.id && <Check className="h-4 w-4 shrink-0 text-accent-purple" />}
              </button>
            ))}
          </div>
        </>
      )}
      <p className="mt-3 mb-1 text-xs font-semibold text-text-secondary">Bucket (Stakes)</p>
      <div className="flex gap-2">
        {[100, 250, 500].map((s) => (
          <button key={s} type="button" onClick={() => setStake(s)} className={cn('flex-1 rounded-xl border py-2 text-sm font-bold cursor-pointer', stake === s ? 'border-accent-purple bg-accent-purple/15 text-accent-purple' : 'border-border text-text-secondary')}>{s}</button>
        ))}
        <input
          type="number" min={1} inputMode="numeric"
          value={[100, 250, 500].includes(stake) ? '' : stake || ''}
          onChange={(e) => setStake(Math.max(0, Number(e.target.value) || 0))}
          placeholder="Custom"
          className={cn('w-20 rounded-xl border bg-bg-surface px-2 py-2 text-center text-sm font-bold text-text-primary placeholder:font-normal placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-purple', ![100, 250, 500].includes(stake) && stake > 0 ? 'border-accent-purple text-accent-purple' : 'border-border')}
        />
      </div>

      <div className="mt-3 flex flex-col gap-3">
        <ScheduleFields accent="purple" closesAt={closesAt} onCloseChange={setClosesAt} tz={tz} onTzChange={setTz} />
        <PayoutEditor accent="purple" payouts={payouts} onChange={setPayouts} />
      </div>

      <p className="mt-3 mb-1 text-xs font-semibold text-text-secondary">Visibility</p>
      <div className="flex gap-2">
        {(['public', 'private'] as const).map((v) => (
          <button key={v} onClick={() => setVisibility(v)} className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-sm font-bold capitalize cursor-pointer', visibility === v ? 'border-accent-purple bg-accent-purple/15 text-accent-purple' : 'border-border text-text-secondary')}>
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

      <Btn className="mt-3 w-full" disabled={!clubId || !ftId || !closesAt || !arePayoutsValid(payouts) || create.isPending} onClick={submit}>Host this FT</Btn>
    </Sheet>
  )
}
