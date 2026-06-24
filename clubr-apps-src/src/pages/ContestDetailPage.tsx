import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Lock, Eye, Target, Trophy, UserPlus, Check, Crown, Shield, Clock, Flag, Ban, AlertTriangle } from 'lucide-react'
import { GameJoinBanner } from '@/components/games/GameJoinBanner'
import { ShareGameButton } from '@/components/games/ShareGameButton'
import { GameHostLine } from '@/components/games/GameHostLine'
import { PrivateGameCard } from '@/components/games/PrivateGameCard'
import { isPrivateGate } from '@/lib/api/privateGame'
import { useContest, useRequestEnter, useApproveEntry, useDeclineEntry, useTogglePaid, useAssignCoHost, useSavePicks, usePostChat, useInviteToContest, useExtendRegFT, useCloseRegFT, useSetFinishingOrder, useCancelFT } from '@/hooks/ft'
import { EditRegistrationSheet } from '@/components/games/EditRegistrationSheet'
import { CancelGameSheet } from '@/components/games/CancelGameSheet'
import { FinishingOrderSheet } from '@/components/ft/FinishingOrderSheet'
import { RegClosedBanner } from '@/components/games/RegClosedBanner'
import { InviteSheet } from '@/components/common/InviteSheet'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, Badge, Btn, Card, Section, Sheet, Spinner, EmptyState, ProcessingOverlay } from '@/components/common/ui'
import { PaidToggle } from '@/components/common/PaidToggle'
import { FloatingChat } from '@/components/common/FloatingChat'
import { DraftBoard } from '@/components/ft/DraftBoard'
import { FinalTableDetails } from '@/components/ft/FinalTableDetails'
import { SettledResult } from '@/components/ft/SettledResult'
import { StakePool } from '@/components/common/StakePool'
import { HowItWorksFT } from '@/components/ft/HowItWorks'
import { HowScoringPricing } from '@/components/ft/HowScoringPricing'
import { CountdownBanner, regDeadline } from '@/components/common/Countdown'
import { CloseTimeLabel } from '@/components/common/CloseTime'
import { ftPhase } from '@/lib/gameStatus'
import { StatusBadge } from '@/components/common/StatusBadge'
import { HowItWorksButton } from '@/components/common/HowItWorksButton'
import { fmtK, picksToNames, playerFull } from '@/lib/utils/ftFormat'
import { useEconomy } from '@/hooks/credits'
import { useSpend } from '@/components/credits/SpendProvider'

export function ContestDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: c, isLoading } = useContest(id)
  const spend = useSpend()
  const joinCost = useEconomy().data?.costs.joinGameCost ?? 100
  const requestEnter = useRequestEnter()
  const approve = useApproveEntry()
  const decline = useDeclineEntry()
  const togglePaid = useTogglePaid()
  const assignCoHost = useAssignCoHost()
  const savePicks = useSavePicks()
  const postChat = usePostChat()
  const invite = useInviteToContest()
  const extendReg = useExtendRegFT()
  const closeReg = useCloseRegFT()
  const setFinishingOrder = useSetFinishingOrder(); const cancel = useCancelFT()
  const [editRegOpen, setEditRegOpen] = useState(false)
  const [picks, setPicks] = useState<string[]>([])
  const [inviteOpen, setInviteOpen] = useState(false)
  const [howOpen, setHowOpen] = useState(false)
  const [icmOpen, setIcmOpen] = useState(false)
  const [finishOpen, setFinishOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [completeAudit, setCompleteAudit] = useState<{ blockers: string[]; hint?: string } | null>(null)

  useEffect(() => { if (c?.myEntry) setPicks(c.myEntry.picks) }, [c?.myEntry?.picks?.join(',')]) // eslint-disable-line

  if (isLoading) return <Spinner label="Loading contest…" />
  if (!c) return <EmptyState title="Contest not found" />
  if (isPrivateGate(c)) return <PrivateGameCard info={c.private} />

  const me = c.myEntry
  const isAdmin = user?.role === 'admin'
  const approved = me?.status === 'approved'
  const canChat = approved || c.canManage

  return (
    <div className="animate-fade-up pb-20">
      <button onClick={() => navigate('/')} className="mb-2 flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary cursor-pointer"><ChevronLeft className="h-4 w-4" />Back</button>
      <GameJoinBanner />

      <div className="flex items-center gap-2 text-xs text-text-muted"><span className="text-base">{c.clubEmoji}</span>{c.clubName}<Badge tone="purple">Stack Draft</Badge></div>
      <div className="mt-1 flex items-start justify-between gap-2"><h1 className="flex items-center gap-1.5 text-xl font-extrabold tracking-tight text-text-primary"><Target className="h-5 w-5 text-accent-purple" />{c.ftName}</h1><ShareGameButton type="ft" gameId={c.id} /></div>
      <div className="mt-1"><GameHostLine hostId={c.hostId} knownName={c.entries.find((e) => e.userId === c.hostId)?.name} /></div>
      <div className="mt-1.5 flex items-center gap-2 text-xs text-text-secondary">
        <StatusBadge phase={ftPhase(c.status)} />
        {c.format === 'winner_takes_all' && <Badge tone="amber"><Trophy className="h-3 w-3" />Winner takes all</Badge>}
        <span className="font-mono">{c.stake} Stakes</span><span className="text-text-muted">· budget {fmtK(c.budget)}</span>
        <HowItWorksButton onClick={() => setHowOpen(true)} />
        {c.status !== 'open' && (c.locksAtTs ? <CloseTimeLabel utcISO={c.locksAtTs} prefix="Locked " className="ml-auto text-text-muted" /> : <span className="ml-auto text-text-muted">{c.locksAt}</span>)}
      </div>
      {(() => { const joined = c.entries.filter((e) => e.status === 'approved').length; return <StakePool stake={c.stake} pool={c.stake * joined}>· {joined} joined</StakePool> })()}

      {/* ===== Ticking "Closes in" countdown — draft locks at the deadline ===== */}
      {c.status === 'open' && (
        <div className="mt-3">
          <CountdownBanner deadline={regDeadline(c.locksAtTs ?? c.locksAt)} sub="Draft locks when the clock hits zero — get your picks in" />
          <div className="mt-1 flex items-center justify-between gap-2">
            <CloseTimeLabel utcISO={c.locksAtTs} className="text-[11px] text-text-muted" />
            {c.canManage && <button type="button" onClick={() => setEditRegOpen(true)} className="flex items-center gap-1 text-[11px] font-semibold text-accent-blue hover:underline cursor-pointer"><Clock className="h-3 w-3" />Edit time</button>}
          </div>
        </div>
      )}
      {c.regClosedEarly && c.status !== 'open' && <RegClosedBanner gameId={c.id} show />}
      <EditRegistrationSheet open={editRegOpen} onClose={() => setEditRegOpen(false)} currentCloseISO={c.locksAtTs} busy={extendReg.isPending || closeReg.isPending} onExtend={(closesAt) => extendReg.mutate({ contestId: c.id, closesAt }, { onSuccess: () => setEditRegOpen(false) })} onCloseReg={() => closeReg.mutate(c.id, { onSuccess: () => setEditRegOpen(false) })} />

      {c.canManage && c.visibility === 'private' && (
        <Btn variant="secondary" className="mt-3 w-full" onClick={() => setInviteOpen(true)}><UserPlus className="h-4 w-4" />Invite members (private)</Btn>
      )}

      {/* ===== OPEN: entry CTA up top — request to enter, then draft (admins don't play) ===== */}
      {c.status === 'open' && !isAdmin && (
        <Section title="Your entry">
          {!c.isMemberOfClub && !c.canManage ? (
            <Card className="flex items-start gap-2.5 border-accent-amber/30 bg-accent-amber/10">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" />
              <p className="text-xs leading-snug text-text-secondary">Join <button onClick={() => navigate(`/club/${c.clubId}`)} className="font-bold text-accent-blue underline cursor-pointer">{c.clubName}</button> first — you must be an approved member to enter its contests.</p>
            </Card>
          ) : !me ? (
            <>
              <Card className="text-sm text-text-secondary">{c.canManage ? "You're hosting this contest — you can also join and draft like a player." : 'Request to enter — the host will admit you, then you can draft.'}</Card>
              <Btn className="mt-2 w-full" loading={requestEnter.isPending} onClick={async () => { if (await spend({ cost: joinCost, kind: 'join', label: `Joined ${c.ftName}`, title: c.canManage ? 'Join your contest' : 'Join this contest', verb: 'Join' })) requestEnter.mutate(c.id) }}><UserPlus className="h-4 w-4" />{c.canManage ? 'Join as a player' : 'Request to enter'} · {joinCost} cr</Btn>
            </>
          ) : me.status === 'pending' ? (
            <Card className="flex items-start gap-2.5 border-accent-amber/30 bg-accent-amber/10">
              <Eye className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" />
              <p className="text-xs leading-snug text-text-secondary"><span className="font-bold text-text-primary">Awaiting host approval.</span> You'll be able to draft once you're admitted.</p>
            </Card>
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-text-secondary"><Check className="h-3.5 w-3.5 text-accent-emerald" />You're in</span>
                <span className="flex items-center gap-1.5 text-text-muted">Paid <PaidToggle paid={me.paid} editable={false} /></span>
              </div>
              <DraftBoard players={c.players} budget={c.budget} value={picks} onChange={setPicks} />
              <Btn className="mt-2 w-full" disabled={picks.length !== 4} loading={savePicks.isPending} onClick={() => savePicks.mutate({ contestId: c.id, picks })}>
                {me.picks.length === 4 ? 'Update draft' : 'Submit draft'} {picks.length !== 4 && `· pick ${4 - picks.length} more`}
              </Btn>
            </>
          )}
        </Section>
      )}

      {/* ===== Full FT details — roster, stacks, prices, live stream (everyone) ===== */}
      <FinalTableDetails contest={c} />

      {/* ===== SETTLED: winner / podium + prizes + leaderboard ===== */}
      {c.status === 'settled' && <SettledResult c={c} meId={user?.id} />}

      {c.status === 'cancelled' && (
        <Card className="mt-3 flex items-start gap-2 border-accent-red/30 bg-accent-red/10">
          <Ban className="mt-0.5 h-5 w-5 shrink-0 text-accent-red" />
          <div><p className="text-sm font-bold text-text-primary">Contest cancelled by the host</p>{c.cancelReason && <p className="mt-0.5 text-xs text-text-secondary">{c.cancelReason}</p>}</div>
        </Card>
      )}

      {/* ===== Host: Complete (enter finishing order) / Cancel ===== */}
      {c.canManage && (c.status === 'open' || c.status === 'locked') && (
        <div className="mt-3 flex gap-2">
          <Btn variant="secondary" className="flex-1"
            onClick={() => c.status === 'locked'
              ? setFinishOpen(true)
              : setCompleteAudit({ blockers: ['Registration is still open — players can still change their drafts.'], hint: 'Close registration (lock the drafts) first, then enter the finishing order to crown the winner.' })}>
            <Flag className="h-4 w-4" />Complete contest
          </Btn>
          <Btn variant="danger" className="flex-1" onClick={() => setCancelOpen(true)}><Ban className="h-4 w-4" />Cancel contest</Btn>
        </div>
      )}

      {/* ===== LOCKED: picks revealed to everyone, scores pending ===== */}
      {c.status === 'locked' && (
        <Section title="Picks — locked in">
          <p className="mb-2 text-[11px] text-text-muted">The lock has passed, so picks are revealed to everyone. Scores post when the FT finishes.</p>
          <div className="flex flex-col gap-1.5">
            {c.entries.filter((e) => e.status === 'approved').map((e) => (
              <div key={e.userId} className="flex flex-col gap-1.5 rounded-xl border border-border bg-bg-card px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <Avatar name={e.name} color={e.avatarColor} size={28} />
                  <span className="flex-1 truncate text-sm font-semibold text-text-primary">{e.name}{e.userId === user?.id && <span className="ml-1 text-[10px] text-accent-blue">(you)</span>}</span>
                  <span className="font-mono text-xs font-bold text-accent-purple">{fmtK(e.spend)}<span className="font-sans font-normal text-text-muted"> spent</span></span>
                </div>
                <div className="flex flex-wrap gap-1 pl-[38px]">
                  {e.picks.map((seat) => {
                    const p = c.players.find((x) => x.seat === seat)
                    return (
                      <span key={seat} className="inline-flex items-center gap-1 rounded-lg bg-bg-surface px-1.5 py-0.5 text-[11px] text-text-secondary">
                        <span className="leading-none">{p?.country ?? '🃏'}</span>{playerFull(p)}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ===== HOST/CO-HOST controls ===== */}
      {c.canManage && (
        <Section title={`Entrants · ${c.entries.length}`} action={<Badge tone="green"><Shield className="h-3 w-3" />You manage</Badge>}>
          <p className="mb-2 text-[11px] text-text-muted">Admit players · toggle the green dot when they've paid · tap a name to make a co-host.</p>
          {c.status === 'open' && <p className="mb-2 flex items-center gap-1 text-[11px] text-accent-amber"><Lock className="h-3 w-3" />Picks are sealed until the 10‑min lock — for everyone, including the host &amp; admin. They reveal after lock.</p>}
          <div className="flex flex-col gap-2">
            {c.entries.map((e) => {
              const isHost = e.userId === c.hostId
              const isCo = c.coHostIds.includes(e.userId)
              return (
                <Card key={e.userId} className="relative flex items-center gap-2.5 p-2.5">
                  <button onClick={() => navigate(`/member/${e.userId}`)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left cursor-pointer">
                    <Avatar name={e.name} color={e.avatarColor} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1 truncate text-sm font-semibold text-text-primary">{e.name}
                        {isHost && <Crown className="h-3 w-3 text-accent-emerald" />}{isCo && <Badge tone="blue">Co-host</Badge>}
                      </p>
                      <p className="truncate text-[11px] text-text-muted">{c.status === 'open' ? (e.picks.length === 4 ? 'drafted ✓ · sealed until lock' : e.picks.length ? `drafting ${e.picks.length}/4` : 'not drafted') : (e.picks.length ? `${picksToNames(e.picks, c.players)} · ${fmtK(e.spend)} spent` : 'no picks')}</p>
                    </div>
                  </button>
                  {e.status === 'pending' ? (
                    <Btn size="sm" loading={approve.isPending && approve.variables?.userId === e.userId} onClick={() => approve.mutate({ contestId: c.id, userId: e.userId })}><Check className="h-3.5 w-3.5" />Admit</Btn>
                  ) : (
                    <PaidToggle paid={e.paid} editable busy={togglePaid.isPending && togglePaid.variables?.userId === e.userId} onToggle={() => togglePaid.mutate({ contestId: c.id, userId: e.userId })} />
                  )}
                  {e.status === 'approved' && !isHost && !isCo && (
                    <button onClick={() => assignCoHost.mutate({ contestId: c.id, userId: e.userId })} title="Make co-host" className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-bg-surface cursor-pointer"><Shield className="h-3.5 w-3.5" /></button>
                  )}
                  {e.status === 'pending' && (
                    <button onClick={() => decline.mutate({ contestId: c.id, userId: e.userId })} className="text-[11px] text-text-muted hover:text-accent-red cursor-pointer">✕</button>
                  )}
                  {((decline.isPending && decline.variables?.userId === e.userId) || (assignCoHost.isPending && assignCoHost.variables?.userId === e.userId)) && <ProcessingOverlay className="rounded-2xl" />}
                </Card>
              )
            })}
          </div>
        </Section>
      )}

      {/* ===== Chat — floating bubble + slide-up sheet, scoped to this contest (key={c.id}) ===== */}
      <FloatingChat key={c.id} messages={c.chat} currentUserId={user?.id ?? ''} canSend={canChat} onSend={(text) => postChat.mutate({ contestId: c.id, text })} />

      <Sheet open={howOpen} onClose={() => setHowOpen(false)} title="How FT Fantasy works">
        <HowItWorksFT onShowPricing={() => setIcmOpen(true)} />
      </Sheet>

      <Sheet open={icmOpen} onClose={() => setIcmOpen(false)} title="How ICM pricing & scoring work">
        <HowScoringPricing players={c.players} budget={c.budget} onBack={() => setIcmOpen(false)} />
      </Sheet>

      <FinishingOrderSheet key={finishOpen ? 'fo-open' : 'fo-closed'} open={finishOpen} onClose={() => setFinishOpen(false)} players={c.players} busy={setFinishingOrder.isPending}
        onSubmit={(order) => setFinishingOrder.mutate({ contestId: c.id, order }, { onSuccess: () => setFinishOpen(false) })} />

      <CancelGameSheet key={cancelOpen ? 'cancel-open' : 'cancel-closed'} open={cancelOpen} onClose={() => setCancelOpen(false)} gameLabel="contest" busy={cancel.isPending}
        onCancel={(reason) => cancel.mutate({ contestId: c.id, reason }, { onSuccess: () => setCancelOpen(false) })} />

      {/* Complete audit — why the contest can't be completed yet + what to do. */}
      <Sheet open={!!completeAudit} onClose={() => setCompleteAudit(null)} title="Can't complete yet">
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-accent-amber/40 bg-accent-amber/10 p-3">
            {completeAudit?.blockers.map((b, i) => (
              <p key={i} className="flex items-start gap-1.5 text-sm font-semibold text-text-primary"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" />{b}</p>
            ))}
            {completeAudit?.hint && <p className="mt-2 pl-5 text-xs text-text-secondary">{completeAudit.hint}</p>}
          </div>
          <Btn className="w-full" onClick={() => setCompleteAudit(null)}>Got it</Btn>
        </div>
      </Sheet>

      <InviteSheet open={inviteOpen} onClose={() => setInviteOpen(false)} clubId={c.clubId} accessUserIds={c.accessUserIds ?? []} accent="purple" onInvite={(ids) => invite.mutate({ contestId: c.id, userIds: ids })} isPending={invite.isPending} />
    </div>
  )
}
