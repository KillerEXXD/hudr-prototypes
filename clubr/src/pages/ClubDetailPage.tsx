import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Lock, Eye, Copy, Check, Target, Timer, Plus, UserCheck, X, Clock, MapPin } from 'lucide-react'
import { useClub, useApproveMember, useRejectMember, useRequestToJoin } from '@/hooks'
import { useCreateContest, useAvailableFTs } from '@/hooks/ft'
import { useCreateGame } from '@/hooks/ll'
import { Avatar, Badge, Btn, Card, Section, Spinner, EmptyState, Sheet, Field } from '@/components/common/ui'
import { MembershipBadge } from '@/components/common/cards'
import { cn } from '@/lib/utils/cn'

export function ClubDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: club, isLoading } = useClub(id)
  const approve = useApproveMember()
  const reject = useRejectMember()
  const request = useRequestToJoin()
  const createContest = useCreateContest()
  const createGame = useCreateGame()
  const availableFts = useAvailableFTs()
  const [copied, setCopied] = useState(false)
  const [ftOpen, setFtOpen] = useState(false)
  const [llOpen, setLlOpen] = useState(false)
  const [ftId, setFtId] = useState('')
  const [ftStake, setFtStake] = useState(250)
  const [llTitle, setLlTitle] = useState('')
  const [llLoc, setLlLoc] = useState('')
  const [llMode, setLlMode] = useState<'in-person' | 'online'>('in-person')
  const [llStake, setLlStake] = useState(100)

  if (isLoading) return <Spinner label="Loading club…" />
  if (!club) return <EmptyState title="Club not found" />

  const members = club.members.filter((m) => m.status === 'member')
  const pending = club.members.filter((m) => m.status === 'pending')
  const isMember = club.myStatus === 'member'

  function copyCode() {
    navigator.clipboard?.writeText(club!.inviteCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
  }

  return (
    <div className="animate-fade-up">
      <button onClick={() => navigate(-1)} className="mb-2 flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary cursor-pointer"><ChevronLeft className="h-4 w-4" />Back</button>

      <div className="flex items-center gap-3">
        <Avatar emoji={club.emoji} color={club.color} size={56} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold tracking-tight text-text-primary">{club.name}</h1>
          <p className="text-xs text-text-muted">{members.length} members · hosted by {club.ownerName}</p>
        </div>
        <MembershipBadge status={club.myStatus} role={club.myRole} />
      </div>
      <p className="mt-2 text-sm text-text-secondary">{club.description}</p>

      {/* Access state banners */}
      {club.myStatus === 'pending' && (
        <Card className="mt-3 flex items-start gap-2.5 border-accent-amber/30 bg-accent-amber/10">
          <Eye className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" />
          <p className="text-xs leading-snug text-text-secondary"><span className="font-bold text-text-primary">Read-only — awaiting approval.</span> You can look around, but you can't enter games until the host admits you.</p>
        </Card>
      )}
      {club.myStatus === 'none' && (
        <Btn className="mt-3 w-full" onClick={() => request.mutate(club.id)} disabled={request.isPending}><Plus className="h-4 w-4" />Request to join</Btn>
      )}

      {/* Host/admin: invite code + join requests */}
      {club.canManage && (
        <>
          <Section title="Invite code">
            <Card className="flex items-center justify-between">
              <span className="font-mono text-lg font-bold tracking-widest text-text-primary">{club.inviteCode}</span>
              <Btn size="sm" variant="secondary" onClick={copyCode}>{copied ? <><Check className="h-3.5 w-3.5 text-accent-emerald" />Copied</> : <><Copy className="h-3.5 w-3.5" />Copy link</>}</Btn>
            </Card>
          </Section>

          <Section title={`Join requests${pending.length ? ` · ${pending.length}` : ''}`}>
            {pending.length === 0 ? (
              <EmptyState title="No pending requests" sub="When someone requests to join, approve them here." />
            ) : (
              <div className="flex flex-col gap-2">
                {pending.map((m) => (
                  <Card key={m.userId} className="flex items-center gap-3 p-3">
                    <Avatar name={m.name} color={m.avatarColor} size={36} />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-text-primary">{m.name}</p><p className="text-xs text-text-muted">@{m.handle} · requested {m.joinedAt}</p></div>
                    <Btn size="sm" onClick={() => approve.mutate({ clubId: club.id, userId: m.userId })}><UserCheck className="h-3.5 w-3.5" />Admit</Btn>
                    <button onClick={() => reject.mutate({ clubId: club.id, userId: m.userId })} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-bg-surface cursor-pointer" aria-label="Reject"><X className="h-4 w-4" /></button>
                  </Card>
                ))}
              </div>
            )}
          </Section>
        </>
      )}

      {/* Games */}
      <Section title="Games" action={club.canManage ? (
        <div className="flex gap-2">
          <button onClick={() => setFtOpen(true)} className="flex items-center gap-1 text-xs font-bold text-accent-purple cursor-pointer"><Plus className="h-3.5 w-3.5" />Contest</button>
          <button onClick={() => setLlOpen(true)} className="flex items-center gap-1 text-xs font-bold text-accent-amber cursor-pointer"><Plus className="h-3.5 w-3.5" />Game</button>
        </div>
      ) : undefined}>
        <div className="grid grid-cols-2 gap-2">
          <GameTile icon={<Target className="h-5 w-5" />} label="FT Fantasy" sub="Stack Draft" disabled={!isMember && !club.canManage} onClick={() => navigate('/fantasy')} />
          <GameTile icon={<Timer className="h-5 w-5" />} label="Last Longer" sub="Live tournament" disabled={!isMember && !club.canManage} onClick={() => navigate('/lastlonger')} />
        </div>
        {!isMember && !club.canManage && <p className="mt-2 flex items-center gap-1 text-[11px] text-text-muted"><Lock className="h-3 w-3" />Join &amp; get approved to enter games.</p>}
      </Section>

      {/* Members */}
      <Section title={`Members · ${members.length}`}>
        {club.canManage && <p className="mb-2 text-[11px] text-text-muted">You manage this roster — remove a member with ✕.</p>}
        <div className="flex flex-col gap-1.5">
          {members.map((m) => (
            <div key={m.userId} className="flex items-center gap-2.5 rounded-xl border border-border bg-bg-card px-3 py-2">
              <Avatar name={m.name} color={m.avatarColor} size={30} />
              <span className="flex-1 truncate text-sm text-text-primary">{m.name}</span>
              {m.role !== 'member' && <Badge tone={m.role === 'owner' ? 'green' : 'blue'}>{m.role}</Badge>}
              {club.canManage && m.role !== 'owner' && (
                <button onClick={() => reject.mutate({ clubId: club.id, userId: m.userId })} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-accent-red/10 hover:text-accent-red cursor-pointer" aria-label={`Remove ${m.name}`}><X className="h-3.5 w-3.5" /></button>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Host: create an FT Fantasy contest from the operator's slate */}
      <Sheet open={ftOpen} onClose={() => setFtOpen(false)} title="Host an FT Fantasy contest">
        <p className="mb-2 text-xs text-text-muted">Pick an upcoming final table (priced by the ClubR operator) and set the bucket.</p>
        <div className="flex max-h-60 flex-col gap-2 overflow-y-auto scrollbar-thin">
          {availableFts.data?.map((f) => (
            <button key={f.id} onClick={() => setFtId(f.id)} className={cn('flex items-center gap-2 rounded-xl border p-2.5 text-left cursor-pointer', ftId === f.id ? 'border-accent-purple ring-1 ring-accent-purple/40' : 'border-border hover:bg-bg-surface')}>
              <Target className="h-4 w-4 shrink-0 text-accent-purple" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-text-primary">{f.name}</span>
                <span className="flex items-center gap-1 text-[11px] text-text-muted"><Clock className="h-3 w-3" />{f.startsIn} · ICM priced ✓</span>
              </span>
              {ftId === f.id && <Check className="h-4 w-4 shrink-0 text-accent-purple" />}
            </button>
          ))}
        </div>
        <p className="mt-3 mb-1 text-xs font-semibold text-text-secondary">Bucket (Stakes)</p>
        <div className="flex gap-2">{[100, 250, 500].map((s) => (
          <button key={s} onClick={() => setFtStake(s)} className={cn('flex-1 rounded-xl border py-2 text-sm font-bold cursor-pointer', ftStake === s ? 'border-accent-purple bg-accent-purple/15 text-accent-purple' : 'border-border text-text-secondary')}>{s}</button>
        ))}</div>
        <Btn className="mt-3 w-full" disabled={!ftId || createContest.isPending} onClick={async () => { const newId = await createContest.mutateAsync({ clubId: club.id, ftId, stake: ftStake, budget: 100000 }); setFtOpen(false); setFtId(''); if (newId) navigate(`/fantasy/${newId}`) }}>Host this FT</Btn>
      </Sheet>

      {/* Host: create a Last Longer */}
      <Sheet open={llOpen} onClose={() => setLlOpen(false)} title="Create a Last Longer">
        <div className="flex flex-col gap-3">
          <Field label="Tournament name" value={llTitle} onChange={setLlTitle} placeholder="e.g. Friday Night Last Longer" />
          <Field label="Location" value={llLoc} onChange={setLlLoc} placeholder="e.g. Mike's basement, or a site name" />
          <div>
            <span className="mb-1 block text-xs font-semibold text-text-secondary">Format</span>
            <div className="flex gap-2">
              {(['in-person', 'online'] as const).map((m) => (
                <button key={m} onClick={() => setLlMode(m)} className={cn('flex-1 rounded-xl border py-2 text-sm font-bold cursor-pointer', llMode === m ? 'border-accent-amber bg-accent-amber/15 text-accent-amber' : 'border-border text-text-secondary')}>
                  {m === 'in-person' ? <><MapPin className="mr-1 inline h-3.5 w-3.5" />In person</> : 'Online'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-1 block text-xs font-semibold text-text-secondary">Stake</span>
            <div className="flex gap-2">{[50, 100, 250].map((s) => (
              <button key={s} onClick={() => setLlStake(s)} className={cn('flex-1 rounded-xl border py-2 text-sm font-bold cursor-pointer', llStake === s ? 'border-accent-amber bg-accent-amber/15 text-accent-amber' : 'border-border text-text-secondary')}>{s}</button>
            ))}</div>
          </div>
          <Btn className="w-full" disabled={!llTitle.trim() || createGame.isPending} onClick={async () => { const newId = await createGame.mutateAsync({ clubId: club.id, title: llTitle, location: llLoc, mode: llMode, stake: llStake }); setLlOpen(false); setLlTitle(''); setLlLoc(''); if (newId) navigate(`/lastlonger/${newId}`) }}>Create Last Longer</Btn>
        </div>
      </Sheet>
    </div>
  )
}

function GameTile({ icon, label, sub, disabled, onClick }: { icon: React.ReactNode; label: string; sub: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} className="flex flex-col items-start gap-1 rounded-2xl border border-border bg-bg-card p-3.5 text-left transition-colors enabled:hover:bg-bg-surface disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">
      <span className="text-accent-blue">{icon}</span>
      <span className="text-sm font-bold text-text-primary">{label}</span>
      <span className="text-[11px] text-text-muted">{sub}</span>
    </button>
  )
}
