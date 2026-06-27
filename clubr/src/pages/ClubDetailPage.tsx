import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Lock, Globe, Eye, Copy, Check, Gamepad2, Trophy, Users, Plus, UserCheck, X, MapPin, Ticket, ChevronDown, PartyPopper, GraduationCap } from 'lucide-react'
import { useClub, useApproveMember, useRejectMember, useRequestToJoin, useJoinViaInvite, useSetClubVisibility } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, Badge, Btn, Card, Field, Section, Sheet, Spinner, EmptyState, ProcessingOverlay } from '@/components/common/ui'
import { MembershipBadge } from '@/components/common/cards'
import { NewGameSheet } from '@/components/games/NewGameSheet'
import { WinnerCard } from '@/components/games/WinnerCard'
import { MembersIcon } from '@/components/games/MembersIcon'
import { HostSelfJoinBar } from '@/components/games/HostSelfJoinBar'
import { InfiniteList } from '@/components/common/InfiniteList'
import { LeaderboardSection } from '@/components/leaderboard/LeaderboardSection'
import { TelegramJoinChip, TelegramSetupCard, TelegramHostPanel } from '@/components/telegram/ClubTelegram'
import { useUnifiedGames, matchesType, type UnifiedGame } from '@/games/useUnifiedGames'
import { CLUB_STATUSES, clubStatusOf, amPlaying, type ClubStatus } from '@/games/clubGameStatus'
import { LiveIcon } from '@/components/common/LiveIcon'
import { renderUnifiedGame } from '@/games/renderGame'
import { GAME_TYPES, type GameType } from '@/games/types'
import { cn } from '@/lib/utils/cn'

// Club-detail Games filter — ONE 4-way partition (New · Live · Running · Finished) shown
// to EVERY viewer, all four pills always visible with counts. Rule + ClubStatus type live
// in `@/games/clubGameStatus`; club-detail-only (cross-page relationshipOf unchanged).

// Your-games pill is "Live" with the broadcast LiveIcon (same identity as the bottom-nav
// Live page). The other three are icon-less so the four pills stay on one mobile row.
const STATUS_META: Record<ClubStatus, { label: string; active: string }> = {
  available: { label: 'New', active: 'border-accent-blue bg-accent-blue/20 text-accent-blue font-bold ring-1 ring-accent-blue/40' },
  playing: { label: 'Live', active: 'border-accent-emerald bg-accent-emerald/20 text-accent-emerald font-bold ring-1 ring-accent-emerald/40' },
  running: { label: 'Running', active: 'border-accent-red bg-accent-red/20 text-accent-red font-bold ring-1 ring-accent-red/40' },
  finished: { label: 'Finished', active: 'border-accent-amber bg-accent-amber/20 text-accent-amber font-bold ring-1 ring-accent-amber/40' },
}

export function ClubDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  // Set after an invite-link join: 'already-member' (welcome) or 'pending' (request sent).
  const justJoined = (useLocation().state as { joinResult?: 'already-member' | 'pending' } | null)?.joinResult
  const { user } = useAuth()
  const { data: club, isLoading } = useClub(id)
  const approve = useApproveMember()
  const reject = useRejectMember()
  const request = useRequestToJoin()
  const setVis = useSetClubVisibility()
  const allGames = useUnifiedGames()
  const [copied, setCopied] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [gameFilter, setGameFilter] = useState<'all' | GameType>('all')
  // The pill the user explicitly tapped (null = none yet → use the role default).
  const [picked, setPicked] = useState<ClubStatus | null>(null)
  const [tab, setTab] = useState<'games' | 'leaderboard' | 'members'>('games')

  if (isLoading) return <Spinner label="Loading club…" />
  // Non-disclosure: a private club you can't see is indistinguishable from a club that
  // doesn't exist — both land here. Show an identical invite-code gate, never any detail.
  if (!club) return <PrivateClubGate />

  const isPrivate = club.visibility === 'private'

  const members = club.members.filter((m) => m.status === 'member')
  const pending = club.members.filter((m) => m.status === 'pending')
  const isMember = club.myStatus === 'member'
  // Every game in this club, across all types (club = container) — incl. finished,
  // since Completed needs them. Active list stays urgency-sorted (its source order).
  const clubAll = allGames.items.filter((g) => g.clubId === club.id)
  const typesPresent = GAME_TYPES.filter((t) => clubAll.some((g) => g.type === t.id))
  const byType = (g: UnifiedGame) => gameFilter === 'all' || matchesType(g, gameFilter)
  const isAdmin = user?.role === 'admin'
  const canHostHere = club.canManage && !isAdmin   // app admins never host/join
  // ONE 4-way partition for every viewer (see clubGameStatus.ts). All four pills always
  // show with their counts; each card's timing label is phase-driven.
  const visibleStatuses = CLUB_STATUSES
  const counts: Record<ClubStatus, number> = { available: 0, playing: 0, running: 0, finished: 0 }
  for (const g of clubAll) if (byType(g)) counts[clubStatusOf(g)]++
  const totalShown = counts.available + counts.playing + counts.running + counts.finished
  const playingLive = clubAll.some((g) => byType(g) && g.phase === 'live' && clubStatusOf(g) === 'playing')
  const gameStatus: ClubStatus =
    picked && CLUB_STATUSES.includes(picked) ? picked
    : counts.playing > 0 ? 'playing'
    : CLUB_STATUSES.find((s) => counts[s] > 0) ?? 'playing'
  const activeShown = clubAll.filter((g) => byType(g) && !g.finished && clubStatusOf(g) === gameStatus)
  // Finished: settled + cancelled, newest first by settled timestamp (cancelled → bottom).
  const finishedItems = clubAll
    .filter((g) => byType(g) && g.finished)
    .sort((a, b) => (b.settledAt ?? '').localeCompare(a.settledAt ?? ''))
  // Tabs: Games + Leaderboard for everyone; Members only for the host/admin who manage the roster
  // (players don't see the member list). The header already shows "N members · hosted by X".
  const tabs: { id: 'games' | 'leaderboard' | 'members'; label: string; icon: typeof Users; badge?: number }[] = [
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    ...(club.canManage ? [{ id: 'members' as const, label: 'Members', icon: Users, badge: pending.length }] : []),
  ]

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
          {/* Name + the club's identity badge (visibility) — a solid, color-coded chip
              for both states: Private = amber + lock (restricted), Public = emerald +
              globe (open). Your ROLE (Owner) stays trailing on the right. */}
          <div className="flex items-center gap-1.5">
            <h1 className="truncate text-xl font-extrabold tracking-tight text-text-primary">{club.name}</h1>
            {isPrivate ? (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-accent-amber/40 bg-accent-amber/15 px-2 py-0.5 text-[11px] font-bold text-accent-amber"><Lock className="h-3 w-3" />Private</span>
            ) : (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-accent-emerald/40 bg-accent-emerald/15 px-2 py-0.5 text-[11px] font-bold text-accent-emerald"><Globe className="h-3 w-3" />Public</span>
            )}
            {club.isDemo && (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-accent-blue to-accent-purple px-2 py-0.5 text-[11px] font-bold text-white shadow-sm ring-1 ring-white/25"><GraduationCap className="h-3 w-3" />Demo</span>
            )}
          </div>
          {/* Member count carries weight + a Users glyph (a legible stat); "hosted by"
              stays muted with the host NAME emphasized + tappable (accent on hover). */}
          <p className="text-[13px] text-text-muted">
            <span className="inline-flex items-center gap-1 font-bold text-text-secondary"><MembersIcon size={16} />{members.length}</span>
            <span className="mx-1">·</span>hosted by{' '}
            <button type="button" onClick={() => navigate(`/member/${club.ownerId}`, { state: { from: `/club/${club.id}` } })}
              className="font-semibold text-text-primary underline-offset-2 hover:text-accent-blue hover:underline cursor-pointer">{club.ownerName}</button>
          </p>
          {club.location && <p className="mt-0.5 flex items-center gap-1 text-[11px] text-text-muted"><MapPin className="h-3 w-3" />{club.location}</p>}
        </div>
        <MembershipBadge status={club.myStatus} role={club.myRole} />
      </div>
      <p className="mt-2 text-sm text-text-secondary">{club.description}</p>
      {/* Subtle, member-only Telegram join — self-hides unless you're an admitted
          member of a club that has a channel. */}
      <div><TelegramJoinChip clubId={club.id} /></div>
      {/* Host-only: finish the Telegram setup they opted into at club creation. */}
      <TelegramSetupCard clubId={club.id} canManage={club.canManage} pending={club.telegramSetupPending} clubName={club.name} />

      {/* Host actions — compact, near the club name (above the tabs) */}
      {club.canManage && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Btn size="sm" variant="secondary" onClick={() => setInviteOpen(true)}><Ticket className="h-3.5 w-3.5" />Invite</Btn>
          {canHostHere && <Btn size="sm" onClick={() => setNewOpen(true)}><Plus className="h-3.5 w-3.5" />New game</Btn>}
        </div>
      )}

      {/* Access state banners */}
      {/* Fresh from an invite link: welcome an existing member, or confirm a new request. */}
      {justJoined === 'already-member' && (
        <Card className="mt-3 flex items-start gap-2.5 border-accent-emerald/30 bg-accent-emerald/10">
          <PartyPopper className="mt-0.5 h-4 w-4 shrink-0 text-accent-emerald" />
          <p className="text-xs leading-snug text-text-secondary"><span className="font-bold text-text-primary">You're already a member of {club.name}.</span> You're all set — jump into any game below.</p>
        </Card>
      )}
      {/* Hide once the host admits them (myStatus 'member') — the nav-state is stale. */}
      {justJoined === 'pending' && !isMember && (
        <Card className="mt-3 flex items-start gap-2.5 border-accent-emerald/30 bg-accent-emerald/10">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-emerald" />
          <p className="text-xs leading-snug text-text-secondary"><span className="font-bold text-text-primary">Request sent — pending approval.</span> The host has been notified; you'll be able to enter games once they admit you.</p>
        </Card>
      )}
      {club.myStatus === 'pending' && !justJoined && (
        <Card className="mt-3 flex items-start gap-2.5 border-accent-amber/30 bg-accent-amber/10">
          <Eye className="mt-0.5 h-4 w-4 shrink-0 text-accent-amber" />
          <p className="text-xs leading-snug text-text-secondary"><span className="font-bold text-text-primary">Read-only — awaiting approval.</span> You can look around, but you can't enter games until the host admits you.</p>
        </Card>
      )}
      {club.myStatus === 'none' && !club.canManage && (
        <Btn className="mt-3 w-full" onClick={() => request.mutate(club.id)} loading={request.isPending}><Plus className="h-4 w-4" />Request to join</Btn>
      )}

      {/* Tabs — Games / Leaderboard for everyone; Members for host & admin only.
          The host's invite link + join requests live inside the Members tab to keep
          this page uncluttered (the Members tab badges the pending count). */}
      <div className={cn('mt-4 flex gap-1 rounded-xl border border-border bg-bg-card p-1', tab === 'games' && 'rounded-b-none')}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer',
              tab === t.id ? 'bg-accent-blue text-white' : 'text-text-secondary hover:bg-bg-surface')}
          >
            <t.icon className="h-3.5 w-3.5" />{t.label}
            {t.badge ? <span className={cn('ml-0.5 rounded-full px-1.5 py-px text-[10px] font-extrabold', tab === t.id ? 'bg-white/25 text-white' : 'bg-accent-amber/20 text-accent-amber')}>{t.badge}</span> : null}
          </button>
        ))}
      </div>

      {/* Games tab — all types in one place (club = container). The filter chips +
          game list live in one panel that connects flush to the tab bar above (its
          bottom border is the seam), so the filters read as "the Games tab's". */}
      {tab === 'games' && (
        <div className="rounded-b-xl border border-t-0 border-border bg-bg-card/40 p-2.5">
          {/* Type filter lives in the header as a dropdown — hidden when there's
              nothing to choose (a single game type in this club). */}
          {typesPresent.length > 1 && (
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-text-muted">Games</span>
              <div className="relative">
                <select
                  value={gameFilter}
                  onChange={(e) => setGameFilter(e.target.value as 'all' | GameType)}
                  aria-label="Filter games by type"
                  className="cursor-pointer appearance-none rounded-full border border-border bg-bg-card py-1 pl-3 pr-7 text-xs font-bold text-text-secondary"
                >
                  <option value="all">All games</option>
                  {typesPresent.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
              </div>
            </div>
          )}

          {allGames.isLoading ? (
            <Spinner />
          ) : totalShown === 0 ? (
            // Nothing in any bucket for this viewer — a single contextual empty state.
            <EmptyState
              icon={<Gamepad2 className="h-7 w-7" />}
              title={!isMember && club.myStatus !== 'pending' && !club.canManage ? 'Join the club to see its games' : 'No games in this club yet'}
              sub={!isMember && club.myStatus !== 'pending' && !club.canManage
                ? 'Request to join above — then you can browse and enter its games.'
                : canHostHere ? 'Tap “New game” above to host one — FT Fantasy, Last Longer or Squares.' : 'When a game opens for registration, it shows up here.'}
            />
          ) : (
            <>
              {/* Status pills — only the non-empty ones for this role */}
              <div className="mb-2.5 flex gap-1 overflow-x-auto no-scrollbar border-b border-border/60 pb-2.5" role="tablist" aria-label="Filter games by status">
                {visibleStatuses.map((s) => {
                  const m = STATUS_META[s]
                  const on = gameStatus === s
                  return (
                    <button key={s} type="button" role="tab" aria-selected={on} onClick={() => setPicked(s)}
                      className={cn('flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs cursor-pointer transition-colors', on ? m.active : 'border-border font-semibold text-text-secondary')}>
                      {s === 'playing' && <LiveIcon size={13} animate={playingLive} />}
                      {m.label}
                      {/* Count rides in a tabular-nums span (no parens) so a two-digit
                          count stays compact and doesn't widen or jitter the pill. */}
                      <span className="tabular-nums opacity-80">{counts[s]}</span>
                    </button>
                  )
                })}
              </div>

              {gameStatus === 'finished' ? (
                <InfiniteList
                  items={finishedItems}
                  batch={8}
                  resetKey={`finished-${gameFilter}`}
                  className="flex flex-col gap-2"
                  renderItem={(g) => <WinnerCard key={`${g.type}_${g.id}`} g={g} />}
                />
              ) : (
                <div className="flex flex-col gap-2">
                  {activeShown.map((g) =>
                    canHostHere && !amPlaying(g) ? (
                      <div key={`${g.type}_${g.id}`} className="flex flex-col gap-1.5">
                        {renderUnifiedGame(g, gameFilter === 'all')}
                        <HostSelfJoinBar g={g} />
                      </div>
                    ) : (
                      renderUnifiedGame(g, gameFilter === 'all')
                    ),
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Leaderboard tab — this club only */}
      {tab === 'leaderboard' && <LeaderboardSection clubId={club.id} clubName={club.name} clubEmoji={club.emoji} canView={isMember || club.canManage} />}

      {/* Members tab — host & admin only (players never see the list). Holds the
          host-management cluster: invite link, join-request queue, and the roster. */}
      {tab === 'members' && club.canManage && (
        <>
          <Section title={`Join requests${pending.length ? ` · ${pending.length}` : ''}`}>
            {pending.length === 0 ? (
              <EmptyState title="No pending requests" sub="When someone requests to join, approve them here." />
            ) : (
              <div className="flex flex-col gap-2">
                {pending.map((m) => (
                  <Card key={m.userId} className="relative flex items-center gap-3 p-3">
                    {approve.isPending && approve.variables?.userId === m.userId && <ProcessingOverlay label="Admitting…" />}
                    {reject.isPending && reject.variables?.userId === m.userId && <ProcessingOverlay label="Removing…" />}
                    <button onClick={() => navigate(`/member/${m.userId}`, { state: { from: `/club/${club.id}` } })} className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer">
                      <Avatar name={m.name} color={m.avatarColor} pic={m.avatarUrl} size={36} />
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-text-primary">{m.name}</p><p className="text-xs text-text-muted">{m.handle ? <>@{m.handle} · </> : null}tap to vet →</p></div>
                    </button>
                    <Btn size="sm" loading={approve.isPending && approve.variables?.userId === m.userId} onClick={() => approve.mutate({ clubId: club.id, userId: m.userId })}><UserCheck className="h-3.5 w-3.5" />Admit</Btn>
                    <button onClick={() => reject.mutate({ clubId: club.id, userId: m.userId })} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-bg-surface cursor-pointer" aria-label="Reject"><X className="h-4 w-4" /></button>
                  </Card>
                ))}
              </div>
            )}
          </Section>

          <Section title={`Roster · ${members.length}`}>
            <p className="mb-2 text-[11px] text-text-muted">Tap a member to view, ✕ to remove.</p>
            <div className="flex flex-col gap-1.5">
              {members.map((m) => (
                <div key={m.userId} className="relative flex items-center gap-2.5 rounded-xl border border-border bg-bg-card px-3 py-2">
                  {reject.isPending && reject.variables?.userId === m.userId && <ProcessingOverlay label="Removing…" />}
                  <button onClick={() => navigate(`/member/${m.userId}`, { state: { from: `/club/${club.id}` } })} className="flex min-w-0 flex-1 items-center gap-2.5 text-left cursor-pointer">
                    <Avatar name={m.name} color={m.avatarColor} pic={m.avatarUrl} size={30} />
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
          </Section>

          <Section title="Visibility">
            <Card className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-bold text-text-primary">{isPrivate ? <><Lock className="h-3.5 w-3.5 text-text-muted" />Private</> : <><Globe className="h-3.5 w-3.5 text-text-muted" />Public</>}</p>
                <p className="mt-0.5 text-[11px] leading-snug text-text-muted">{isPrivate ? 'Hidden — invite-only; not discoverable, and a direct link reveals nothing.' : 'Discoverable in Discover & search; anyone can request to join.'}</p>
              </div>
              <Btn size="sm" variant="secondary" loading={setVis.isPending} onClick={() => setVis.mutate({ clubId: club.id, visibility: isPrivate ? 'public' : 'private' })}>{isPrivate ? 'Make public' : 'Make private'}</Btn>
            </Card>
            <p className="mt-1.5 text-[10px] text-text-muted">Switching regenerates the invite code{isPrivate ? '' : ' — a long, copy-only one when going private'}.</p>
          </Section>

          <TelegramHostPanel clubId={club.id} />
        </>
      )}

      <NewGameSheet open={newOpen} onClose={() => setNewOpen(false)} fixedClubId={club.id} />

      <Sheet open={inviteOpen} onClose={() => setInviteOpen(false)} title={`Invite to ${club.name}`}>
        <Card className="flex items-center justify-between">
          <span className="font-mono text-lg font-bold tracking-widest text-text-primary">{isPrivate ? '••••••••' : club.inviteCode}</span>
          <Btn size="sm" variant="secondary" onClick={copyCode}>{copied ? <><Check className="h-3.5 w-3.5 text-accent-emerald" />Copied!</> : <><Copy className="h-3.5 w-3.5" />Copy link</>}</Btn>
        </Card>
        <p className="mt-2 text-[11px] leading-snug text-text-muted">{isPrivate
          ? <>This club is <b className="text-text-secondary">private</b> — the code stays hidden, so just <b className="text-text-secondary">copy &amp; send the link</b> to someone you want in. They request access and you admit them under <b className="text-text-secondary">Members → Join requests</b>.</>
          : <>Share the link — new players sign up &amp; request to join; you admit them after vetting. They appear under <b className="text-text-secondary">Members → Join requests</b>.</>}</p>
      </Sheet>
    </div>
  )
}

// Shown for ANY club a viewer can't see — a private club they're not in OR a club
// that doesn't exist. Identical either way, so a direct URL never reveals whether a
// private club exists. Only an invite code lets you request access (host then admits).
function PrivateClubGate() {
  const navigate = useNavigate()
  const join = useJoinViaInvite()
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  return (
    <div className="animate-fade-up">
      <button onClick={() => navigate(-1)} className="mb-2 flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary cursor-pointer"><ChevronLeft className="h-4 w-4" />Back</button>
      <div className="mt-6 flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-surface text-text-muted"><Lock className="h-6 w-6" /></div>
        <h1 className="mt-3 text-xl font-extrabold tracking-tight text-text-primary">Private or unavailable</h1>
        <p className="mt-1 max-w-sm text-sm text-text-secondary">If you have an invite code, enter it to request access — the host will admit you. We don't show anything about a club unless you're a member.</p>
      </div>
      <Card className="mt-4">
        <Field label="Invite code" value={code} onChange={setCode} placeholder="Paste your invite code" mono />
        <Btn className="mt-2 w-full" disabled={!code.trim()} loading={join.isPending} onClick={async () => { await join.mutateAsync(code.trim()); setMsg("If a club matches that code, your request has been sent — you'll get access once the host admits you."); setCode('') }}>Request access</Btn>
        {msg && <p className="mt-2 text-center text-xs font-semibold text-accent-emerald">{msg}</p>}
      </Card>
      <p className="mt-3 text-center text-[11px] text-text-muted">No ClubR account yet? Sign in first, then use your invite code.</p>
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
