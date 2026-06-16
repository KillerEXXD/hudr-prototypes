import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Lock, Eye, Timer, Crown, Shield, Check, UserPlus, Scissors, Trophy, MapPin, Wifi } from 'lucide-react'
import { useGame, useRequestJoinLL, useApproveLL, useDeclineLL, useTogglePaidLL, useAssignCoHostLL, useUpdateChips, useBust, usePostChatLL, useProposeChop, useAgreeChop, useInviteToGame } from '@/hooks/ll'
import { InviteSheet } from '@/components/common/InviteSheet'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, Badge, Btn, Card, Section, Spinner, EmptyState } from '@/components/common/ui'
import { PaidToggle } from '@/components/common/PaidToggle'
import { GameChat } from '@/components/common/GameChat'
import type { LLParticipant } from '@/types/ll'

const fmtChips = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(n % 1e6 ? 1 : 0)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n))
const medal = (n?: number) => (n === 1 ? '🥇' : n === 2 ? '🥈' : n === 3 ? '🥉' : `${n}`)

export function LastLongerGamePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: g, isLoading } = useGame(id)
  const requestJoin = useRequestJoinLL()
  const approve = useApproveLL(); const decline = useDeclineLL()
  const togglePaid = useTogglePaidLL(); const assignCoHost = useAssignCoHostLL()
  const updateChips = useUpdateChips(); const bust = useBust()
  const postChat = usePostChatLL(); const proposeChop = useProposeChop(); const agreeChop = useAgreeChop()
  const invite = useInviteToGame()
  const [chipInput, setChipInput] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)

  if (isLoading) return <Spinner label="Loading game…" />
  if (!g) return <EmptyState title="Game not found" />

  const me = g.me
  const active = g.participants.filter((p) => p.status === 'active').sort((a, b) => b.chips - a.chips)
  const waiting = g.participants.filter((p) => p.status === 'pending')
  const out = g.participants.filter((p) => p.status === 'out').sort((a, b) => (a.finishPos ?? 99) - (b.finishPos ?? 99))
  const canChat = me?.status === 'active' || g.canManage
  const statusTone = g.status === 'live' ? 'green' : g.status === 'registration' ? 'blue' : 'neutral'

  return (
    <div className="animate-fade-up">
      <button onClick={() => navigate(-1)} className="mb-2 flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary cursor-pointer"><ChevronLeft className="h-4 w-4" />Back</button>

      <div className="flex items-center gap-2 text-xs text-text-muted"><span className="text-base">{g.clubEmoji}</span>{g.clubName}</div>
      <h1 className="mt-1 flex items-center gap-1.5 text-xl font-extrabold tracking-tight text-text-primary"><Timer className="h-5 w-5 text-accent-amber" />{g.title}</h1>
      <div className="mt-1.5 flex items-center gap-2 text-xs text-text-secondary">
        <Badge tone={statusTone}>{g.status === 'live' ? '● Live' : g.status === 'registration' ? 'Registering' : 'Completed'}</Badge>
        <span className="font-mono">{g.stake} Stakes</span>
        <span className="text-text-muted">· {g.activeCount} in · {out.length} out</span>
      </div>
      {(g.location || g.mode) && (
        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-text-muted">
          {g.mode === 'online' ? <Wifi className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
          {g.mode === 'online' ? 'Online' : 'In person'}{g.location && ` · ${g.location}`}
        </p>
      )}
      {g.canManage && g.visibility === 'private' && (
        <Btn variant="secondary" className="mt-3 w-full" onClick={() => setInviteOpen(true)}><UserPlus className="h-4 w-4" />Invite members (private)</Btn>
      )}

      {g.status === 'completed' && (
        <Card className="mt-3 flex items-center gap-2 border-accent-emerald/30 bg-accent-emerald/10">
          <Trophy className="h-5 w-5 text-accent-emerald" /><p className="text-sm font-bold text-text-primary">{g.winnerName} wins! 🎉</p>
        </Card>
      )}

      {/* Chop proposal */}
      {g.chop && g.status !== 'completed' && (
        <Card className="mt-3 border-accent-amber/30 bg-accent-amber/10">
          <p className="flex items-center gap-1.5 text-sm font-bold text-text-primary"><Scissors className="h-4 w-4 text-accent-amber" />Chop proposed by {g.chop.proposedByName}</p>
          <div className="mt-2 flex flex-col gap-1">
            {g.chop.agreements.map((a) => (
              <div key={a.userId} className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">{a.name}</span>
                {a.agreed ? <Badge tone="green"><Check className="h-3 w-3" />Agreed</Badge> : a.userId === user?.id ? <Btn size="sm" onClick={() => agreeChop.mutate(g.id)}>Agree</Btn> : <span className="text-text-muted">pending</span>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* My status / actions */}
      {g.status !== 'completed' && (
        <Section title="You">
          {!g.isMemberOfClub && !g.canManage ? (
            <Card className="flex items-start gap-2.5 border-accent-amber/30 bg-accent-amber/10"><Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" /><p className="text-xs leading-snug text-text-secondary">Join <button onClick={() => navigate(`/club/${g.clubId}`)} className="font-bold text-accent-blue underline cursor-pointer">{g.clubName}</button> first to play.</p></Card>
          ) : !me ? (
            <Btn className="w-full" disabled={requestJoin.isPending} onClick={() => requestJoin.mutate(g.id)}><UserPlus className="h-4 w-4" />{g.canManage ? 'Join as a player' : 'Request to join'}</Btn>
          ) : me.status === 'pending' ? (
            <Card className="flex items-start gap-2.5 border-accent-amber/30 bg-accent-amber/10"><Eye className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" /><p className="text-xs leading-snug text-text-secondary"><span className="font-bold text-text-primary">Awaiting host approval.</span> Read-only until the host admits you.</p></Card>
          ) : me.status === 'active' ? (
            <Card>
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-text-muted">Your chips</p><p className="font-mono text-xl font-extrabold text-text-primary">{fmtChips(me.chips)}{me.stale && <span className="ml-2 inline-block h-2 w-2 animate-pulse-soft rounded-full bg-accent-red align-middle" title="stale" />}</p></div>
                <span className="flex items-center gap-1.5 text-xs text-text-muted">Paid <PaidToggle paid={me.paid} editable={false} /></span>
              </div>
              <div className="mt-2 flex gap-2">
                <input value={chipInput} onChange={(e) => setChipInput(e.target.value)} placeholder="Update chip count…" inputMode="numeric" className="flex-1 rounded-xl border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue" />
                <Btn variant="secondary" disabled={!chipInput || updateChips.isPending} onClick={() => { updateChips.mutate({ gameId: g.id, chips: Number(chipInput) || 0 }); setChipInput('') }}>Update</Btn>
              </div>
              <Btn variant="danger" className="mt-2 w-full" onClick={() => bust.mutate({ gameId: g.id, target: me.userId })}>I'm out — bust myself</Btn>
            </Card>
          ) : (
            <Card className="text-sm text-text-secondary">You finished <span className="font-bold text-text-primary">{medal(me.finishPos)}{typeof me.finishPos === 'number' && me.finishPos > 3 ? ord(me.finishPos) : ''}</span>. GG!</Card>
          )}
        </Section>
      )}

      {/* Host actions */}
      {g.canManage && g.status === 'live' && g.activeCount > 1 && !g.chop && (
        <Btn variant="secondary" className="mt-3 w-full" onClick={() => proposeChop.mutate(g.id)}><Scissors className="h-4 w-4" />Propose a chop</Btn>
      )}

      {/* Leaderboard */}
      <Section title={`Leaderboard · ${g.participants.length}`} action={g.canManage ? <Badge tone="green"><Shield className="h-3 w-3" />You manage</Badge> : undefined}>
        {g.canManage && <p className="mb-2 text-[11px] text-text-muted">Admit players · green dot = paid · tap a name to make a co-host · "Out" to bust.</p>}
        <div className="flex flex-col gap-1.5">
          {active.map((p, i) => (
            <Row key={p.userId} p={p} rank={i + 1} g={g} me={user?.id ?? ''} canManage={g.canManage}
              onPaid={() => togglePaid.mutate({ gameId: g.id, userId: p.userId })}
              onBust={() => bust.mutate({ gameId: g.id, target: p.userId })}
              onCoHost={() => assignCoHost.mutate({ gameId: g.id, userId: p.userId })} />
          ))}
          {waiting.map((p) => (
            <div key={p.userId} className="flex items-center gap-2.5 rounded-xl border border-dashed border-accent-amber/40 bg-accent-amber/5 px-3 py-2">
              <Avatar name={p.name} color={p.avatarColor} size={30} />
              <span className="flex-1 truncate text-sm text-text-primary">{p.name} <Badge tone="amber">Waiting</Badge></span>
              {g.canManage && <><Btn size="sm" onClick={() => approve.mutate({ gameId: g.id, userId: p.userId })}><Check className="h-3.5 w-3.5" />Admit</Btn><button onClick={() => decline.mutate({ gameId: g.id, userId: p.userId })} className="text-[11px] text-text-muted hover:text-accent-red cursor-pointer">✕</button></>}
            </div>
          ))}
          {out.map((p) => (
            <div key={p.userId} className="flex items-center gap-2.5 rounded-xl border border-border bg-bg-card px-3 py-2 opacity-60">
              <span className="w-6 text-center text-sm font-bold text-text-muted">{medal(p.finishPos)}</span>
              <Avatar name={p.name} color={p.avatarColor} size={28} />
              <span className="flex-1 truncate text-sm text-text-secondary line-through">{p.name}</span>
              <span className="text-[11px] text-text-muted">{p.finishPos === 1 ? 'winner 🏆' : p.bustedAgo ? `busted ${p.bustedAgo}` : 'out'}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Table chat">
        <GameChat messages={g.chat} currentUserId={user?.id ?? ''} canSend={canChat} onSend={(text) => postChat.mutate({ gameId: g.id, text })} />
      </Section>

      <InviteSheet open={inviteOpen} onClose={() => setInviteOpen(false)} clubId={g.clubId} accessUserIds={g.accessUserIds ?? []} accent="amber" onInvite={(ids) => invite.mutate({ gameId: g.id, userIds: ids })} isPending={invite.isPending} />
    </div>
  )
}

function Row({ p, rank, g, me, canManage, onPaid, onBust, onCoHost }: { p: LLParticipant; rank: number; g: { hostId: string; coHostIds: string[] }; me: string; canManage: boolean; onPaid: () => void; onBust: () => void; onCoHost: () => void }) {
  const isHost = p.userId === g.hostId
  const isCo = g.coHostIds.includes(p.userId)
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-bg-card px-3 py-2">
      <span className="w-5 text-center text-sm font-extrabold text-text-muted">{rank}</span>
      <Avatar name={p.name} color={p.avatarColor} size={32} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 truncate text-sm font-semibold text-text-primary">{p.name}{p.userId === me && <span className="text-[10px] text-accent-blue">(you)</span>}{isHost && <Crown className="h-3 w-3 text-accent-emerald" />}{isCo && <Badge tone="blue">Co</Badge>}</p>
        <p className="flex items-center gap-1 font-mono text-[11px] text-text-muted">{fmtChips(p.chips)}{p.stale && <span className="inline-block h-1.5 w-1.5 animate-pulse-soft rounded-full bg-accent-red" title={`stale · ${p.chipsUpdatedAgo}`} />}<span className="text-text-muted/70"> · {p.chipsUpdatedAgo}</span></p>
      </div>
      {(canManage || p.userId === me) && <PaidToggle paid={p.paid} editable={canManage} onToggle={onPaid} />}
      {canManage && !isHost && !isCo && <button onClick={onCoHost} title="Make co-host" className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-bg-surface cursor-pointer"><Shield className="h-3.5 w-3.5" /></button>}
      {canManage && <button onClick={onBust} className="rounded-lg border border-accent-red/30 bg-accent-red/10 px-2 py-1 text-[11px] font-bold text-accent-red hover:bg-accent-red/20 cursor-pointer">Out</button>}
    </div>
  )
}

function ord(n: number) { return n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th' }
