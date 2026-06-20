import { useState } from 'react'
import { Plus, Ticket, Users, Globe, Lock, Send } from 'lucide-react'
import { useMyClubs, useRecentClubs, useCreateClub, useJoinViaInvite } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { useEconomy } from '@/hooks/credits'
import { useSpend } from '@/components/credits/SpendProvider'
import { Section, Spinner, Btn, Sheet, Field, EmptyState } from '@/components/common/ui'
import { CityField } from '@/components/common/CityField'
import { ClubRow } from '@/components/common/cards'
import { hostsClub } from '@/lib/clubRole'
import { cn } from '@/lib/utils/cn'

export function ClubsPage() {
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
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('ðŸƒ')
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
        <Section title="All clubs" action={<span className="text-xs text-text-muted">you oversee every club</span>}>
          {allClubs.isLoading ? <Spinner /> : allClubs.data && allClubs.data.length > 0 ? (
            <div className="flex flex-col gap-2">{allClubs.data.map((c) => <ClubRow key={c.id} club={c} />)}</div>
          ) : (
            <EmptyState icon={<Users className="h-7 w-7" />} title="No clubs yet" sub="Clubs created by hosts will show up here." />
          )}
        </Section>
      ) : clubs.isLoading ? (
        <Section title="Clubs you're in"><Spinner /></Section>
      ) : mine.length === 0 ? (
        <Section title="Clubs you're in">
          <EmptyState icon={<Users className="h-7 w-7" />} title="No clubs yet" sub="Discover a club and request to join, create your own, or join with an invite code." />
        </Section>
      ) : (
        <>
          {hosting.length > 0 && (
            <Section title="Hosting" action={<span className="text-xs text-text-muted">you manage {hosting.length === 1 ? 'this club' : `these ${hosting.length}`}</span>}>
              <div className="flex flex-col gap-2">{hosting.map((c) => <ClubRow key={c.id} club={c} />)}</div>
            </Section>
          )}
          {member.length > 0 && (
            <Section title={hosting.length > 0 ? 'Member' : "Clubs you're in"}>
              <div className="flex flex-col gap-2">{member.map((c) => <ClubRow key={c.id} club={c} />)}</div>
            </Section>
          )}
        </>
      )}

      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="Create a club">
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
              <span className="mt-0.5 block text-[11px] leading-snug text-text-muted">Members get instant alerts for <b className="text-text-secondary">new games, results & monthly leaderboard recaps</b> — and one-tap join, auto-managed. You'll connect it in ~30 seconds after creating the club.</span>
            </span>
          </button>
          <Btn className="w-full" disabled={!name.trim() || !loc.trim()} loading={create.isPending} onClick={async () => { if (!(await spend({ cost: createClubCost, kind: 'create_club', label: `Created ${name.trim()}`, title: 'Create this club', verb: 'Create' }))) return; await create.mutateAsync({ name, emoji, description: desc, location: loc, visibility, telegram }); setCreateOpen(false); setName(''); setDesc(''); setLoc(''); setVisibility('public'); setTelegram(false) }}>
            Create club â€” you're the host Â· {createClubCost} cr
          </Btn>
          <p className="text-center text-[11px] text-text-muted">You'll own it, get an invite code, and approve who joins.</p>
        </div>
      </Sheet>

      <Sheet open={joinOpen} onClose={() => setJoinOpen(false)} title="Join with an invite code">
        <div className="flex flex-col gap-3">
          <Field label="Invite code" value={code} onChange={setCode} placeholder="e.g. ACES24" mono />
          <Btn className="w-full" disabled={!code.trim()} loading={join.isPending} onClick={async () => { const c = await join.mutateAsync(code); setJoinMsg(c ? `Requested to join ${c.name} â€” awaiting approval.` : 'If a club matches that code, your request was sent â€” you\'ll get access once the host admits you.'); setCode('') }}>
            Request to join
          </Btn>
          {joinMsg && <p className="text-center text-xs font-semibold text-accent-emerald">{joinMsg}</p>}
          <p className="text-center text-[11px] text-text-muted">Public clubs reveal themselves on a match; private ones stay hidden. Try <span className="font-mono">ACES24</span> or <span className="font-mono">RIVER1</span>.</p>
        </div>
      </Sheet>
    </div>
  )
}
