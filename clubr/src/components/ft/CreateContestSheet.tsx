import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, Clock, Check } from 'lucide-react'
import { useMyClubs } from '@/hooks'
import { useAvailableFTs, useCreateContest } from '@/hooks/ft'
import { Sheet, Btn } from '@/components/common/ui'
import { cn } from '@/lib/utils/cn'

// Shared "host an FT Fantasy contest" sheet. Pass `fixedClubId` from a club
// page (no picker); omit it on the Fantasy tab to show a club picker.
export function CreateContestSheet({ open, onClose, fixedClubId }: { open: boolean; onClose: () => void; fixedClubId?: string }) {
  const navigate = useNavigate()
  const myClubs = useMyClubs()
  const availableFts = useAvailableFTs()
  const create = useCreateContest()
  const managed = (myClubs.data ?? []).filter((c) => c.canManage)
  const [clubId, setClubId] = useState(fixedClubId ?? '')
  const [ftId, setFtId] = useState('')
  const [stake, setStake] = useState(250)

  useEffect(() => {
    if (fixedClubId) setClubId(fixedClubId)
    else if (managed.length === 1) setClubId(managed[0].id)
  }, [fixedClubId, managed.length])

  async function submit() {
    const newId = await create.mutateAsync({ clubId, ftId, stake, budget: 100000 })
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
      <p className="mb-2 text-xs text-text-muted">Pick an upcoming final table (priced by the ClubR operator) and set the bucket.</p>
      <div className="flex max-h-52 flex-col gap-2 overflow-y-auto scrollbar-thin">
        {availableFts.data?.map((f) => (
          <button key={f.id} onClick={() => setFtId(f.id)} className={cn('flex items-center gap-2 rounded-xl border p-2.5 text-left cursor-pointer', ftId === f.id ? 'border-accent-purple ring-1 ring-accent-purple/40' : 'border-border hover:bg-bg-surface')}>
            <Target className="h-4 w-4 shrink-0 text-accent-purple" />
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-text-primary">{f.name}</span><span className="flex items-center gap-1 text-[11px] text-text-muted"><Clock className="h-3 w-3" />{f.startsIn} · ICM priced ✓</span></span>
            {ftId === f.id && <Check className="h-4 w-4 shrink-0 text-accent-purple" />}
          </button>
        ))}
      </div>
      <p className="mt-3 mb-1 text-xs font-semibold text-text-secondary">Bucket (Stakes)</p>
      <div className="flex gap-2">{[100, 250, 500].map((s) => (
        <button key={s} onClick={() => setStake(s)} className={cn('flex-1 rounded-xl border py-2 text-sm font-bold cursor-pointer', stake === s ? 'border-accent-purple bg-accent-purple/15 text-accent-purple' : 'border-border text-text-secondary')}>{s}</button>
      ))}</div>
      <Btn className="mt-3 w-full" disabled={!clubId || !ftId || create.isPending} onClick={submit}>Host this FT</Btn>
    </Sheet>
  )
}
