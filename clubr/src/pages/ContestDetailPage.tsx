import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Lock, Eye, Target, Trophy, UserPlus, Check, Crown, Shield } from 'lucide-react'
import { useContest, useRequestEnter, useApproveEntry, useDeclineEntry, useTogglePaid, useAssignCoHost, useSavePicks, usePostChat } from '@/hooks/ft'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, Badge, Btn, Card, Section, Spinner, EmptyState } from '@/components/common/ui'
import { PaidToggle } from '@/components/common/PaidToggle'
import { GameChat } from '@/components/common/GameChat'
import { DraftBoard } from '@/components/ft/DraftBoard'
import { FINISH_POINTS } from '@/types/ft'

const fmtK = (n: number) => `${Math.round(n / 1000)}k`

export function ContestDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: c, isLoading } = useContest(id)
  const requestEnter = useRequestEnter()
  const approve = useApproveEntry()
  const decline = useDeclineEntry()
  const togglePaid = useTogglePaid()
  const assignCoHost = useAssignCoHost()
  const savePicks = useSavePicks()
  const postChat = usePostChat()
  const [picks, setPicks] = useState<string[]>([])

  useEffect(() => { if (c?.myEntry) setPicks(c.myEntry.picks) }, [c?.myEntry?.picks?.join(',')]) // eslint-disable-line

  if (isLoading) return <Spinner label="Loading contest…" />
  if (!c) return <EmptyState title="Contest not found" />

  const me = c.myEntry
  const approved = me?.status === 'approved'
  const canChat = approved || c.canManage
  const statusTone = c.status === 'open' ? 'blue' : c.status === 'locked' ? 'amber' : 'neutral'

  return (
    <div className="animate-fade-up">
      <button onClick={() => navigate(-1)} className="mb-2 flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary cursor-pointer"><ChevronLeft className="h-4 w-4" />Back</button>

      <div className="flex items-center gap-2 text-xs text-text-muted"><span className="text-base">{c.clubEmoji}</span>{c.clubName}<Badge tone="purple">Stack Draft</Badge></div>
      <h1 className="mt-1 flex items-center gap-1.5 text-xl font-extrabold tracking-tight text-text-primary"><Target className="h-5 w-5 text-accent-purple" />{c.ftName}</h1>
      <div className="mt-1.5 flex items-center gap-2 text-xs text-text-secondary">
        <Badge tone={statusTone}>{c.status === 'open' ? 'Open' : c.status === 'locked' ? 'Locked' : 'Settled'}</Badge>
        <span className="font-mono">{c.stake} Stakes</span><span className="text-text-muted">· budget {fmtK(c.budget)}</span>
        <span className="ml-auto text-text-muted">{c.locksAt}</span>
      </div>

      {/* ===== SETTLED: leaderboard ===== */}
      {c.status === 'settled' && (
        <>
          <Section title="Result — final table">
            <Card className="flex flex-wrap gap-1.5">
              {c.finishingOrder?.map((seat, i) => (
                <span key={seat} className="flex items-center gap-1 rounded-lg bg-bg-surface px-2 py-1 text-xs">
                  <span className="font-bold text-text-muted">{i + 1}.</span>
                  <span className="font-bold text-text-primary">{c.players.find((p) => p.seat === seat)?.name}</span>
                  <span className="font-mono text-[10px] text-accent-emerald">+{FINISH_POINTS[i]}</span>
                </span>
              ))}
            </Card>
          </Section>
          <Section title="Leaderboard">
            <div className="flex flex-col gap-1.5">
              {c.entries.map((e) => (
                <div key={e.userId} className={cnRow(e.userId === user?.id)}>
                  <span className="w-6 text-center text-sm font-extrabold text-text-muted">{e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : e.rank}</span>
                  <Avatar name={e.name} color={e.avatarColor} size={30} />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-text-primary">{e.name}</p><p className="text-[11px] text-text-muted">{e.picks.join(' · ')}</p></div>
                  <span className="font-mono text-sm font-bold text-accent-purple">{e.score}</span>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* ===== OPEN: access + draft ===== */}
      {c.status === 'open' && (
        <Section title="Your entry">
          {!c.isMemberOfClub && !c.canManage ? (
            <Card className="flex items-start gap-2.5 border-accent-amber/30 bg-accent-amber/10">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" />
              <p className="text-xs leading-snug text-text-secondary">Join <button onClick={() => navigate(`/club/${c.clubId}`)} className="font-bold text-accent-blue underline cursor-pointer">{c.clubName}</button> first — you must be an approved member to enter its contests.</p>
            </Card>
          ) : !me ? (
            <>
              <Card className="text-sm text-text-secondary">{c.canManage ? "You're hosting this contest — you can also join and draft like a player." : 'Request to enter — the host will admit you, then you can draft.'}</Card>
              <Btn className="mt-2 w-full" disabled={requestEnter.isPending} onClick={() => requestEnter.mutate(c.id)}><UserPlus className="h-4 w-4" />{c.canManage ? 'Join as a player' : 'Request to enter'}</Btn>
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
              <Btn className="mt-2 w-full" disabled={picks.length !== 4 || savePicks.isPending} onClick={() => savePicks.mutate({ contestId: c.id, picks })}>
                {me.picks.length === 4 ? 'Update draft' : 'Submit draft'} {picks.length !== 4 && `· pick ${4 - picks.length} more`}
              </Btn>
            </>
          )}
        </Section>
      )}

      {/* ===== HOST/CO-HOST controls ===== */}
      {c.canManage && (
        <Section title={`Entrants · ${c.entries.length}`} action={<Badge tone="green"><Shield className="h-3 w-3" />You manage</Badge>}>
          <p className="mb-2 text-[11px] text-text-muted">Admit players · toggle the green dot when they've paid · tap a name to make a co-host.</p>
          <div className="flex flex-col gap-2">
            {c.entries.map((e) => {
              const isHost = e.userId === c.hostId
              const isCo = c.coHostIds.includes(e.userId)
              return (
                <Card key={e.userId} className="flex items-center gap-2.5 p-2.5">
                  <Avatar name={e.name} color={e.avatarColor} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 truncate text-sm font-semibold text-text-primary">{e.name}
                      {isHost && <Crown className="h-3 w-3 text-accent-emerald" />}{isCo && <Badge tone="blue">Co-host</Badge>}
                    </p>
                    <p className="text-[11px] text-text-muted">{e.picks.length ? `${e.picks.length} picked · ${fmtK(e.spend)}` : 'not drafted'}</p>
                  </div>
                  {e.status === 'pending' ? (
                    <Btn size="sm" onClick={() => approve.mutate({ contestId: c.id, userId: e.userId })}><Check className="h-3.5 w-3.5" />Admit</Btn>
                  ) : (
                    <PaidToggle paid={e.paid} editable onToggle={() => togglePaid.mutate({ contestId: c.id, userId: e.userId })} />
                  )}
                  {e.status === 'approved' && !isHost && !isCo && (
                    <button onClick={() => assignCoHost.mutate({ contestId: c.id, userId: e.userId })} title="Make co-host" className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-bg-surface cursor-pointer"><Shield className="h-3.5 w-3.5" /></button>
                  )}
                  {e.status === 'pending' && (
                    <button onClick={() => decline.mutate({ contestId: c.id, userId: e.userId })} className="text-[11px] text-text-muted hover:text-accent-red cursor-pointer">✕</button>
                  )}
                </Card>
              )
            })}
          </div>
        </Section>
      )}

      {/* ===== Chat ===== */}
      <Section title="Table chat">
        <GameChat messages={c.chat} currentUserId={user?.id ?? ''} canSend={canChat} onSend={(text) => postChat.mutate({ contestId: c.id, text })} />
      </Section>
    </div>
  )
}

function cnRow(mine: boolean) {
  return `flex items-center gap-2.5 rounded-xl border px-3 py-2 ${mine ? 'border-accent-purple/40 bg-accent-purple/10' : 'border-border bg-bg-card'}`
}
