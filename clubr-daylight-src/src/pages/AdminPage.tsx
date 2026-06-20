import { useState } from 'react'
import { ChevronLeft, ShieldCheck, Users, Building2, Target, Trophy, Clock, Plus } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAllClubs, useAllUsers } from '@/hooks'
import { useAvailableFTs } from '@/hooks/ft'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, Badge, Btn, Card, Section, Spinner, EmptyState } from '@/components/common/ui'
import { CreateFTSheet } from '@/components/ft/CreateFTSheet'
import { AdminEconomy } from '@/components/credits/AdminEconomy'
import { AdminLeaderboard } from '@/components/leaderboard/AdminLeaderboard'

export function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const clubs = useAllClubs()
  const users = useAllUsers()
  const fts = useAvailableFTs()
  const [addOpen, setAddOpen] = useState(false)

  if (user?.role !== 'admin') return <EmptyState icon={<ShieldCheck className="h-7 w-7" />} title="Admins only" sub="Sign in as App Admin to manage all clubs and users." />

  const roleTone = { admin: 'purple', host: 'green', player: 'blue' } as const
  const isHome = pathname === '/'

  return (
    <div className="animate-fade-up">
      {!isHome && <button onClick={() => navigate(-1)} className="mb-2 flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary cursor-pointer"><ChevronLeft className="h-4 w-4" />Back</button>}
      <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-text-primary"><ShieldCheck className="h-5 w-5 text-accent-purple" />Admin console</h1>
      <p className="text-sm text-text-secondary">Everything on the platform — all clubs and all users.</p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Card className="flex items-center gap-2"><Building2 className="h-5 w-5 text-accent-blue" /><div><p className="text-lg font-extrabold text-text-primary">{clubs.data?.length ?? '—'}</p><p className="text-[11px] text-text-muted">Clubs</p></div></Card>
        <Card className="flex items-center gap-2"><Users className="h-5 w-5 text-accent-emerald" /><div><p className="text-lg font-extrabold text-text-primary">{users.data?.length ?? '—'}</p><p className="text-[11px] text-text-muted">Users</p></div></Card>
      </div>

      <AdminEconomy />

      <AdminLeaderboard />

      <Section title="FT slate (operator)" action={<Btn size="sm" onClick={() => setAddOpen(true)}><Plus className="h-3.5 w-3.5" />Add a final table</Btn>}>
        <p className="mb-2 text-[11px] text-text-muted">The priced final tables hosts can run. You supply players &amp; stacks; the app computes each ICM draft price. Hosts only review &amp; host — <span className="text-text-secondary">players never see this slate.</span></p>
        {fts.isLoading ? <Spinner /> : (
          <div className="flex flex-col gap-2">
            {fts.data?.map((f) => (
              <Card key={f.id} className="p-3">
                <div className="flex items-center gap-2 text-[11px] text-text-muted"><Badge tone="purple">{f.room}</Badge>{f.date}<span className="ml-auto flex items-center gap-1"><Clock className="h-3 w-3" />{f.startsIn}</span></div>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-text-primary"><Target className="h-4 w-4 text-accent-purple" />{f.name}</p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-text-muted"><span className="flex items-center gap-1"><Trophy className="h-3 w-3 text-accent-amber" />{f.prizePool} Stakes</span><span>· {f.players.length} finalists · ICM ✓</span></div>
              </Card>
            ))}
          </div>
        )}
      </Section>

      <Section title="All clubs">
        {clubs.isLoading ? <Spinner /> : (
          <div className="flex flex-col gap-2">
            {clubs.data?.map((c) => {
              const m = c.members.filter((x) => x.status === 'member').length
              const p = c.members.filter((x) => x.status === 'pending').length
              return (
                <Card key={c.id} onClick={() => navigate(`/club/${c.id}`)} className="flex items-center gap-3 p-3">
                  <Avatar emoji={c.emoji} color={c.color} size={38} />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-text-primary">{c.name}</p><p className="truncate text-xs text-text-muted">{c.ownerName} · code {c.inviteCode}</p></div>
                  <div className="text-right text-xs text-text-muted">{m} members{p ? <span className="text-accent-amber"> · {p} pending</span> : null}</div>
                </Card>
              )
            })}
          </div>
        )}
      </Section>

      <Section title="All users">
        {users.isLoading ? <Spinner /> : (
          <div className="flex flex-col gap-1.5">
            {users.data?.map((u) => (
              <div key={u.id} className="flex items-center gap-2.5 rounded-xl border border-border bg-bg-card px-3 py-2">
                <button onClick={() => navigate(`/member/${u.id}`)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left cursor-pointer">
                  <Avatar name={u.name} color={u.avatarColor} size={30} />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm text-text-primary">{u.name}</p><p className="truncate text-[11px] text-text-muted">{u.email}{u.location ? ` · ${u.location}` : ''}</p></div>
                </button>
                <Badge tone={roleTone[u.role]}>{u.role}</Badge>
              </div>
            ))}
          </div>
        )}
      </Section>

      <CreateFTSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  )
}
