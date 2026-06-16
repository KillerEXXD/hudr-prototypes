import { Fragment, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Grid3x3, Lock, Eye, UserPlus, Check, Shield, Trophy, Crown } from 'lucide-react'
import { useSquaresGame, useRequestJoinSquares, useApproveSquares, useDeclineSquares, useToggleSquaresPaid, useClaimSquare, useLockSquares, useSetSquaresScore } from '@/hooks/squares'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, Badge, Btn, Card, Section, Spinner, EmptyState } from '@/components/common/ui'
import { PaidToggle } from '@/components/common/PaidToggle'
import { StakePool } from '@/components/common/StakePool'
import { Countdown, regDeadline } from '@/components/common/Countdown'
import { cn } from '@/lib/utils/cn'
import type { SquaresGameView } from '@/types/squares'

const initials = (name?: string) => (name ? name.split(' ').map((w) => w[0]).slice(0, 2).join('') : '')

export function SquaresGamePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: g, isLoading } = useSquaresGame(id)
  const join = useRequestJoinSquares()
  const approve = useApproveSquares(); const decline = useDeclineSquares()
  const togglePaid = useToggleSquaresPaid()
  const claim = useClaimSquare()
  const lock = useLockSquares()
  const setScore = useSetSquaresScore()

  if (isLoading) return <Spinner label="Loading squares…" />
  if (!g) return <EmptyState title="Game not found" />

  const me = g.me
  const isAdmin = user?.role === 'admin'
  const locked = g.status !== 'registration'
  const canClaim = g.status === 'registration' && me?.status === 'active' && !isAdmin
  const myCount = g.cells.filter((c) => c.userId === user?.id).length
  const pending = g.participants.filter((p) => p.status === 'pending')
  const active = g.participants.filter((p) => p.status === 'active')
  const statusTone = g.status === 'live' ? 'green' : g.status === 'registration' ? 'blue' : 'neutral'

  const winners = new Map<number, string>()
  g.periods.forEach((p) => { if (p.winnerCell != null) winners.set(p.winnerCell, p.label) })

  return (
    <div className="animate-fade-up">
      <button onClick={() => navigate(-1)} className="mb-2 flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary cursor-pointer"><ChevronLeft className="h-4 w-4" />Back</button>
      <div className="flex items-center gap-2 text-xs text-text-muted"><span className="text-base">{g.clubEmoji}</span>{g.clubName}<Badge tone="green"><Grid3x3 className="h-3 w-3" />Football Squares</Badge></div>
      <h1 className="mt-1 flex items-center gap-1.5 text-xl font-extrabold tracking-tight text-text-primary"><Grid3x3 className="h-5 w-5 text-accent-emerald" />{g.title}</h1>
      <p className="mt-0.5 text-sm text-text-secondary"><b className="text-text-primary">{g.homeTeam}</b> <span className="text-text-muted">(side)</span> vs <b className="text-text-primary">{g.awayTeam}</b> <span className="text-text-muted">(top)</span></p>
      <div className="mt-1.5 flex items-center gap-2 text-xs">
        <Badge tone={statusTone}>{g.status === 'live' ? '● Live' : g.status === 'registration' ? 'Claiming open' : 'Completed'}</Badge>
        {g.status === 'registration' && <span className="ml-auto"><Countdown deadline={regDeadline(g.id, g.registrationClosesAt)} prefix="Closes" /></span>}
      </div>
      <StakePool stake={g.stake} pool={g.stake * g.claimedCount}>· {g.claimedCount}/100 squares</StakePool>

      {!g.isMemberOfClub && !g.canManage ? (
        <Card className="mt-3 flex items-start gap-2.5 border-accent-amber/30 bg-accent-amber/10"><Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" /><p className="text-xs leading-snug text-text-secondary">Join <button onClick={() => navigate(`/club/${g.clubId}`)} className="font-bold text-accent-blue underline cursor-pointer">{g.clubName}</button> first to claim squares.</p></Card>
      ) : !me && !isAdmin ? (
        <Btn className="mt-3 w-full" disabled={join.isPending} onClick={() => join.mutate(g.id)}><UserPlus className="h-4 w-4" />{g.canManage ? 'Join as a player' : 'Request to join'}</Btn>
      ) : me?.status === 'pending' ? (
        <Card className="mt-3 flex items-start gap-2.5 border-accent-amber/30 bg-accent-amber/10"><Eye className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" /><p className="text-xs leading-snug text-text-secondary"><b className="text-text-primary">Awaiting host approval.</b> You can claim squares once admitted.</p></Card>
      ) : me?.status === 'active' ? (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-bg-card px-3 py-2 text-xs">
          <span className="text-text-secondary">Your squares: <b className="text-text-primary">{myCount}</b></span>
          <span className="flex items-center gap-1.5 text-text-muted">Paid <PaidToggle paid={me.paid} editable={false} /></span>
        </div>
      ) : null}

      {canClaim && <p className="mt-2 text-[11px] text-accent-emerald">Tap an empty square to claim it (tap yours again to release). Digits are sealed until the host locks.</p>}

      <Section title={locked ? 'The board' : 'Claim your squares'}>
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
                  const claimable = canClaim && (!cell.userId || mine)
                  return (
                    <button key={idx} type="button" disabled={!claimable} onClick={() => claim.mutate({ gameId: g.id, cellIdx: idx })}
                      className={cn('relative flex aspect-square items-center justify-center text-[8px] font-bold',
                        win ? 'bg-accent-emerald text-white' : mine ? 'bg-accent-purple/30 text-text-primary' : cell.userId ? 'text-text-muted' : 'bg-bg-card/40 text-text-muted',
                        claimable && 'cursor-pointer hover:bg-accent-purple/15')}
                      style={cell.userId && !win && !mine ? { backgroundColor: `${cell.avatarColor}22` } : undefined}
                      title={cell.name}>
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

      {g.canManage && (
        <Section title="Host" action={<Badge tone="green"><Shield className="h-3 w-3" />You manage</Badge>}>
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
              <p className="text-[11px] text-text-muted">Players · toggle the green dot when they've paid.</p>
              {active.map((p) => (
                <div key={p.userId} className="flex items-center gap-2.5 rounded-xl border border-border bg-bg-card px-3 py-1.5">
                  <Avatar name={p.name} color={p.avatarColor} size={26} />
                  <button onClick={() => navigate(`/member/${p.userId}`)} className="min-w-0 flex-1 truncate text-left text-sm text-text-primary cursor-pointer">{p.name}{p.userId === g.hostId && <Crown className="ml-1 inline h-3 w-3 text-accent-emerald" />}</button>
                  <PaidToggle paid={p.paid} editable onToggle={() => togglePaid.mutate({ gameId: g.id, userId: p.userId })} />
                </div>
              ))}
            </div>
          )}
        </Section>
      )}
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
