import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, Ticket, Users, Globe, Lock, Send, Crown } from 'lucide-react'
import { useMyClubs, useRecentClubs, useCreateClub, useJoinViaInvite } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { useEconomy } from '@/hooks/credits'
import { useSpend } from '@/components/credits/SpendProvider'
import { Section, Spinner, Btn, Sheet, Field, EmptyState } from '@/components/common/ui'
import { CityField } from '@/components/common/CityField'
import { ClubRow } from '@/components/common/cards'
import { ClubsToJoinSection } from '@/components/common/ClubsToJoinSection'
import { hostsClub } from '@/lib/clubRole'
import { cn } from '@/lib/utils/cn'

export function ClubsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const clubs = useMyClubs()
  const allClubs = useRecentClubs()
  const create = useCreateClub()
  const join = useJoinViaInvite()
  const spend = useSpend()
  const createClubCost = useEconomy().data?.costs.createClubCost ?? 200
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  // Callers route here with { state: { create: true } } to open the create-club
  // sheet straight away (onboarding Phase 2 host door). An optional returnTo says
  // where to send the user if they CANCEL the sheet — e.g. "Clubs to join" launches
  // create here but expects cancel to bring them back there, not strand them on My Clubs.
  const navState = useLocation().state as { create?: boolean; returnTo?: string } | null
  const openCreate = navState?.create
  const returnTo = navState?.returnTo
  useEffect(() => { if (openCreate) setCreateOpen(true) }, [openCreate])
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🃏')
  const [desc, setDesc] = useState('')
  const [loc, setLoc] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [telegram, setTelegram] = useState(false)
  const [code, setCode] = useState('')
  const [joinMsg, setJoinMsg] = useState('')

  // Clubs you're in, split by your actual membership role (owner/host) — NOT
  // canManage, which is true for admins on every club and would file clubs you
  // merely belong to under "Hosting". See lib/clubRole.ts.
  const mine = clubs.data ?? []
  const hosting = mine.filter((c) => hostsClub(c.myRole))
  const member = mine.filter((c) => !hostsClub(c.myRole))

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight text-text-primary">{isAdmin ? 'All Clubs' : 'My Clubs'}</h1>
        {!isAdmin && (
          <div className="flex gap-1.5">
            <Btn size="sm" variant="secondary" onClick={() => setJoinOpen(true)}><Ticket className="h-3.5 w-3.5" />Join</Btn>
            <Btn size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-3.5 w-3.5" />Create</Btn>
          </div>
        )}
      </div>

      {isAdmin ? (
        <Section icon={Users} tone="blue" title="All clubs" sub="you oversee every club" count={allClubs.data?.length}>
          {allClubs.isLoading ? <Spinner /> : allClubs.data && allClubs.data.length > 0 ? (
            <div className="flex flex-col gap-2">{allClubs.data.map((c) => <ClubRow key={c.id} club={c} />)}</div>
          ) : (
            <EmptyState icon={<Users className="h-7 w-7" />} title="No clubs yet" sub="Clubs created by hosts will show up here." />
          )}
        </Section>
      ) : clubs.isLoading ? (
        <Section icon={Users} tone="blue" title="Clubs you're in"><Spinner /></Section>
      ) : mine.length === 0 ? (
        <Section icon={Users} tone="blue" title="Clubs you're in">
          <EmptyState icon={<Users className="h-7 w-7" />} title="No clubs yet" sub="Discover a club and request to join, create your own, or join with an invite code." />
        </Section>
      ) : (
        <>
          {hosting.length > 0 && (
            <Section icon={Crown} tone="purple" title="Hosting" sub={`you manage ${hosting.length === 1 ? 'this club' : `these ${hosting.length}`}`} count={hosting.length} indent>
              <div className="flex flex-col gap-2">{hosting.map((c) => <ClubRow key={c.id} club={c} />)}</div>
            </Section>
          )}
          {member.length > 0 && (
            <Section icon={Users} tone="emerald" title={hosting.length > 0 ? 'Member' : "Clubs you're in"} sub={hosting.length > 0 ? "clubs you've joined" : undefined} count={member.length} indent>
              <div className="flex flex-col gap-2">{member.map((c) => <ClubRow key={c.id} club={c} />)}</div>
            </Section>
          )}
        </>
      )}

      {/* Suggested clubs to join — keep growing your crew right from the Clubs tab.
          (Shared near-you list; hidden for admins, who already see every club above.) */}
      {!isAdmin && <ClubsToJoinSection />}

      <Sheet open={createOpen} onClose={() => { setCreateOpen(false); if (returnTo) navigate(returnTo) }} title="Create a club">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="w-20"><Field label="Emoji" value={emoji} onChange={setEmoji} /></div>
            <div className="flex-1"><Field label="Club name" value={name} onChange={setName} placeholder="e.g. Friday Night Crew" /></div>
          </div>
          <Field label="Description" value={desc} onChange={setDesc} placeholder="What's your club about?" />
          <CityField label="City" value={loc} onChange={setLoc} />
          <div>
            <span className="mb-1 block text-xs font-semibold text-text-secondary">Visibility</span>
            <div className="flex gap-1 rounded-xl border border-border bg-bg-card p-1">
              {(['public', 'private'] as const).map((v) => (
                <button key={v} type="button" onClick={() => setVisibility(v)}
                  className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer',
                    visibility === v ? 'bg-accent-blue text-white' : 'text-text-secondary hover:bg-bg-surface')}>
                  {v === 'public' ? <><Globe className="h-3.5 w-3.5" />Public</> : <><Lock className="h-3.5 w-3.5" />Private</>}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[10px] leading-snug text-text-muted">{visibility === 'public'
              ? 'Discoverable — shows up in Discover and search, and people can request to join.'
              : 'Hidden — invite-only. Not discoverable or searchable, and a direct link reveals nothing. You share a private code; only invited people can request.'}</p>
          </div>
          <button type="button" onClick={() => setTelegram((v) => !v)} className={cn('flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition-colors cursor-pointer', telegram ? 'border-accent-blue bg-accent-blue/5' : 'border-border hover:bg-bg-surface')}>
            <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', telegram ? 'bg-accent-blue/15 text-accent-blue' : 'bg-bg-surface text-text-muted')}><Send className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-sm font-bold text-text-primary">Telegram channel for members
                <span className={cn('ml-auto flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors', telegram ? 'justify-end bg-accent-blue' : 'justify-start bg-border')}><span className="h-3 w-3 rounded-full bg-white" /></span>
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-text-muted">Members get instant alerts for <b className="text-text-secondary">new games, results &amp; monthly leaderboard recaps</b> — and one-tap join. You'll connect it in ~30 seconds after creating the club.</span>
            </span>
          </button>
          <Btn className="w-full" disabled={!name.trim() || !loc.trim()} loading={create.isPending} onClick={async () => { if (!(await spend({ cost: createClubCost, kind: 'create_club', label: `Created ${name.trim()}`, title: 'Create this club', verb: 'Create' }))) return; const club = await create.mutateAsync({ name, emoji, description: desc, location: loc, visibility, telegram }); setCreateOpen(false); setName(''); setDesc(''); setLoc(''); setVisibility('public'); setTelegram(false); navigate(`/club/${club.id}`) }}>
            Create club — you're the host · {createClubCost} cr
          </Btn>
          <p className="text-center text-[11px] text-text-muted">You'll own it, get an invite code, and approve who joins.</p>
        </div>
      </Sheet>

      <Sheet open={joinOpen} onClose={() => setJoinOpen(false)} title="Join with an invite code">
        <div className="flex flex-col gap-3">
          <Field label="Invite code" value={code} onChange={setCode} placeholder="e.g. ACES24" mono />
          <Btn className="w-full" disabled={!code.trim()} loading={join.isPending} onClick={async () => { const c = await join.mutateAsync(code); setJoinMsg(c ? `Requested to join ${c.name} — awaiting approval.` : 'If a club matches that code, your request was sent — you\'ll get access once the host admits you.'); setCode('') }}>
            Request to join
          </Btn>
          {joinMsg && <p className="text-center text-xs font-semibold text-accent-emerald">{joinMsg}</p>}
          <p className="text-center text-[11px] text-text-muted">Public clubs reveal themselves on a match; private ones stay hidden. Try <span className="font-mono">ACES24</span> or <span className="font-mono">RIVER1</span>.</p>
        </div>
      </Sheet>
    </div>
  )
}
