import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Lock, Eye, Timer, Crown, Shield, Check, UserPlus, Scissors, Trophy, MapPin, Wifi, Coins, RotateCcw } from 'lucide-react'
import { useGame, useRequestJoinLL, useApproveLL, useDeclineLL, useTogglePaidLL, useAssignCoHostLL, useRemoveCoHostLL, useUpdateChips, useBust, useReinstate, usePostChatLL, useProposeChop, useAgreeChop, useInviteToGame } from '@/hooks/ll'
import { InviteSheet } from '@/components/common/InviteSheet'
import { CoHostSheet } from '@/components/ll/CoHostSheet'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, Badge, Btn, Card, Section, Sheet, Spinner, EmptyState, ProcessingOverlay } from '@/components/common/ui'
import { PaidToggle } from '@/components/common/PaidToggle'
import { StakePool } from '@/components/common/StakePool'
import { CountdownBanner, regDeadline } from '@/components/common/Countdown'
import { StatusBadge } from '@/components/common/StatusBadge'
import { HowItWorksButton } from '@/components/common/HowItWorksButton'
import { FloatingChat } from '@/components/common/FloatingChat'
import { HowItWorks, type HowStep } from '@/components/common/HowItWorks'
import { useEconomy } from '@/hooks/credits'
import { useLeaderboardConfig } from '@/hooks/leaderboard'
import { awardMap, llAward } from '@/lib/leaderboard/award'
import { DEFAULT_LEADERBOARD } from '@/types/leaderboard'
import { BustedRow } from '@/components/ll/BustedRow'
import { useSpend } from '@/components/credits/SpendProvider'
import type { LLParticipant } from '@/types/ll'
import { fmtChips, digitsOnly } from '@/lib/utils/chipFormat'

const LL_STEPS: HowStep[] = [
  { icon: UserPlus, title: 'Join the game', body: 'Request to join your club’s live tournament — the host admits you and marks you paid.' },
  { icon: Timer, title: 'Play it out', body: 'Everyone starts together. As the night goes, the host updates chip counts and busts players as they’re eliminated.' },
  { icon: Trophy, title: 'Last one standing', body: 'The leaderboard auto-sorts by chips — active players up top, eliminated below with their finish place.' },
  { icon: Scissors, title: 'Deal or chop', body: 'Near the end, players can propose a chop. It only goes through on a unanimous vote.' },
  { icon: Coins, title: 'Split the pool', body: 'Pool = entry × players joined, paid by finish place per the host’s split. Settled offline — the app holds no cash.' },
]

const medal = (n?: number) => (n === 1 ? '🥇' : n === 2 ? '🥈' : n === 3 ? '🥉' : `${n}`)

export function LastLongerGamePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: g, isLoading } = useGame(id)
  const requestJoin = useRequestJoinLL()
  const spend = useSpend()
  const joinCost = useEconomy().data?.costs.joinGameCost ?? 100
  const lpCfg = useLeaderboardConfig().data ?? DEFAULT_LEADERBOARD
  const approve = useApproveLL(); const decline = useDeclineLL()
  const togglePaid = useTogglePaidLL(); const assignCoHost = useAssignCoHostLL(); const removeCoHost = useRemoveCoHostLL()
  const updateChips = useUpdateChips(); const bust = useBust(); const reinstate = useReinstate()
  const postChat = usePostChatLL(); const proposeChop = useProposeChop(); const agreeChop = useAgreeChop()
  const invite = useInviteToGame()
  const [chipInput, setChipInput] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [howOpen, setHowOpen] = useState(false)
  const [coHostOpen, setCoHostOpen] = useState(false)
  const [confirmBust, setConfirmBust] = useState<{ target: string; name: string; self: boolean } | null>(null)

  if (isLoading) return <Spinner label="Loading game…" />
  if (!g) return <EmptyState title="Game not found" />

  const me = g.me
  const isAdmin = user?.role === 'admin'
  const active = g.participants.filter((p) => p.status === 'active').sort((a, b) => b.chips - a.chips)
  const waiting = g.participants.filter((p) => p.status === 'pending')
  const out = g.participants.filter((p) => p.status === 'out').sort((a, b) => (a.finishPos ?? 99) - (b.finishPos ?? 99))
  const canChat = me?.status === 'active' || g.canManage
  // Leaderboard points earned (completed games only) — same math as the club board.
  const lp = g.status === 'completed' ? awardMap(llAward(g, lpCfg)) : new Map<string, number>()

  return (
    <div className="animate-fade-up pb-20">
      <button onClick={() => navigate(-1)} className="mb-2 flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary cursor-pointer"><ChevronLeft className="h-4 w-4" />Back</button>

      <div className="flex items-center gap-2 text-xs text-text-muted"><span className="text-base">{g.clubEmoji}</span>{g.clubName}</div>
      <h1 className="mt-1 flex items-center gap-1.5 text-xl font-extrabold tracking-tight text-text-primary"><Timer className="h-5 w-5 text-accent-amber" />{g.title}</h1>
      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
        <StatusBadge phase={g.status} />
        <span className="font-mono">{g.stake} Stakes</span>
        <span className="text-text-muted">· {g.activeCount} in · {out.length} out</span>
        <HowItWorksButton onClick={() => setHowOpen(true)} />
      </div>
      {(() => { const joined = g.participants.filter((p) => p.status !== 'pending').length; return <StakePool stake={g.stake} pool={g.stake * joined}>· {joined} joined</StakePool> })()}
      {g.status === 'registration' && <div className="mt-3"><CountdownBanner deadline={regDeadline(g.id, g.registrationClosesAt)} sub="Registration closes — join before the clock hits zero" closedLabel="Awaiting host" /></div>}
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
                {a.agreed ? <Badge tone="green"><Check className="h-3 w-3" />Agreed</Badge> : a.userId === user?.id ? <Btn size="sm" loading={agreeChop.isPending} onClick={() => agreeChop.mutate(g.id)}>Agree</Btn> : <span className="text-text-muted">pending</span>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* My status / actions (admins oversee — they don't play) */}
      {g.status !== 'completed' && !isAdmin && (
        <Section title="You">
          {!g.isMemberOfClub && !g.canManage ? (
            <Card className="flex items-start gap-2.5 border-accent-amber/30 bg-accent-amber/10"><Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" /><p className="text-xs leading-snug text-text-secondary">Join <button onClick={() => navigate(`/club/${g.clubId}`)} className="font-bold text-accent-blue underline cursor-pointer">{g.clubName}</button> first to play.</p></Card>
          ) : !me ? (
            <Btn className="w-full" loading={requestJoin.isPending} onClick={async () => { if (await spend({ cost: joinCost, kind: 'join', label: `Joined ${g.title}`, title: g.canManage ? 'Join your game' : 'Join this game', verb: 'Join' })) requestJoin.mutate(g.id) }}><UserPlus className="h-4 w-4" />{g.canManage ? 'Join as a player' : 'Request to join'} · {joinCost} cr</Btn>
          ) : me.status === 'pending' ? (
            <Card className="flex items-start gap-2.5 border-accent-amber/30 bg-accent-amber/10"><Eye className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" /><p className="text-xs leading-snug text-text-secondary"><span className="font-bold text-text-primary">Awaiting host approval.</span> Read-only until the host admits you.</p></Card>
          ) : me.status === 'active' ? (
            <Card>
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-text-muted">Your chips</p><p className="font-mono text-xl font-extrabold text-text-primary">{fmtChips(me.chips)}{me.stale && <span className="ml-2 inline-block h-2 w-2 animate-pulse-soft rounded-full bg-accent-red align-middle" title="stale" />}</p></div>
                <span className="flex items-center gap-1.5 text-xs text-text-muted">Paid <PaidToggle paid={me.paid} editable={false} /></span>
              </div>
              <div className="mt-2 flex gap-2">
                <input value={chipInput} onChange={(e) => setChipInput(digitsOnly(e.target.value))} placeholder="Update chip count…" inputMode="numeric" pattern="[0-9]*" className="flex-1 rounded-xl border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue" />
                <Btn variant="secondary" disabled={!chipInput} loading={updateChips.isPending} onClick={() => { updateChips.mutate({ gameId: g.id, chips: Number(chipInput) || 0 }); setChipInput('') }}>Update</Btn>
              </div>
              <Btn variant="danger" className="mt-2 w-full" loading={bust.isPending && bust.variables?.target === me.userId} onClick={() => setConfirmBust({ target: me.userId, name: 'yourself', self: true })}>Busted — I'm out</Btn>
            </Card>
          ) : (
            <Card className="text-sm text-text-secondary">You finished <span className="font-bold text-text-primary">{medal(me.finishPos)}{typeof me.finishPos === 'number' && me.finishPos > 3 ? ord(me.finishPos) : ''}</span>. GG!</Card>
          )}
        </Section>
      )}

      {/* Host actions */}
      {g.canManage && g.status === 'live' && g.activeCount > 1 && !g.chop && (
        <Btn variant="secondary" className="mt-3 w-full" loading={proposeChop.isPending} onClick={() => proposeChop.mutate(g.id)}><Scissors className="h-4 w-4" />Propose a chop</Btn>
      )}

      {/* Standings (was "Leaderboard" — distinct from the club Leaderboard tab) */}
      <Section title={`Standings · ${active.length} in · ${out.length} out`} action={g.canManage ? <button type="button" onClick={() => setCoHostOpen(true)} className="flex items-center gap-1 rounded-full bg-accent-blue/15 px-2.5 py-1 text-[11px] font-bold text-accent-blue ring-1 ring-accent-blue/30 hover:bg-accent-blue/25 cursor-pointer"><Shield className="h-3 w-3" />Add co-host</button> : undefined}>
        {g.canManage && <p className="mb-2 text-[11px] text-text-muted">Admit players · green dot = paid · "Bust" to eliminate. Co-hosts are set with “Add co-host”.</p>}
        <div className="flex flex-col gap-1.5">
          {active.map((p, i) => (
            <Row key={p.userId} p={p} rank={i + 1} g={g} me={user?.id ?? ''} canManage={g.canManage}
              paidBusy={togglePaid.isPending && togglePaid.variables?.userId === p.userId}
              bustBusy={bust.isPending && bust.variables?.target === p.userId}
              onPaid={() => togglePaid.mutate({ gameId: g.id, userId: p.userId })}
              onBust={() => setConfirmBust({ target: p.userId, name: p.name, self: false })}
              onProfile={g.canManage ? () => navigate(`/member/${p.userId}`) : undefined} />
          ))}
          {waiting.map((p) => (
            <div key={p.userId} className="relative flex items-center gap-2.5 rounded-xl border border-dashed border-accent-amber/40 bg-accent-amber/5 px-3 py-2">
              {decline.isPending && decline.variables?.userId === p.userId && <ProcessingOverlay label="Declining…" />}
              <button onClick={() => navigate(`/member/${p.userId}`)} disabled={!g.canManage} className="flex min-w-0 flex-1 items-center gap-2.5 text-left enabled:cursor-pointer">
                <Avatar name={p.name} color={p.avatarColor} size={30} />
                <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{p.name} <Badge tone="amber">Waiting</Badge></span>
              </button>
              {g.canManage && <><Btn size="sm" loading={approve.isPending && approve.variables?.userId === p.userId} onClick={() => approve.mutate({ gameId: g.id, userId: p.userId })}><Check className="h-3.5 w-3.5" />Admit</Btn><button onClick={() => decline.mutate({ gameId: g.id, userId: p.userId })} className="text-[11px] text-text-muted hover:text-accent-red cursor-pointer">✕</button></>}
            </div>
          ))}
          {out.map((p) => (
            <BustedRow key={p.userId} p={p} medalLabel={medal(p.finishPos)} lpPoints={lp.get(p.userId)} canManage={g.canManage}
              onProfile={() => navigate(`/member/${p.userId}`, { state: { from: `/lastlonger/${g.id}` } })}
              action={g.canManage && p.finishPos !== 1
                ? <Btn size="sm" variant="secondary" loading={reinstate.isPending && reinstate.variables?.target === p.userId} onClick={() => reinstate.mutate({ gameId: g.id, target: p.userId })}><RotateCcw className="h-3.5 w-3.5" />Reinstate</Btn>
                : undefined} />
          ))}
        </div>
      </Section>

      {/* Per-game chat — floating bubble + slide-up sheet, scoped to this game (key={g.id}). */}
      <FloatingChat key={g.id} messages={g.chat} currentUserId={user?.id ?? ''} canSend={canChat} onSend={(text) => postChat.mutate({ gameId: g.id, text })} />

      <InviteSheet open={inviteOpen} onClose={() => setInviteOpen(false)} clubId={g.clubId} accessUserIds={g.accessUserIds ?? []} accent="amber" onInvite={(ids) => invite.mutate({ gameId: g.id, userIds: ids })} isPending={invite.isPending} />
      <CoHostSheet open={coHostOpen} onClose={() => setCoHostOpen(false)} g={g} assign={assignCoHost} remove={removeCoHost} />
      <Sheet open={howOpen} onClose={() => setHowOpen(false)} title="Last Longer — how it works">
        <HowItWorks steps={LL_STEPS} dotBg="bg-accent-amber" iconColor="text-accent-amber" />
      </Sheet>

      {/* Bust confirmation — guards both the host "Out" and the self-bust action. */}
      <Sheet open={!!confirmBust} onClose={() => setConfirmBust(null)} title={confirmBust?.self ? 'Bust yourself out?' : `Bust ${confirmBust?.name}?`}>
        <div className="flex flex-col gap-3">
          <p className="text-sm leading-snug text-text-secondary">
            {confirmBust?.self
              ? "You'll be eliminated and placed by your current chip order. The host can reinstate you if it's a mistake."
              : `${confirmBust?.name} will be eliminated and placed by current chip order. You can reinstate them from the leaderboard if it's a mistake.`}
          </p>
          <div className="flex gap-2">
            <Btn variant="secondary" className="flex-1" onClick={() => setConfirmBust(null)}>Cancel</Btn>
            {/* processing-exempt: closes the confirm on click; the busted player's leaderboard row shows the ProcessingOverlay */}
            <Btn variant="danger" className="flex-1" onClick={() => { if (confirmBust) bust.mutate({ gameId: g.id, target: confirmBust.target }); setConfirmBust(null) }}>{confirmBust?.self ? 'Busted' : 'Bust'}</Btn>
          </div>
        </div>
      </Sheet>
    </div>
  )
}

function Row({ p, rank, g, me, canManage, paidBusy, bustBusy, onPaid, onBust, onProfile }: { p: LLParticipant; rank: number; g: { hostId: string; coHostIds: string[] }; me: string; canManage: boolean; paidBusy?: boolean; bustBusy?: boolean; onPaid: () => void; onBust: () => void; onProfile?: () => void }) {
  const isHost = p.userId === g.hostId
  const isCo = g.coHostIds.includes(p.userId)
  return (
    <div className="relative flex items-center gap-2.5 rounded-xl border border-border bg-bg-card px-3 py-2">
      {bustBusy && <ProcessingOverlay label="Busting…" />}
      <span className="w-5 text-center text-sm font-extrabold text-text-muted">{rank}</span>
      <button onClick={onProfile} disabled={!onProfile} className="flex min-w-0 flex-1 items-center gap-2.5 text-left enabled:cursor-pointer">
        <Avatar name={p.name} color={p.avatarColor} size={32} />
        <span className="flex min-w-0 items-center gap-1 truncate text-sm font-semibold text-text-primary">{p.name}{p.userId === me && <span className="text-[10px] text-accent-blue">(you)</span>}{isHost && <Crown className="h-3 w-3 text-accent-emerald" />}{isCo && <Badge tone="blue">Co</Badge>}</span>
      </button>
      {/* Prominent chip stack — headline metric, right-aligned; time as a small subline. */}
      <div className="flex shrink-0 flex-col items-end leading-none">
        <span className="font-mono text-base font-extrabold tabular-nums text-text-primary">{fmtChips(p.chips)}</span>
        <span className="mt-1 flex items-center gap-0.5 text-[10px] font-medium text-text-muted">
          {p.stale
            ? <span className="inline-block h-1.5 w-1.5 animate-pulse-soft rounded-full bg-accent-red" title={`stale · updated ${p.chipsUpdatedAgo}`} />
            : <Timer className="h-2.5 w-2.5" />}
          {p.chipsUpdatedAgo}
        </span>
      </div>
      {(canManage || p.userId === me) && <PaidToggle paid={p.paid} editable={canManage} busy={paidBusy} onToggle={onPaid} />}
      {canManage && <button onClick={onBust} className="rounded-lg border border-accent-red/30 bg-accent-red/10 px-2 py-1 text-[11px] font-bold text-accent-red hover:bg-accent-red/20 cursor-pointer">Bust</button>}
    </div>
  )
}

function ord(n: number) { return n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th' }
