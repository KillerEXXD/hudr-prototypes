import { useState } from 'react'
import { Plus, Ticket, Users } from 'lucide-react'
import { useMyClubs, useRecentClubs, useCreateClub, useJoinViaInvite } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { useEconomy } from '@/hooks/credits'
import { useSpend } from '@/components/credits/SpendProvider'
import { Section, Spinner, Btn, Card, Sheet, Field, EmptyState } from '@/components/common/ui'
import { ClubRow } from '@/components/common/cards'

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
  const [emoji, setEmoji] = useState('🃏')
  const [desc, setDesc] = useState('')
  const [loc, setLoc] = useState('')
  const [code, setCode] = useState('')
  const [joinMsg, setJoinMsg] = useState('')

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
      ) : (
        <Section title="Clubs you're in">
          {clubs.isLoading ? <Spinner /> : clubs.data && clubs.data.length > 0 ? (
            <div className="flex flex-col gap-2">{clubs.data.map((c) => <ClubRow key={c.id} club={c} />)}</div>
          ) : (
            <EmptyState icon={<Users className="h-7 w-7" />} title="No clubs yet" sub="Discover a club and request to join, create your own, or join with an invite code." />
          )}
        </Section>
      )}

      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="Create a club">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="w-20"><Field label="Emoji" value={emoji} onChange={setEmoji} /></div>
            <div className="flex-1"><Field label="Club name" value={name} onChange={setName} placeholder="e.g. Friday Night Crew" /></div>
          </div>
          <Field label="Description" value={desc} onChange={setDesc} placeholder="What's your club about?" />
          <Field label="City" value={loc} onChange={setLoc} placeholder="e.g. Houston, TX" />
          <Btn className="w-full" disabled={!name.trim() || !loc.trim() || create.isPending} onClick={async () => { if (!(await spend({ cost: createClubCost, kind: 'create_club', label: `Created ${name.trim()}`, title: 'Create this club', verb: 'Create' }))) return; await create.mutateAsync({ name, emoji, description: desc, location: loc }); setCreateOpen(false); setName(''); setDesc(''); setLoc('') }}>
            Create club — you're the host · {createClubCost} cr
          </Btn>
          <p className="text-center text-[11px] text-text-muted">You'll own it, get an invite code, and approve who joins.</p>
        </div>
      </Sheet>

      <Sheet open={joinOpen} onClose={() => setJoinOpen(false)} title="Join with an invite code">
        <div className="flex flex-col gap-3">
          <Field label="Invite code" value={code} onChange={setCode} placeholder="e.g. ACES24" mono />
          <Btn className="w-full" disabled={!code.trim() || join.isPending} onClick={async () => { const c = await join.mutateAsync(code); setJoinMsg(c ? `Requested to join ${c.name} — awaiting approval.` : 'No club found for that code.'); if (c) setCode('') }}>
            Request to join
          </Btn>
          {joinMsg && <p className="text-center text-xs font-semibold text-accent-emerald">{joinMsg}</p>}
          <p className="text-center text-[11px] text-text-muted">Try <span className="font-mono">ACES24</span>, <span className="font-mono">RIVER1</span>, or <span className="font-mono">HIGH88</span>.</p>
        </div>
      </Sheet>
    </div>
  )
}
