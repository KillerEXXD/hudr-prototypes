import { Fragment, useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Grid3x3, Lock, Eye, UserPlus, Check, CheckCheck, X, Shield, Trophy, Crown, Medal, Stamp, Flag, Ban, AlertTriangle, Users, HelpCircle } from 'lucide-react'
import { GameJoinBanner } from '@/components/games/GameJoinBanner'
import { ShareGameButton } from '@/components/games/ShareGameButton'
import { GameHostLine } from '@/components/games/GameHostLine'
import { PrivateGameCard } from '@/components/games/PrivateGameCard'
import { isPrivateGate } from '@/lib/api/privateGame'
import { useSquaresGame, useRequestJoinSquares, useApproveSquares, useDeclineSquares, useToggleSquaresPaid, useClaimSquare, useLockSquares, useSetSquaresScore, useApproveSquareClaim, useRejectSquareClaim, useApproveAllSquares, useExtendRegSquares, useCloseRegSquares, useCancelSquares, usePostChatSquares } from '@/hooks/squares'
import { FloatingChat } from '@/components/common/FloatingChat'
import { EditRegistrationSheet } from '@/components/games/EditRegistrationSheet'
import { CancelGameSheet } from '@/components/games/CancelGameSheet'
import { squaresCompleteAudit } from '@/lib/squares/completeAudit'
import { RegClosedBanner } from '@/components/games/RegClosedBanner'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, Badge, Btn, Card, Section, Sheet, Spinner, EmptyState, Processing, ProcessingOverlay } from '@/components/common/ui'
import { PaidToggle } from '@/components/common/PaidToggle'
import { StakePool } from '@/components/common/StakePool'
import { CountdownBanner, regDeadline } from '@/components/common/Countdown'
import { CloseTimeLabel } from '@/components/common/CloseTime'
import { StatusBadge } from '@/components/common/StatusBadge'
import { SquaresResults } from '@/components/squares/SquaresResults'
import { SquaresRejectionBanner } from '@/components/squares/SquaresRejectionBanner'
import { useNotifications, useMarkNotificationRead } from '@/hooks'
import { HowItWorksButton } from '@/components/common/HowItWorksButton'
import { HowItWorks } from '@/components/common/HowItWorks'
import { cn } from '@/lib/utils/cn'
import { useEconomy } from '@/hooks/credits'
import { useLeaderboardConfig } from '@/hooks/leaderboard'
import { awardMap, squaresAward } from '@/lib/leaderboard/award'
import { DEFAULT_LEADERBOARD } from '@/types/leaderboard'
import { LpBadge } from '@/components/leaderboard/LpBadge'
import { useSpend } from '@/components/credits/SpendProvider'
import type { SquaresGameView } from '@/types/squares'
import { SQUARES_STEPS } from '@/games/gameExplainers'

const initials = (name?: string) => (name ? name.split(' ').map((w) => w[0]).slice(0, 2).join('') : '')

export function SquaresGamePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: g, isLoading } = useSquaresGame(id)
  const join = useRequestJoinSquares()
  const spend = useSpend()
  const joinCost = useEconomy().data?.costs.joinGameCost ?? 100
  const lpCfg = useLeaderboardConfig().data ?? DEFAULT_LEADERBOARD
  const approve = useApproveSquares(); const decline = useDeclineSquares()
  const togglePaid = useToggleSquaresPaid()
  const postChat = usePostChatSquares()
  const claim = useClaimSquare()
  const approveCell = useApproveSquareClaim(); const rejectCell = useRejectSquareClaim(); const approveAll = useApproveAllSquares()
  const lock = useLockSquares()
  const setScore = useSetSquaresScore()
  const extendReg = useExtendRegSquares()
  const closeReg = useCloseRegSquares()
  const cancel = useCancelSquares()
  // Member "your square was rejected" banner is driven by unread square_rejected
  // notifications for this game (the bell shares the source); Dismiss marks read.
  const { data: notifData } = useNotifications()
  const markNotifRead = useMarkNotificationRead()
  const [editRegOpen, setEditRegOpen] = useState(false)
  const [howOpen, setHowOpen] = useState(false)
  const [hover, setHover] = useState<{ name: string; color?: string; status?: string } | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  // Host reject-with-reason: which pending square (cellIdx) is being rejected + its reason.
  const [rejectingIdx, setRejectingIdx] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [completeAudit, setCompleteAudit] = useState<{ blockers: string[]; hint?: string } | null>(null)

  if (isLoading) return <Spinner label="Loading squares…" />
  if (!g) return <EmptyState title="Game not found" />
  if (isPrivateGate(g)) return <PrivateGameCard info={g.private} />

  const me = g.me
  // Chat parity with FT/Last Longer: an approved player (or the host/co-host) can post.
  const canChat = me?.status === 'active' || g.canManage
  const isAdmin = user?.role === 'admin'
  const locked = g.status !== 'registration'
  const canClaim = g.status === 'registration' && me?.status === 'active' && !isAdmin
  const mineCells = g.cells.filter((c) => c.userId === user?.id)
  const myCount = mineCells.length
  const myApproved = mineCells.filter((c) => c.approved).length
  const myPending = myCount - myApproved
  const myOwed = myCount * g.stake

  // Per-game tap order for THIS user's still-pending cells (mirrored from the
  // live ClubR app). Persists in localStorage so labels survive a refresh.
  const tapKey = `sq-tap-order-${id}-${user?.id ?? ''}`
  const [tapOrder, setTapOrder] = useState<number[]>(() => {
    if (typeof window === 'undefined') return []
    try { const raw = window.localStorage.getItem(tapKey); return raw ? (JSON.parse(raw) as number[]).filter((n) => Number.isInteger(n)) : [] } catch { return [] }
  })
  useEffect(() => {
    const minePendingIdx = new Set(g.cells.map((c, i) => (c.userId === user?.id && !c.approved ? i : -1)).filter((i) => i >= 0))
    const kept = tapOrder.filter((i) => minePendingIdx.has(i))
    const missing = Array.from(minePendingIdx).filter((i) => !kept.includes(i)).sort((a, b) => a - b)
    const next = [...kept, ...missing]
    if (next.length !== tapOrder.length || next.some((v, i) => v !== tapOrder[i])) {
      setTapOrder(next)
      try { window.localStorage.setItem(tapKey, JSON.stringify(next)) } catch { /* ignore */ }
    }
  }, [g.cells, user?.id, tapKey, tapOrder])
  const pendingOrder = useMemo(() => {
    const m = new Map<number, number>()
    tapOrder.forEach((cellIdx, i) => m.set(cellIdx, i + 1))
    return m
  }, [tapOrder])
  const pending = g.participants.filter((p) => p.status === 'pending')
  const active = g.participants.filter((p) => p.status === 'active')
  // squares awaiting host approval (registration only) — drives the host queue + grid pulse
  const hostCanApprove = g.canManage && g.status === 'registration'
  const pendingClaims = g.status === 'registration' ? g.cells.map((c, i) => ({ c, i })).filter((x) => x.c.userId && !x.c.approved) : []
  // Unread "your square was rejected" notices for THIS board → member banner.
  const myRejections = (notifData?.items ?? []).filter((n) => n.type === 'square_rejected' && n.gameId === g.id && !n.read)

  const winners = new Map<number, string>()
  g.periods.forEach((p) => { if (p.winnerCell != null) winners.set(p.winnerCell, p.label) })

  // Leaderboard points each winner earned toward the club board (completed only).
  const lpRows = (g.status === 'completed'
    ? [...awardMap(squaresAward(g, lpCfg)).entries()]
      .map(([userId, points]) => ({ userId, points, name: g.participants.find((x) => x.userId === userId)?.name ?? 'Player', avatarColor: g.participants.find((x) => x.userId === userId)?.avatarColor }))
      .sort((a, b) => b.points - a.points)
    : [])

  return (
    <div className="animate-fade-up">
      <button onClick={() => navigate(-1)} className="mb-2 flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary cursor-pointer"><ChevronLeft className="h-4 w-4" />Back</button>
      <GameJoinBanner admitted={g.isMemberOfClub || g.canManage} />
      <div className="flex items-center gap-2 text-xs text-text-muted"><span className="text-base">{g.clubEmoji}</span>{g.clubName}<Badge tone="green"><Grid3x3 className="h-3 w-3" />Squares</Badge></div>
      <div className="mt-1 flex items-start justify-between gap-2"><h1 className="flex min-w-0 flex-wrap items-center gap-1.5 text-lg font-extrabold tracking-tight text-text-primary"><Grid3x3 className="h-5 w-5 text-accent-emerald" />{g.title}<HowItWorksButton onClick={() => setHowOpen(true)} /></h1><ShareGameButton type="sq" gameId={g.id} className="shrink-0 whitespace-nowrap" /></div>
      <div className="mt-1"><GameHostLine hostId={g.hostId} knownName={g.participants.find((p) => p.userId === g.hostId)?.name} /></div>
      <p className="mt-0.5 text-sm text-text-secondary"><b className="text-text-primary">{g.homeTeam}</b> <span className="text-text-muted">(side)</span> vs <b className="text-text-primary">{g.awayTeam}</b> <span className="text-text-muted">(top)</span></p>
      <div className="mt-1.5 flex items-center gap-2 text-xs">
        <StatusBadge phase={g.status} />
      </div>
      <StakePool stake={g.stake} pool={g.stake * g.claimedCount}>· {g.claimedCount}/100 squares</StakePool>
      {g.status === 'registration' && (
        <div className="mt-3">
          <CountdownBanner deadline={regDeadline(g.registrationClosesAt)} sub="Claiming closes — grab your squares before the clock hits zero" closedLabel="Awaiting host" onEdit={g.canManage ? () => setEditRegOpen(true) : undefined} />
          <div className="mt-1 flex items-center justify-between gap-2">
            <CloseTimeLabel utcISO={g.registrationClosesAt} className="text-[11px] text-text-muted" />
            
          </div>
        </div>
      )}
      {g.regClosedEarly && g.status !== 'registration' && <RegClosedBanner gameId={g.id} show />}
      <EditRegistrationSheet open={editRegOpen} onClose={() => setEditRegOpen(false)} currentCloseISO={g.registrationClosesAt} busy={extendReg.isPending || closeReg.isPending} onExtend={(closesAt) => extendReg.mutate({ gameId: g.id, closesAt }, { onSuccess: () => setEditRegOpen(false) })} onCloseReg={() => closeReg.mutate(g.id, { onSuccess: () => setEditRegOpen(false) })} />

      {g.status === 'cancelled' && (
        <Card className="mt-3 flex items-start gap-2 border-accent-red/30 bg-accent-red/10">
          <Ban className="mt-0.5 h-5 w-5 shrink-0 text-accent-red" />
          <div><p className="text-sm font-bold text-text-primary">Game cancelled by the host</p>{g.cancelReason && <p className="mt-0.5 text-xs text-text-secondary">{g.cancelReason}</p>}</div>
        </Card>
      )}

      {/* Member banner — the host rejected one or more of your pending squares, with
          their reason. Driven by unread square_rejected notifications (never chat). */}
      {!isAdmin && <SquaresRejectionBanner rejections={myRejections} onDismiss={(nid) => markNotifRead.mutate(nid)} canClaimMore={g.status === 'registration'} />}

      {g.status !== 'cancelled' && (!g.isMemberOfClub && !g.canManage ? (
        <Card className="mt-3 flex items-start gap-2.5 border-accent-amber/30 bg-accent-amber/10"><Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" /><p className="text-xs leading-snug text-text-secondary">Join <button onClick={() => navigate(`/club/${g.clubId}`)} className="font-bold text-accent-blue underline cursor-pointer">{g.clubName}</button> first to claim squares.</p></Card>
      ) : !me && !isAdmin ? (
        <Btn className="mt-3 w-full" loading={join.isPending} onClick={async () => { if (await spend({ cost: joinCost, kind: 'join', label: `Joined ${g.title}`, title: g.canManage ? 'Join your board' : 'Join this board', verb: 'Join' })) join.mutate(g.id) }}><UserPlus className="h-4 w-4" />{g.canManage ? 'Join as a player' : 'Request to join'} · {joinCost} cr</Btn>
      ) : me?.status === 'pending' ? (
        <Card className="mt-3 flex items-start gap-2.5 border-accent-amber/30 bg-accent-amber/10"><Eye className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" /><p className="text-xs leading-snug text-text-secondary"><b className="text-text-primary">Awaiting host approval.</b> You can claim squares once admitted.</p></Card>
      ) : me?.status === 'active' ? (
        canClaim ? (
          <div className="mt-3 rounded-2xl border border-accent-emerald/30 bg-accent-emerald/5 px-3.5 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Your squares</span>
                <span key={`mc-${myCount}`} className={cn('text-3xl font-extrabold leading-none tabular-nums', myCount > 0 ? 'text-text-primary' : 'text-text-muted', myCount > 0 && 'animate-bump')}>{myCount}</span>
                {myCount > 0 && (
                  <span className="text-[11px] text-text-muted">
                    <b className="text-accent-emerald">{myApproved}</b> locked · <b className="text-accent-amber">{myPending}</b> pending
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-[11px] text-text-muted">{myCount} × {g.stake} =</span>
                <span key={`mo-${myOwed}`} className={cn('font-mono text-2xl font-extrabold leading-none tabular-nums text-accent-emerald', myCount > 0 && 'animate-bump')}>{myOwed.toLocaleString()}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Stakes owed</span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-end gap-1.5 text-[11px] text-text-muted">Paid <PaidToggle paid={me.paid} editable={false} /></div>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-bg-card px-3 py-2">
            <div className="min-w-0 text-xs">
              <span className="text-text-secondary">Your squares: <b className="text-text-primary">{myCount}</b>
                {myCount > 0 && <span className="text-text-muted"> · <b className="text-accent-emerald">{myApproved}</b> locked · <b className="text-accent-amber">{myPending}</b> pending</span>}
              </span>
              <div className="mt-0.5 font-mono text-[11px] text-text-secondary">{myCount} × {g.stake} = <b className="text-accent-emerald">{myOwed.toLocaleString()}</b> Stakes owed</div>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 text-xs text-text-muted">Paid <PaidToggle paid={me.paid} editable={false} /></span>
          </div>
        )
      ) : null)}

      {hostCanApprove && <p className="mt-2 text-[11px] text-text-secondary">You're the host — <span className="text-accent-amber font-semibold">tap any amber (pending) square to approve it</span>, or use the approval queue below.</p>}

      <Section icon={Grid3x3} tone="emerald" title={locked ? 'The board' : 'Claim your squares'} action={
        hover ? (
          <span className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: hover.color }} />
            <span className="truncate">{hover.name}</span>
            {hover.status && <span className="font-normal text-text-muted">· {hover.status}</span>}
          </span>
        ) : canClaim ? (
          <button type="button" onClick={() => setHowOpen(true)} aria-label="How squares claiming works" title="How it works"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent-emerald/40 bg-accent-emerald/10 text-accent-emerald hover:bg-accent-emerald/20 cursor-pointer animate-pulse-soft">
            <HelpCircle className="h-4 w-4" />
          </button>
        ) : undefined
      }>
        <div className="overflow-x-auto">
          <div className="grid min-w-[300px] grid-cols-11 gap-px rounded-lg bg-border p-px">
            <div className="flex items-center justify-center bg-bg-surface text-[8px] font-bold text-text-muted">{g.awayTeam.slice(0, 3)}→</div>
            {Array.from({ length: 10 }).map((_, c) => (
              <div key={`c${c}`} className="flex aspect-square items-center justify-center bg-bg-surface font-mono text-[11px] font-extrabold text-accent-blue">{locked ? g.colDigits[c] : '?'}</div>
            ))}
            {Array.from({ length: 10 }).map((_, r) => (
              <Fragment key={`r${r}`}>
                <div className="flex aspect-square items-center justify-center bg-bg-surface font-mono text-[11px] font-extrabold text-accent-purple">{locked ? g.rowDigits[r] : '?'}</div>
                {Array.from({ length: 10 }).map((_, c) => {
                  const idx = r * 10 + c
                  const cell = g.cells[idx]
                  const mine = cell.userId === user?.id
                  const win = winners.get(idx)
                  const pend = !!cell.userId && !cell.approved
                  const canApproveHere = hostCanApprove && pend
                  const canClaimEmpty = canClaim && !cell.userId
                  const canWithdrawHere = canClaim && mine && !cell.approved
                  const interactive = canApproveHere || canClaimEmpty || canWithdrawHere
                  const onTap = () => {
                    if (!interactive) return
                    if (canApproveHere) { approveCell.mutate({ gameId: g.id, cellIdx: idx }); return }
                    if (canClaimEmpty) {
                      setTapOrder((prev) => {
                        if (prev.includes(idx)) return prev
                        const next = [...prev, idx]
                        try { window.localStorage.setItem(tapKey, JSON.stringify(next)) } catch { /* ignore */ }
                        return next
                      })
                    }
                    claim.mutate({ gameId: g.id, cellIdx: idx })
                  }
                  const show = cell.userId ? () => setHover({ name: cell.name, color: cell.avatarColor, status: pend ? 'pending approval' : win ? `won ${win}` : mine ? 'you' : undefined }) : undefined
                  const myPendingNum = mine && pend ? pendingOrder.get(idx) : undefined
                  return (
                    <button key={idx} type="button" data-testid={mine && pend && myPendingNum != null ? `sq-mine-pending-${myPendingNum}` : undefined} aria-disabled={interactive ? undefined : 'true'} onClick={onTap}
                      onMouseEnter={show} onMouseLeave={() => setHover(null)} onFocus={show} onBlur={() => setHover(null)}
                      className={cn('relative flex aspect-square items-center justify-center text-[9px] font-bold',
                        win ? 'bg-accent-emerald text-white'
                          : pend ? cn('border border-dashed text-text-primary animate-pulse-soft', mine ? 'border-accent-amber bg-accent-amber/25 ring-1 ring-accent-amber/60' : 'border-accent-amber/60 bg-accent-amber/5')
                            : cell.userId ? (mine ? 'bg-accent-emerald/15 text-text-primary ring-2 ring-accent-emerald/70' : 'text-text-primary') : 'bg-bg-card/40 text-text-muted',
                        interactive && 'cursor-pointer hover:brightness-110')}
                      style={cell.userId && cell.approved && !win && !mine ? { backgroundColor: `${cell.avatarColor}33` } : undefined}
                      title={cell.userId ? `${cell.name}${pend ? ' · pending approval' : ''}${win ? ` · won ${win}` : ''}` : ''}>
                      {win
                        ? <Trophy className="h-3 w-3" />
                        : myPendingNum != null
                          ? <span className="text-[13px] font-extrabold leading-none tabular-nums text-accent-amber">{myPendingNum}</span>
                          : cell.userId ? initials(cell.name) : ''}
                      {((claim.isPending && claim.variables?.cellIdx === idx) || (approveCell.isPending && approveCell.variables?.cellIdx === idx)) && (<span className="absolute inset-0 flex items-center justify-center bg-bg-card/75"><Processing size={11} count={1} /></span>)}
                    </button>
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>
        <p className="mt-1.5 text-[10px] text-text-muted"><span className="text-accent-purple">Side digit</span> = {g.homeTeam} last digit · <span className="text-accent-blue">Top digit</span> = {g.awayTeam} last digit. {locked ? 'Digits assigned.' : 'Digits hidden until the host locks.'}</p>
      </Section>

      <SquaresResults g={g} />

      {/* ===== Entrants — PUBLIC at any stage so everyone sees who's in + the
              count. Read-only: rows are clickable to member details ONLY for the
              owner/co-host (canManage). ===== */}
      {g.participants.length > 0 && (
        <Section icon={Users} tone="emerald" title={`Entrants · ${g.participants.length}`}>
          <div className="flex flex-col gap-1.5">
            {g.participants.map((p) => {
              const isHost = p.userId === g.hostId
              const isCo = g.coHostIds.includes(p.userId) && !isHost
              const row = (
                <>
                  <Avatar name={p.name} color={p.avatarColor} pic={p.avatarUrl} size={28} />
                  <span className="flex min-w-0 flex-1 items-center gap-1 truncate text-sm font-semibold text-text-primary">{p.name}{isHost && <Crown className="h-3 w-3 text-accent-emerald" />}{isCo && <Badge tone="blue">Co-host</Badge>}</span>
                  {p.status === 'pending' ? <Badge tone="amber">Pending</Badge> : <span className="flex items-center gap-1 text-[11px] text-accent-emerald"><Check className="h-3.5 w-3.5" />In</span>}
                </>
              )
              return g.canManage ? (
                <button key={p.userId} type="button" onClick={() => navigate(`/member/${p.userId}`)} className="flex items-center gap-2.5 rounded-xl border border-border bg-bg-card px-3 py-2 text-left hover:bg-bg-surface cursor-pointer">{row}</button>
              ) : (
                <div key={p.userId} className="flex items-center gap-2.5 rounded-xl border border-border bg-bg-card px-3 py-2">{row}</div>
              )
            })}
          </div>
        </Section>
      )}

      <Section icon={Trophy} tone="amber" title="Periods & payouts">
        <div className="flex flex-col gap-1.5">
          {g.periods.map((p) => {
            const winnerName = p.winnerUserId ? (g.cells.find((c) => c.userId === p.winnerUserId)?.name ?? g.participants.find((x) => x.userId === p.winnerUserId)?.name) : undefined
            return (
              <div key={p.label} className="flex items-center gap-2 rounded-xl border border-border bg-bg-card px-3 py-2 text-sm">
                <span className="w-12 font-bold text-text-primary">{p.label}</span>
                <span className="font-mono text-xs text-accent-emerald">{p.pct}%</span>
                {p.homeScore != null ? <span className="text-xs text-text-muted">{g.homeTeam} {p.homeScore}–{p.awayScore} {g.awayTeam}</span> : <span className="text-xs text-text-muted">— not played</span>}
                {winnerName && <span className="ml-auto flex items-center gap-1 text-xs font-bold text-accent-emerald"><Trophy className="h-3 w-3" />{winnerName}</span>}
              </div>
            )
          })}
        </div>
        <p className="mt-1.5 text-[10px] text-text-muted">Payouts shown in Stakes — settled offline. The app holds no cash.</p>
      </Section>

      {lpRows.length > 0 && (
        <Section icon={Medal} tone="purple" title="Leaderboard points" action={<Trophy className="h-4 w-4 text-accent-amber" />}>
          <p className="mb-2 text-[11px] text-text-muted">Earned toward <b className="text-text-secondary">{g.clubName}</b>'s monthly leaderboard — Squares counts half (it's mostly luck).</p>
          <div className="flex flex-col gap-1.5">
            {lpRows.map((r) => (
              <button key={r.userId} type="button" onClick={() => navigate(`/member/${r.userId}`)} className="flex items-center gap-2.5 rounded-xl border border-border bg-bg-card px-3 py-2 text-left hover:bg-bg-surface cursor-pointer">
                <Avatar name={r.name} color={r.avatarColor} size={28} />
                <span className="min-w-0 flex-1 truncate text-sm text-text-primary">{r.name}</span>
                <LpBadge points={r.points} />
              </button>
            ))}
          </div>
        </Section>
      )}

      {g.canManage && (
        <Section icon={Shield} tone="blue" title="Host" action={<Badge tone="green"><Shield className="h-3 w-3" />You manage</Badge>}>
          {pendingClaims.length > 0 && (
            <div className="mb-3 rounded-xl border border-accent-amber/40 bg-accent-amber/5 p-2.5">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-xs font-bold text-text-primary"><Stamp className="h-3.5 w-3.5 text-accent-amber" />Square approvals · <span className="text-accent-amber">{pendingClaims.length} pending</span></p>
                <Btn size="sm" loading={approveAll.isPending} onClick={() => approveAll.mutate(g.id)}><CheckCheck className="h-3.5 w-3.5" />Approve all</Btn>
              </div>
              <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto scrollbar-thin">
                {pendingClaims.map(({ c, i }) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="relative flex items-center gap-2 rounded-lg border border-border bg-bg-card px-2.5 py-1.5">
                      {((approveCell.isPending && approveCell.variables?.cellIdx === i) || (rejectCell.isPending && rejectCell.variables?.cellIdx === i)) && <ProcessingOverlay className="rounded-lg" />}
                      <Avatar name={c.name} color={c.avatarColor} size={24} />
                      <button type="button" onClick={() => navigate(`/member/${c.userId}`)} className="min-w-0 flex-1 truncate text-left text-sm text-text-primary cursor-pointer">{c.name}</button>
                      <span className="font-mono text-[10px] text-text-muted">R{Math.floor(i / 10) + 1}·C{(i % 10) + 1}</span>
                      <button type="button" onClick={() => approveCell.mutate({ gameId: g.id, cellIdx: i })} title="Approve square" className="flex h-7 w-7 items-center justify-center rounded-lg border border-accent-emerald/30 bg-accent-emerald/10 text-accent-emerald hover:bg-accent-emerald/20 cursor-pointer"><Check className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => { setRejectingIdx(rejectingIdx === i ? null : i); setRejectReason('') }} title="Reject (frees the square)" className={cn('flex h-7 w-7 items-center justify-center rounded-lg border text-accent-red cursor-pointer', rejectingIdx === i ? 'border-accent-red bg-accent-red/20' : 'border-accent-red/30 bg-accent-red/10 hover:bg-accent-red/20')}><X className="h-3.5 w-3.5" /></button>
                    </div>
                    {rejectingIdx === i && (
                      <div className="rounded-lg border border-accent-red/30 bg-accent-red/5 p-2">
                        <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} maxLength={200} rows={2} autoFocus
                          placeholder={`Why isn’t ${c.name}’s square approved? They'll see this.`}
                          className="w-full resize-none rounded-md border border-border bg-bg-card px-2 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:border-accent-red focus:outline-none" />
                        <div className="mt-1.5 flex items-center justify-end gap-3">
                          <button type="button" onClick={() => { setRejectingIdx(null); setRejectReason('') }} className="text-[11px] font-semibold text-text-muted hover:text-text-primary cursor-pointer">Cancel</button>
                          <button type="button" disabled={!rejectReason.trim() || (rejectCell.isPending && rejectCell.variables?.cellIdx === i)}
                            onClick={() => rejectCell.mutate({ gameId: g.id, cellIdx: i, reason: rejectReason.trim() }, { onSuccess: () => { setRejectingIdx(null); setRejectReason('') } })}
                            className="flex items-center gap-1 rounded-lg bg-accent-red px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">
                            {rejectCell.isPending && rejectCell.variables?.cellIdx === i ? <Processing size={12} count={1} /> : <X className="h-3.5 w-3.5" />}Reject square
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] text-text-muted">Approving locks the square in (the player can no longer withdraw). Tip: you can also tap amber squares on the grid to approve.</p>
            </div>
          )}
          {pending.length > 0 && (
            <div className="mb-2 flex flex-col gap-1.5">
              {pending.map((p) => (
                <div key={p.userId} className="relative flex items-center gap-2.5 rounded-xl border border-dashed border-accent-amber/40 bg-accent-amber/5 px-3 py-2">
                  {decline.isPending && decline.variables?.userId === p.userId && <ProcessingOverlay label="Declining…" className="rounded-xl" />}
                  <Avatar name={p.name} color={p.avatarColor} pic={p.avatarUrl} size={28} />
                  <button onClick={() => navigate(`/member/${p.userId}`)} className="min-w-0 flex-1 truncate text-left text-sm text-text-primary cursor-pointer">{p.name}</button>
                  <Btn size="sm" loading={approve.isPending && approve.variables?.userId === p.userId} onClick={() => approve.mutate({ gameId: g.id, userId: p.userId })}><Check className="h-3.5 w-3.5" />Admit</Btn>
                  <button onClick={() => decline.mutate({ gameId: g.id, userId: p.userId })} className="text-[11px] text-text-muted hover:text-accent-red cursor-pointer">✕</button>
                </div>
              ))}
            </div>
          )}
          {g.status === 'registration' && (
            <Btn className="w-full" loading={lock.isPending} onClick={() => lock.mutate(g.id)}><Lock className="h-4 w-4" />Lock &amp; assign digits</Btn>
          )}
          {g.status === 'live' && <ScoreEntry g={g} busy={setScore.isPending} onSet={(label, home, away) => setScore.mutate({ gameId: g.id, label, home, away })} />}
          {active.length > 0 && (
            <div className="mt-2 flex flex-col gap-1.5">
              <p className="text-[11px] text-text-muted">Players · squares chosen &amp; owed · toggle the green dot when they've paid.</p>
              {active.map((p) => {
                const owned = g.cells.filter((c) => c.userId === p.userId)
                const n = owned.length
                const pend = owned.filter((c) => !c.approved).length
                return (
                  <div key={p.userId} className="flex items-center gap-2.5 rounded-xl border border-border bg-bg-card px-3 py-1.5">
                    <Avatar name={p.name} color={p.avatarColor} pic={p.avatarUrl} size={26} />
                    <button onClick={() => navigate(`/member/${p.userId}`)} className="min-w-0 flex-1 truncate text-left text-sm text-text-primary cursor-pointer">{p.name}{p.userId === g.hostId && <Crown className="ml-1 inline h-3 w-3 text-accent-emerald" />}</button>
                    {g.coHostIds.includes(p.userId) && p.userId !== g.hostId && <Badge tone="blue">Co-host</Badge>}
                    <div className="shrink-0 text-right leading-tight">
                      <div className="font-mono text-[10px] text-text-muted">{n} sq{pend ? <span className="text-accent-amber"> · {pend} pend</span> : ''}</div>
                      <div className="font-mono text-[10px] font-bold text-accent-emerald">{(n * g.stake).toLocaleString()}</div>
                    </div>
                    <PaidToggle paid={p.paid} editable busy={togglePaid.isPending && togglePaid.variables?.userId === p.userId} onToggle={() => togglePaid.mutate({ gameId: g.id, userId: p.userId })} />
                  </div>
                )
              })}
            </div>
          )}

          {(g.status === 'registration' || g.status === 'live') && (
            <div className="mt-3 flex gap-2">
              <Btn variant="secondary" className="flex-1"
                onClick={() => setCompleteAudit(squaresCompleteAudit(g.status, g.periods.find((p) => p.label === 'Final')?.homeScore != null))}>
                <Flag className="h-4 w-4" />Complete game
              </Btn>
              <Btn variant="danger" className="flex-1" onClick={() => setCancelOpen(true)}><Ban className="h-4 w-4" />Cancel game</Btn>
            </div>
          )}
        </Section>
      )}

      <CancelGameSheet key={cancelOpen ? 'cancel-open' : 'cancel-closed'} open={cancelOpen} onClose={() => setCancelOpen(false)} gameLabel="Squares game" busy={cancel.isPending}
        onCancel={(reason) => cancel.mutate({ gameId: g.id, reason }, { onSuccess: () => setCancelOpen(false) })} />

      {/* Complete audit — Squares completes when the host enters the Final score. */}
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

      <Sheet open={howOpen} onClose={() => setHowOpen(false)} title="Squares — how it works">
        <HowItWorks steps={SQUARES_STEPS} dotBg="bg-accent-emerald" iconColor="text-accent-emerald" />
      </Sheet>

      {/* Chat — floating bubble + slide-up sheet, scoped to this board (key={g.id}). */}
      <FloatingChat key={g.id} messages={g.chat} currentUserId={user?.id ?? ''} canSend={canChat} onSend={(text) => postChat.mutate({ gameId: g.id, text })} />
    </div>
  )
}

function ScoreEntry({ g, onSet, busy }: { g: SquaresGameView; onSet: (label: string, home: number, away: number) => void; busy?: boolean }) {
  const [label, setLabel] = useState(g.periods.find((p) => p.homeScore == null)?.label ?? 'Q1')
  const [home, setHome] = useState('')
  const [away, setAway] = useState('')
  return (
    <div className="mt-2 rounded-xl border border-border bg-bg-card p-3">
      <p className="mb-1.5 text-xs font-semibold text-text-secondary">Enter a period score → the winning square lights up</p>
      <div className="flex items-center gap-2">
        <select value={label} onChange={(e) => setLabel(e.target.value)} className="rounded-lg border border-border bg-bg-surface px-2 py-1.5 text-sm">{g.periods.map((p) => <option key={p.label} value={p.label}>{p.label}</option>)}</select>
        <input value={home} onChange={(e) => setHome(e.target.value)} inputMode="numeric" placeholder={g.homeTeam} className="w-16 rounded-lg border border-border bg-bg-surface px-2 py-1.5 text-center text-sm" />
        <span className="text-text-muted">–</span>
        <input value={away} onChange={(e) => setAway(e.target.value)} inputMode="numeric" placeholder={g.awayTeam} className="w-16 rounded-lg border border-border bg-bg-surface px-2 py-1.5 text-center text-sm" />
        <Btn size="sm" disabled={home === '' || away === ''} loading={busy} onClick={() => onSet(label, Number(home) || 0, Number(away) || 0)}>Set</Btn>
      </div>
    </div>
  )
}
