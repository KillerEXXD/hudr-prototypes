import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Grid3x3, Globe, Lock, Repeat, Users, Undo2, Heart } from 'lucide-react'
import { useMyClubs } from '@/hooks'
import { useCreateSquares, useRolloverPools } from '@/hooks/squares'
import { useEconomy } from '@/hooks/credits'
import { useSpend } from '@/components/credits/SpendProvider'
import { Sheet, Btn, Field } from '@/components/common/ui'
import { ScheduleFields } from '@/components/common/GameSetup'
import { defaultCloseLocal, detectZone, zonedWallToUtcISO, arePayoutsValid, payoutsSum } from '@/lib/gameSetup'
import { DEFAULT_PERIOD_PAYOUTS, SQUARES_PERIODS } from '@/types/squares'
import { cn } from '@/lib/utils/cn'

export function CreateSquaresSheet({ open, onClose, fixedClubId }: { open: boolean; onClose: () => void; fixedClubId?: string }) {
  const navigate = useNavigate()
  const myClubs = useMyClubs()
  const create = useCreateSquares()
  const spend = useSpend()
  const hostCost = useEconomy().data?.costs.hostGameCost ?? 100
  const managed = (myClubs.data ?? []).filter((c) => c.canManage)
  const [clubId, setClubId] = useState(fixedClubId ?? '')
  const [title, setTitle] = useState('')
  const [home, setHome] = useState('')
  const [away, setAway] = useState('')
  const [stake, setStake] = useState(100)
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [access, setAccess] = useState<string[]>([])
  const [closesAt, setClosesAt] = useState(defaultCloseLocal())
  const [tz, setTz] = useState(detectZone())
  const [payouts, setPayouts] = useState<number[]>(DEFAULT_PERIOD_PAYOUTS)
  // House rule for unclaimed period prizes (a quarter's winning cell wasn't claimed).
  // Defaults to rollover — matches the prior implicit behavior.
  const [noWinnerRule, setNoWinnerRule] = useState<'rollover' | 'split' | 'refund' | 'charity'>('rollover')
  const [charityName, setCharityName] = useState('')
  // Cross-game rollover: pending Q4 pools from finished same-club games the host can
  // carry into THIS game's Q4. Only relevant under the Rollover rule.
  const [rollIn, setRollIn] = useState<string[]>([])
  const pools = useRolloverPools(clubId)
  const poolList = pools.data ?? []
  // Drop selections that no longer apply when the club changes or the rule isn't rollover.
  useEffect(() => { setRollIn([]) }, [clubId])
  useEffect(() => { if (noWinnerRule !== 'rollover') setRollIn([]) }, [noWinnerRule])
  const toggleRollIn = (id: string) => setRollIn((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  useEffect(() => { if (fixedClubId) setClubId(fixedClubId); else if (managed.length === 1) setClubId(managed[0].id) }, [fixedClubId, managed.length])

  const club = managed.find((c) => c.id === clubId)
  const members = (club?.members ?? []).filter((m) => m.status === 'member')
  const sumOk = arePayoutsValid(payouts)
  const canCreate = !!clubId && !!title.trim() && !!home.trim() && !!away.trim() && !!closesAt && sumOk

  async function submit() {
    if (!(await spend({ cost: hostCost, kind: 'host_game', label: `Hosted ${title.trim() || 'a Squares board'}`, title: 'Host this Squares board', verb: 'Host' }))) return
    const id = await create.mutateAsync({ clubId, title, homeTeam: home, awayTeam: away, stake, visibility, accessUserIds: access, closesAt: zonedWallToUtcISO(closesAt, tz), timezone: tz, periodPayouts: payouts, noWinnerRule, charityName: noWinnerRule === 'charity' ? charityName : undefined, rolledOverFromGameIds: noWinnerRule === 'rollover' ? rollIn : [] })
    onClose(); setTitle(''); setHome(''); setAway('')
    if (id) navigate(`/squares/${id}`)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Create Squares">
      <div className="flex flex-col gap-3">
        {!fixedClubId && (
          <div>
            <span className="mb-1 block text-xs font-semibold text-text-secondary">Which club?</span>
            <div className="flex flex-wrap gap-2">
              {managed.length === 0 && <p className="text-xs text-text-muted">You don't host any clubs yet.</p>}
              {managed.map((c) => (
                <button key={c.id} type="button" onClick={() => setClubId(c.id)} className={cn('flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-sm font-semibold cursor-pointer', clubId === c.id ? 'border-accent-emerald bg-accent-emerald/15 text-accent-emerald' : 'border-border text-text-secondary')}><span>{c.emoji}</span>{c.name}</button>
              ))}
            </div>
          </div>
        )}
        <Field label="Title" value={title} onChange={setTitle} placeholder="e.g. Sunday Squares" />
        <div className="flex gap-2">
          <div className="flex-1"><Field label="Home team" value={home} onChange={setHome} placeholder="e.g. Chiefs" /></div>
          <div className="flex-1"><Field label="Away team" value={away} onChange={setAway} placeholder="e.g. Eagles" /></div>
        </div>
        <div>
          <span className="mb-1 block text-xs font-semibold text-text-secondary">Per-square buy-in (Stakes)</span>
          <div className="flex gap-2">
            {[50, 100, 250].map((s) => (
              <button key={s} type="button" onClick={() => setStake(s)} className={cn('flex-1 rounded-xl border py-2 text-sm font-bold cursor-pointer', stake === s ? 'border-accent-emerald bg-accent-emerald/15 text-accent-emerald' : 'border-border text-text-secondary')}>{s}</button>
            ))}
            <input type="number" min={1} inputMode="numeric" value={[50, 100, 250].includes(stake) ? '' : stake || ''} onChange={(e) => setStake(Math.max(0, Number(e.target.value) || 0))} placeholder="Custom" className={cn('w-20 rounded-xl border bg-bg-surface px-2 py-2 text-center text-sm font-bold text-text-primary placeholder:font-normal placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-emerald', ![50, 100, 250].includes(stake) && stake > 0 ? 'border-accent-emerald text-accent-emerald' : 'border-border')} />
          </div>
        </div>
        <ScheduleFields accent="amber" closesAt={closesAt} onCloseChange={setClosesAt} tz={tz} onTzChange={setTz} />
        <div>
          <span className="mb-1 block text-xs font-semibold text-text-secondary">Payouts by period</span>
          <div className="flex gap-2">
            {SQUARES_PERIODS.map((label, i) => (
              <div key={label} className="flex-1">
                <span className="mb-0.5 block text-center text-[10px] font-semibold text-text-muted">{label === 'Final' ? 'Q4' : label}</span>
                <div className="flex items-center rounded-lg border border-border bg-bg-surface">
                  <input type="number" min={0} max={100} value={payouts[i] ?? 0} onChange={(e) => setPayouts((p) => p.map((x, j) => (j === i ? Math.max(0, Math.min(100, Number(e.target.value) || 0)) : x)))} className="w-full rounded-lg bg-transparent px-1.5 py-1.5 text-center text-sm font-bold text-text-primary focus:outline-none" />
                  <span className="pr-1.5 text-[10px] text-text-muted">%</span>
                </div>
              </div>
            ))}
          </div>
          <p className={cn('mt-1 text-right text-xs font-bold', sumOk ? 'text-accent-emerald' : 'text-accent-red')}>Total {payoutsSum(payouts)}% {sumOk ? '✓' : '— must equal 100%'}</p>
        </div>

        {/* House rule for unclaimed periods. Players see this prominently on the
            settled game page so they know the contract up front. */}
        <div>
          <span className="mb-1 block text-xs font-semibold text-text-secondary">If a quarter has no winner</span>
          <div className="flex flex-col gap-1.5">
            {([
              { key: 'rollover', icon: Repeat, title: 'Rollover',          body: "Every unwon quarter rolls onto Q4. If Q4 is also unwon, the whole pool carries to the next game's Q4 — you, the host, decide which game." },
              { key: 'split',    icon: Users,  title: 'Split equally',     body: "Unclaimed prize splits equally among the players who won other periods of this game." },
              { key: 'refund',   icon: Undo2,  title: 'Refund (pro-rated)', body: 'Unclaimed prize returns to players in proportion to how many squares each owns.' },
              { key: 'charity',  icon: Heart,  title: 'Charity',           body: 'Unclaimed prize is donated. You can name the cause.' },
            ] as const).map((opt) => {
              const active = noWinnerRule === opt.key
              const Icon = opt.icon
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setNoWinnerRule(opt.key)}
                  className={cn('flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition-colors cursor-pointer',
                    active ? 'border-accent-emerald bg-accent-emerald/10' : 'border-border hover:bg-bg-surface')}
                  aria-pressed={active ? 'true' : 'false'}
                >
                  <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    active ? 'bg-accent-emerald/20 text-accent-emerald' : 'bg-bg-surface text-text-muted')}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('flex items-center gap-1.5 text-sm font-bold', active ? 'text-text-primary' : 'text-text-secondary')}>
                      {opt.title}
                      {opt.key === 'rollover' && <span className="rounded-full bg-accent-emerald/15 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-accent-emerald">Default</span>}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-text-muted">{opt.body}</span>
                  </span>
                </button>
              )
            })}
          </div>
          {noWinnerRule === 'charity' && (
            <div className="mt-2">
              <Field label="Charity name (optional)" value={charityName} onChange={setCharityName} placeholder="e.g. Red Cross, school fund" />
              <p className="mt-1 text-[10px] leading-snug text-text-muted">Shown on the settled game page. ClubR is the scorekeeper — donations settle off-app.</p>
            </div>
          )}
          {/* Cross-game rollover — carry pending Q4s from finished same-club games. */}
          {noWinnerRule === 'rollover' && !!clubId && poolList.length > 0 && (
            <div className="mt-2.5 rounded-xl border border-accent-emerald/30 bg-accent-emerald/[0.06] p-2.5">
              <p className="text-[11px] font-bold text-text-secondary">Carry in unclaimed Q4s <span className="font-normal text-text-muted">(optional)</span></p>
              <p className="mt-0.5 text-[10px] leading-snug text-text-muted">These finished games had no Q4 winner — add their pools onto this game's Q4. Each pool can be carried only once.</p>
              <div className="mt-2 flex flex-col gap-1">
                {poolList.map((p) => (
                  <label key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-bg-card px-2 py-1.5 text-xs cursor-pointer">
                    <span className="flex min-w-0 items-center gap-2">
                      <input type="checkbox" checked={rollIn.includes(p.id)} onChange={() => toggleRollIn(p.id)} />
                      <span className="min-w-0 truncate font-semibold text-text-primary">{p.title} <span className="font-normal text-text-muted">· {p.homeTeam} v {p.awayTeam}</span></span>
                    </span>
                    <span className="shrink-0 font-mono font-bold text-accent-emerald">+{p.amount.toLocaleString()}</span>
                  </label>
                ))}
              </div>
              {rollIn.length > 0 && (
                <p className="mt-1.5 text-[11px] font-semibold text-accent-emerald">Carrying {rollIn.length} pool{rollIn.length > 1 ? 's' : ''} → +{poolList.filter((p) => rollIn.includes(p.id)).reduce((s, p) => s + p.amount, 0).toLocaleString()} onto Q4</p>
              )}
            </div>
          )}
        </div>

        <div>
          <span className="mb-1 block text-xs font-semibold text-text-secondary">Visibility</span>
          <div className="flex gap-2">
            {(['public', 'private'] as const).map((v) => (
              <button key={v} type="button" onClick={() => setVisibility(v)} className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-sm font-bold capitalize cursor-pointer', visibility === v ? 'border-accent-emerald bg-accent-emerald/15 text-accent-emerald' : 'border-border text-text-secondary')}>{v === 'public' ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}{v}</button>
            ))}
          </div>
          {visibility === 'private' && (
            <div className="mt-2 max-h-32 overflow-y-auto scrollbar-thin rounded-xl border border-border p-2">
              {members.length === 0 ? <p className="text-xs text-text-muted">No members to add yet.</p> : members.map((m) => (
                <label key={m.userId} className="flex items-center gap-2 py-1 text-sm cursor-pointer">
                  <input type="checkbox" checked={access.includes(m.userId)} onChange={(e) => setAccess((a) => (e.target.checked ? [...a, m.userId] : a.filter((x) => x !== m.userId)))} />
                  <span className="text-text-primary">{m.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <Btn className="w-full" disabled={!canCreate} loading={create.isPending} onClick={submit}><Grid3x3 className="h-4 w-4" />Create Squares · {hostCost} cr</Btn>
      </div>
    </Sheet>
  )
}
