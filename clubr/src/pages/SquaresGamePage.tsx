import { Fragment, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Grid3x3, Lock, Eye, UserPlus, Check, CheckCheck, X, Shield, Trophy, Crown, HelpCircle, Hand, Dice5, Coins, Stamp } from 'lucide-react'
import { useSquaresGame, useRequestJoinSquares, useApproveSquares, useDeclineSquares, useToggleSquaresPaid, useClaimSquare, useLockSquares, useSetSquaresScore, useApproveSquareClaim, useRejectSquareClaim, useApproveAllSquares } from '@/hooks/squares'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, Badge, Btn, Card, Section, Sheet, Spinner, EmptyState } from '@/components/common/ui'
import { PaidToggle } from '@/components/common/PaidToggle'
import { StakePool } from '@/components/common/StakePool'
import { Countdown, regDeadline } from '@/components/common/Countdown'
import { HowItWorks, type HowStep } from '@/components/common/HowItWorks'
import { cn } from '@/lib/utils/cn'
import { useEconomy } from '@/hooks/credits'
import { useLeaderboardConfig } from '@/hooks/leaderboard'
import { awardMap, squaresAward } from '@/lib/leaderboard/award'
import { DEFAULT_LEADERBOARD } from '@/types/leaderboard'
import { LpBadge } from '@/components/leaderboard/LpBadge'
import { useSpend } from '@/components/credits/SpendProvider'
import type { SquaresGameView } from '@/types/squares'

const initials = (name?: string) => (name ? name.split(' ').map((w) => w[0]).slice(0, 2).join('') : '')

const SQUARES_STEPS: HowStep[] = [
  { icon: UserPlus, title: 'Join the board', body: 'Request to join — the host admits you, then you can grab squares.' },
  { icon: Hand, title: 'Claim your squares', body: 'Tap any empty square on the 10×10 grid to claim it. Grab as many as you like (tap yours again to release) before claiming closes.' },
  { icon: Dice5, title: 'Digits are drawn', body: 'When the host locks the board, each row & column gets a random 0–9 digit. They’re sealed until then — nobody can game it.' },
  { icon: Trophy, title: 'Scores pick winners', body: 'After each period (Q1/Q2/Q3/Final), the host enters the score. The square at the home & away last digits lights up — that owner wins the period.' },
  { icon: Coins, title: 'Split the pool', body: 'Pool = price per square × squares claimed, split by period (default 10/10/10/70). Settled offline — the app holds no cash.' },
]

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
  const claim = useClaimSquare()
  const approveCell = useApproveSquareClaim(); const rejectCell = useRejectSquareClaim(); const approveAll = useApproveAllSquares()
  const lock = useLockSquares()
  const setScore = useSetSquaresScore()
  const [howOpen, setHowOpen] = useState(false)
  const [hover, setHover] = useState<{ name: string; color?: string; status?: string } | null>(null)

  if (isLoading) return <Spinner label="Loading squares…" />
  if (!g) return <EmptyState title="Game not found" />

  const me = g.me
  const isAdmin = user?.role === 'admin'
  const locked = g.status !== 'registration'
  const canClaim = g.status === 'registration' && me?.status === 'active' && !isAdmin
  const mineCells = g.cells.filter((c) => c.userId === user?.id)
  const myCount = mineCells.length
  const myApproved = mineCells.filter((c) => c.approved).length
  const myPending = myCount - myApproved
  const pending = g.participants.filter((p) => p.status === 'pending')
  const active = g.participants.filter((p) => p.status === 'active')
  const statusTone = g.status === 'live' ? 'green' : g.status === 'registration' ? 'blue' : 'neutral'
  // squares awaiting host approval (registration only) — drives the host queue + grid pulse
  const hostCanApprove = g.canManage && g.status === 'registration'
  const pendingClaims = g.status === 'registration' ? g.cells.map((c, i) => ({ c, i })).filter((x) => x.c.userId && !x.c.approved) : []

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
      <div className="flex items-center gap-2 text-xs text-text-muted"><span className="text-base">{g.clubEmoji}</span>{g.clubName}<Badge tone="green"><Grid3x3 className="h-3 w-3" />Squares</Badge></div>
      <h1 className="mt-1 flex items-center gap-1.5 text-xl font-extrabold tracking-tight text-text-primary"><Grid3x3 className="h-5 w-5 text-accent-emerald" />{g.title}</h1>
      <p className="mt-0.5 text-sm text-text-secondary"><b className="text-text-primary">{g.homeTeam}</b> <span className="text-text-muted">(side)</span> vs <b className="text-text-primary">{g.awayTeam}</b> <span className="text-text-muted">(top)</span></p>
      <div className="mt-1.5 flex items-center gap-2 text-xs">
        <Badge tone={statusTone}>{g.status === 'live' ? '● Live' : g.status === 'registration' ? 'Claiming open' : 'Completed'}</Badge>
        <button type="button" onClick={() => setHowOpen(true)} className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 font-semibold text-text-secondary hover:text-text-primary cursor-pointer"><HelpCircle className="h-3.5 w-3.5" />How it works</button>
        {g.status === 'registration' && <span className="ml-auto"><Countdown deadline={regDeadline(g.id, g.registrationClosesAt)} prefix="Closes" /></span>}
      </div>
      <StakePool stake={g.stake} pool={g.stake * g.claimedCount}>· {g.claimedCount}/100 squares</StakePool>

      {!g.isMemberOfClub && !g.canManage ? (
        <Card className="mt-3 flex items-start gap-2.5 border-accent-amber/30 bg-accent-amber/10"><Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" /><p className="text-xs leading-snug text-text-secondary">Join <button onClick={() => navigate(`/club/${g.clubId}`)} className="font-bold text-accent-blue underline cursor-pointer">{g.clubName}</button> first to claim squares.</p></Card>
      ) : !me && !isAdmin ? (
        <Btn className="mt-3 w-full" disabled={join.isPending} onClick={async () => { if (await spend({ cost: joinCost, kind: 'join', label: `Joined ${g.title}`, title: g.canManage ? 'Join your board' : 'Join this board', verb: 'Join' })) join.mutate(g.id) }}><UserPlus className="h-4 w-4" />{g.canManage ? 'Join as a player' : 'Request to join'} · {joinCost} cr</Btn>
      ) : me?.status === 'pending' ? (
        <Card className="mt-3 flex items-start gap-2.5 border-accent-amber/30 bg-accent-amber/10"><Eye className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" /><p className="text-xs leading-snug text-text-secondary"><b className="text-text-primary">Awaiting host approval.</b> You can claim squares once admitted.</p></Card>
      ) : me?.status === 'active' ? (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-bg-card px-3 py-2">
          <div className="min-w-0 text-xs">
            <span className="text-text-secondary">Your squares: <b className="text-text-primary">{myCount}</b>
              {myCount > 0 && <span className="text-text-muted"> · <b className="text-accent-emerald">{myApproved}</b> locked · <b className="text-accent-amber">{myPending}</b> pending</span>}
            </span>
            <div className="mt-0.5 font-mono text-[11px] text-text-secondary">{myCount} × {g.stake} = <b className="text-accent-emerald">{(myCount * g.stake).toLocaleString()}</b> Stakes owed</div>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-text-muted">Paid <PaidToggle paid={me.paid} editable={false} /></span>
        </div>
      ) : null}

      {canClaim && <p className="mt-2 text-[11px] text-text-secondary">Tap an empty square to claim it — your claim is <span className="text-accent-amber font-semibold">pending the host's approval</span>. Tap one of your pending (amber) squares to <b>withdraw</b>; once the host approves it, it's <b>locked in</b>. Digits stay sealed until lock.</p>}
      {hostCanApprove && <p className="mt-2 text-[11px] text-text-secondary">You're the host — <span className="text-accent-amber font-semibold">tap any amber (pending) square to approve it</span>, or use the approval queue below.</p>}

      <Section title={locked ? 'The board' : 'Claim your squares'} action={hover ? (
        <span className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: hover.color }} />
          <span className="truncate">{hover.name}</span>
          {hover.status && <span className="font-normal text-text-muted">· {hover.status}</span>}
        </span>
      ) : undefined}>
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
                  const onTap = () => { if (!interactive) return; if (canApproveHere) approveCell.mutate({ gameId: g.id, cellIdx: idx }); else claim.mutate({ gameId: g.id, cellIdx: idx }) }
                  const show = cell.userId ? () => setHover({ name: cell.name, color: cell.avatarColor, status: pend ? 'pending approval' : win ? `won ${win}` : mine ? 'you' : undefined }) : undefined
                  return (
                    <button key={idx} type="button" aria-disabled={interactive ? undefined : 'true'} onClick={onTap}
                      onMouseEnter={show} onMouseLeave={() => setHover(null)} onFocus={show} onBlur={() => setHover(null)}
                      className={cn('relative flex aspect-square items-center justify-center text-[9px] font-bold',
                        win ? 'bg-accent-emerald text-white'
                          : pend ? cn('border border-dashed border-accent-amber text-text-primary animate-pulse-soft', mine ? 'bg-accent-amber/20' : 'bg-accent-amber/5')
                            : cell.userId ? (mine ? 'bg-accent-purple/30 text-text-primary' : 'text-text-primary') : 'bg-bg-card/40 text-text-muted',
                        interactive && 'cursor-pointer hover:brightness-110')}
                      style={cell.userId && cell.approved && !win && !mine ? { backgroundColor: `${cell.avatarColor}33` } : undefined}
                      title={cell.userId ? `${cell.name}${pend ? ' · pending approval' : ''}${win ? ` · won ${win}` : ''}` : ''}>
                      {win ? <Trophy className="h-3 w-3" /> : cell.userId ? initials(cell.name) : ''}
                    </button>
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>
        <p className="mt-1.5 text-[10px] text-text-muted"><span className="text-accent-purple">Side digit</span> = {g.homeTeam} last digit · <span className="text-accent-blue">Top digit</span> = {g.awayTeam} last digit. {locked ? 'Digits assigned.' : 'Digits hidden until the host locks.'}</p>
      </Section>

      <Section title="Periods & payouts">
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
        <Section title="Leaderboard points" action={<Trophy className="h-4 w-4 text-accent-amber" />}>
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
        <Section title="Host" action={<Badge tone="green"><Shield className="h-3 w-3" />You manage</Badge>}>
          {pendingClaims.length > 0 && (
            <div className="mb-3 rounded-xl border border-accent-amber/40 bg-accent-amber/5 p-2.5">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-xs font-bold text-text-primary"><Stamp className="h-3.5 w-3.5 text-accent-amber" />Square approvals · <span className="text-accent-amber">{pendingClaims.length} pending</span></p>
                <Btn size="sm" disabled={approveAll.isPending} onClick={() => approveAll.mutate(g.id)}><CheckCheck className="h-3.5 w-3.5" />Approve all</Btn>
              </div>
              <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto scrollbar-thin">
                {pendingClaims.map(({ c, i }) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-border bg-bg-card px-2.5 py-1.5">
                    <Avatar name={c.name} color={c.avatarColor} size={24} />
                    <button onClick={() => navigate(`/member/${c.userId}`)} className="min-w-0 flex-1 truncate text-left text-sm text-text-primary cursor-pointer">{c.name}</button>
                    <span className="font-mono text-[10px] text-text-muted">R{Math.floor(i / 10) + 1}·C{(i % 10) + 1}</span>
                    <button onClick={() => approveCell.mutate({ gameId: g.id, cellIdx: i })} title="Approve square" className="flex h-7 w-7 items-center justify-center rounded-lg border border-accent-emerald/30 bg-accent-emerald/10 text-accent-emerald hover:bg-accent-emerald/20 cursor-pointer"><Check className="h-3.5 w-3.5" /></button>
                    <button onClick={() => rejectCell.mutate({ gameId: g.id, cellIdx: i })} title="Reject (frees the square)" className="flex h-7 w-7 items-center justify-center rounded-lg border border-accent-red/30 bg-accent-red/10 text-accent-red hover:bg-accent-red/20 cursor-pointer"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
              <p className="mt-1.5 text-[10px] text-text-muted">Approving locks the square in (the player can no longer withdraw). Tip: you can also tap amber squares on the grid to approve.</p>
            </div>
          )}
          {pending.length > 0 && (
            <div className="mb-2 flex flex-col gap-1.5">
              {pending.map((p) => (
                <div key={p.userId} className="flex items-center gap-2.5 rounded-xl border border-dashed border-accent-amber/40 bg-accent-amber/5 px-3 py-2">
                  <Avatar name={p.name} color={p.avatarColor} size={28} />
                  <button onClick={() => navigate(`/member/${p.userId}`)} className="min-w-0 flex-1 truncate text-left text-sm text-text-primary cursor-pointer">{p.name}</button>
                  <Btn size="sm" onClick={() => approve.mutate({ gameId: g.id, userId: p.userId })}><Check className="h-3.5 w-3.5" />Admit</Btn>
                  <button onClick={() => decline.mutate({ gameId: g.id, userId: p.userId })} className="text-[11px] text-text-muted hover:text-accent-red cursor-pointer">✕</button>
                </div>
              ))}
            </div>
          )}
          {g.status === 'registration' && (
            <Btn className="w-full" disabled={lock.isPending} onClick={() => lock.mutate(g.id)}><Lock className="h-4 w-4" />Lock &amp; assign digits</Btn>
          )}
          {g.status === 'live' && <ScoreEntry g={g} onSet={(label, home, away) => setScore.mutate({ gameId: g.id, label, home, away })} />}
          {active.length > 0 && (
            <div className="mt-2 flex flex-col gap-1.5">
              <p className="text-[11px] text-text-muted">Players · squares chosen &amp; owed · toggle the green dot when they've paid.</p>
              {active.map((p) => {
                const owned = g.cells.filter((c) => c.userId === p.userId)
                const n = owned.length
                const pend = owned.filter((c) => !c.approved).length
                return (
                  <div key={p.userId} className="flex items-center gap-2.5 rounded-xl border border-border bg-bg-card px-3 py-1.5">
                    <Avatar name={p.name} color={p.avatarColor} size={26} />
                    <button onClick={() => navigate(`/member/${p.userId}`)} className="min-w-0 flex-1 truncate text-left text-sm text-text-primary cursor-pointer">{p.name}{p.userId === g.hostId && <Crown className="ml-1 inline h-3 w-3 text-accent-emerald" />}</button>
                    <div className="shrink-0 text-right leading-tight">
                      <div className="font-mono text-[10px] text-text-muted">{n} sq{pend ? <span className="text-accent-amber"> · {pend} pend</span> : ''}</div>
                      <div className="font-mono text-[10px] font-bold text-accent-emerald">{(n * g.stake).toLocaleString()}</div>
                    </div>
                    <PaidToggle paid={p.paid} editable onToggle={() => togglePaid.mutate({ gameId: g.id, userId: p.userId })} />
                  </div>
                )
              })}
            </div>
          )}
        </Section>
      )}

      <Sheet open={howOpen} onClose={() => setHowOpen(false)} title="Squares — how it works">
        <HowItWorks steps={SQUARES_STEPS} dotBg="bg-accent-emerald" iconColor="text-accent-emerald" />
      </Sheet>
    </div>
  )
}

function ScoreEntry({ g, onSet }: { g: SquaresGameView; onSet: (label: string, home: number, away: number) => void }) {
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
        <Btn size="sm" disabled={home === '' || away === ''} onClick={() => onSet(label, Number(home) || 0, Number(away) || 0)}>Set</Btn>
      </div>
    </div>
  )
}
