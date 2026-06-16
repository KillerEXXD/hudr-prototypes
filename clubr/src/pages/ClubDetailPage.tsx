import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Lock, Eye, Copy, Check, Target, Timer, Plus, UserCheck, X } from 'lucide-react'
import { useClub, useApproveMember, useRejectMember, useRequestToJoin } from '@/hooks'
import { useContests } from '@/hooks/ft'
import { useGames } from '@/hooks/ll'
import { Avatar, Badge, Btn, Card, Section, Spinner, EmptyState } from '@/components/common/ui'
import { MembershipBadge } from '@/components/common/cards'
import { ContestRow } from '@/pages/FantasyPage'
import { GameRow } from '@/pages/LastLongerPage'

export function ClubDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: club, isLoading } = useClub(id)
  const approve = useApproveMember()
  const reject = useRejectMember()
  const request = useRequestToJoin()
  const contests = useContests()
  const games = useGames()
  const [copied, setCopied] = useState(false)

  if (isLoading) return <Spinner label="Loading club…" />
  if (!club) return <EmptyState title="Club not found" />

  const members = club.members.filter((m) => m.status === 'member')
  const pending = club.members.filter((m) => m.status === 'pending')
  const owner = members.find((m) => m.role === 'owner')
  const isMember = club.myStatus === 'member'
  const clubContests = (contests.data ?? []).filter((c) => c.clubId === club.id && c.status !== 'settled')
  const clubGames = (games.data ?? []).filter((g) => g.clubId === club.id && g.status !== 'completed')

  function copyCode() {
    // Shareable URL — a new user clicks it, signs up, and is dropped into the
    // join form with this club's code prefilled (then the host vets & admits).
    const url = `${window.location.origin}${window.location.pathname}#/?join=${club!.inviteCode}`
    navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
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
          <Section title="Invite link">
            <Card className="flex items-center justify-between">
              <span className="font-mono text-lg font-bold tracking-widest text-text-primary">{club.inviteCode}</span>
              <Btn size="sm" variant="secondary" onClick={copyCode}>{copied ? <><Check className="h-3.5 w-3.5 text-accent-emerald" />Copied!</> : <><Copy className="h-3.5 w-3.5" />Copy link</>}</Btn>
            </Card>
            <p className="mt-1.5 text-[11px] text-text-muted">Share the link — new players sign up &amp; request to join; you admit them after vetting.</p>
          </Section>

          <Section title={`Join requests${pending.length ? ` · ${pending.length}` : ''}`}>
            {pending.length === 0 ? (
              <EmptyState title="No pending requests" sub="When someone requests to join, approve them here." />
            ) : (
              <div className="flex flex-col gap-2">
                {pending.map((m) => (
                  <Card key={m.userId} className="flex items-center gap-3 p-3">
                    <button onClick={() => navigate(`/member/${m.userId}`)} className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer">
                      <Avatar name={m.name} color={m.avatarColor} size={36} />
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-text-primary">{m.name}</p><p className="text-xs text-text-muted">@{m.handle} · tap to vet →</p></div>
                    </button>
                    <Btn size="sm" onClick={() => approve.mutate({ clubId: club.id, userId: m.userId })}><UserCheck className="h-3.5 w-3.5" />Admit</Btn>
                    <button onClick={() => reject.mutate({ clubId: club.id, userId: m.userId })} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-bg-surface cursor-pointer" aria-label="Reject"><X className="h-4 w-4" /></button>
                  </Card>
                ))}
              </div>
            )}
          </Section>
        </>
      )}

      {/* Games in this club */}
      <Section title="FT Fantasy" action={<span className="flex items-center gap-1 text-xs text-text-muted"><Target className="h-3.5 w-3.5 text-accent-purple" />Stack Draft</span>}>
        {clubContests.length > 0 ? (
          <div className="flex flex-col gap-2">{clubContests.map((c) => <ContestRow key={c.id} c={c} />)}</div>
        ) : (
          <p className="rounded-xl border border-border bg-bg-card px-3 py-2.5 text-xs text-text-muted">{isMember || club.canManage ? 'No open contests right now.' : 'Join the club to see its contests.'}{club.canManage && ' Host one from the FT Fantasy tab.'}</p>
        )}
      </Section>
      <Section title="Last Longer" action={<span className="flex items-center gap-1 text-xs text-text-muted"><Timer className="h-3.5 w-3.5 text-accent-amber" />Live tournament</span>}>
        {clubGames.length > 0 ? (
          <div className="flex flex-col gap-2">{clubGames.map((g) => <GameRow key={g.id} g={g} />)}</div>
        ) : (
          <p className="rounded-xl border border-border bg-bg-card px-3 py-2.5 text-xs text-text-muted">{isMember || club.canManage ? 'No live games right now.' : 'Join the club to see its games.'}{club.canManage && ' Create one from the Last Longer tab.'}</p>
        )}
      </Section>

      {/* Members — full roster is host/admin only; members see just the owner + count */}
      <Section title={`Members · ${members.length}`}>
        {club.canManage ? (
          <>
            <p className="mb-2 text-[11px] text-text-muted">You manage this roster — tap a member to view, ✕ to remove.</p>
            <div className="flex flex-col gap-1.5">
              {members.map((m) => (
                <div key={m.userId} className="flex items-center gap-2.5 rounded-xl border border-border bg-bg-card px-3 py-2">
                  <button onClick={() => navigate(`/member/${m.userId}`)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left cursor-pointer">
                    <Avatar name={m.name} color={m.avatarColor} size={30} />
                    <span className="truncate text-sm text-text-primary">{m.name}</span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                  </button>
                  {m.role !== 'member' && <Badge tone={m.role === 'owner' ? 'green' : 'blue'}>{m.role}</Badge>}
                  {m.role !== 'owner' && (
                    <button onClick={() => reject.mutate({ clubId: club.id, userId: m.userId })} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-accent-red/10 hover:text-accent-red cursor-pointer" aria-label={`Remove ${m.name}`}><X className="h-3.5 w-3.5" /></button>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-1.5">
            {owner && (
              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-bg-card px-3 py-2">
                <Avatar name={owner.name} color={owner.avatarColor} size={30} />
                <span className="flex-1 truncate text-sm text-text-primary">{owner.name}</span>
                <Badge tone="green">Owner</Badge>
              </div>
            )}
            <p className="text-[11px] text-text-muted">{members.length} members total · only the host sees the full roster.</p>
          </div>
        )}
      </Section>
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
