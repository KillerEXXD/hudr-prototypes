import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Crown, User as UserIcon, LogOut, ChevronRight, Palette, Coins, MailCheck, MailWarning, Pencil } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useMyClubs } from '@/hooks'
import { useWallet } from '@/hooks/credits'
import { Avatar, Badge, Btn, Card, Section, Spinner, Sheet, Field } from '@/components/common/ui'
import { SkinPicker } from '@/components/common/SkinPicker'
import type { AccountRole, User } from '@/types'

const ROLE_META: Record<AccountRole, { label: string; tone: 'purple' | 'green' | 'blue'; icon: typeof UserIcon }> = {
  admin: { label: 'App Admin', tone: 'purple', icon: ShieldCheck },
  host: { label: 'Club Host', tone: 'green', icon: Crown },
  player: { label: 'Player', tone: 'blue', icon: UserIcon },
}

/** Email row: a verified tick, or an 'Unverified' badge + a Verify button. */
function EmailVerifyCard({ user }: { user: User }) {
  const { verifyEmail } = useAuth()
  if (!user.email) return null
  if (user.emailVerified) {
    return (
      <Card className="mt-3 flex items-center gap-2 py-2.5 text-sm">
        <MailCheck className="h-4 w-4 text-accent-emerald" /><span className="text-text-secondary">Email verified</span>
        <span className="ml-auto truncate text-xs text-text-muted">{user.email}</span>
      </Card>
    )
  }
  return (
    <Card className="mt-3 py-3">
      <div className="flex items-center gap-2">
        <MailWarning className="h-4 w-4 text-accent-amber" />
        <span className="text-sm text-text-secondary">Email</span>
        <Badge tone="amber">Unverified</Badge>
        <Btn size="sm" variant="secondary" className="ml-auto" onClick={verifyEmail}>Verify</Btn>
      </div>
      <p className="mt-1 truncate text-xs text-text-muted">{user.email}</p>
    </Card>
  )
}

/** Edit the signed-in user's name + email. Changing the email marks it unverified. */
function EditProfileSheet({ open, onClose, user }: { open: boolean; onClose: () => void; user: User }) {
  const { updateProfile } = useAuth()
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [err, setErr] = useState('')
  useEffect(() => { if (open) { setName(user.name); setEmail(user.email); setErr('') } }, [open, user.name, user.email])
  const emailChanged = email.trim().toLowerCase() !== (user.email ?? '').toLowerCase()
  function save() {
    if (!name.trim()) { setErr('Name is required'); return }
    if (!/.+@.+\..+/.test(email.trim())) { setErr('Enter a valid email'); return }
    updateProfile({ name, email })
    onClose()
  }
  return (
    <Sheet open={open} onClose={onClose} title="Edit profile">
      <div className="flex flex-col gap-3">
        <Field label="Name" value={name} onChange={(v) => { setName(v); setErr('') }} placeholder="Your name" />
        <Field label="Email" value={email} onChange={(v) => { setEmail(v); setErr('') }} type="email" placeholder="you@example.com" />
        {emailChanged && <p className="text-[11px] leading-snug text-accent-amber">Changing your email marks it unverified — you'll need to verify the new address.</p>}
        {err && <p className="text-xs font-semibold text-accent-red">{err}</p>}
        <Btn className="w-full" onClick={save}>Save changes</Btn>
      </div>
    </Sheet>
  )
}

export function MePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const wallet = useWallet()
  const [editOpen, setEditOpen] = useState(false)
  if (!user) return null
  const role = ROLE_META[user.role]

  return (
    <div className="animate-fade-up">
      <h1 className="text-xl font-extrabold tracking-tight text-text-primary">Me</h1>

      <Card className="mt-3 flex items-center gap-3">
        <Avatar name={user.name} color={user.avatarColor} size={52} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-text-primary">{user.name}</p>
          <p className="truncate text-xs text-text-muted">{user.email}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <button type="button" onClick={() => setEditOpen(true)} className="flex items-center gap-1 text-xs font-semibold text-accent-blue hover:underline cursor-pointer"><Pencil className="h-3 w-3" />Edit</button>
          <Badge tone={role.tone}><role.icon className="h-3 w-3" />{role.label}</Badge>
        </div>
      </Card>

      <EmailVerifyCard user={user} />
      <EditProfileSheet open={editOpen} onClose={() => setEditOpen(false)} user={user} />

      {user.role !== 'admin' && (
        <Section title="Wallet">
          <Card onClick={() => navigate('/wallet')} className="flex items-center gap-3">
            <Coins className="h-5 w-5 text-accent-amber" />
            <div className="flex-1"><p className="text-sm font-bold text-text-primary">Credits</p><p className="text-xs text-text-muted">Buy credits · transaction history</p></div>
            <span className="font-mono text-sm font-bold text-accent-amber">{(wallet.data?.balance ?? 0).toLocaleString()}</span>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </Card>
        </Section>
      )}

      {user.role === 'admin' && (
        <Section title="App administration">
          <Card onClick={() => navigate('/admin')} className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-accent-purple" />
            <div className="flex-1"><p className="text-sm font-bold text-text-primary">Admin console</p><p className="text-xs text-text-muted">All clubs &amp; all users</p></div>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </Card>
        </Section>
      )}

      {user.role === 'host' && <HostConsole />}

      <Section title="Appearance" action={<Palette className="h-4 w-4 text-text-muted" />}>
        <SkinPicker onSelect={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} />
      </Section>

      <Btn variant="danger" className="mt-5 w-full" onClick={logout}><LogOut className="h-4 w-4" />Sign out</Btn>
      <p className="mt-4 text-center text-[11px] text-text-muted">ClubR prototype · mock data behind a swappable services layer</p>
    </div>
  )
}

function HostConsole() {
  const navigate = useNavigate()
  const clubs = useMyClubs()
  const owned = clubs.data?.filter((c) => c.canManage) ?? []
  return (
    <Section title="Host console">
      {clubs.isLoading ? <Spinner /> : owned.length === 0 ? (
        <Card className="text-sm text-text-secondary">You don't host any clubs yet. Create one from the <span className="font-semibold text-text-primary">Clubs</span> tab.</Card>
      ) : (
        <div className="flex flex-col gap-2">
          {owned.map((c) => (
            <Card key={c.id} onClick={() => navigate(`/club/${c.id}`)} className="flex items-center gap-3 p-3">
              <Avatar emoji={c.emoji} color={c.color} size={38} />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-text-primary">{c.name}</p><p className="text-xs text-text-muted">{c.members.filter((m) => m.status === 'member').length} members · code {c.inviteCode}</p></div>
              {c.pendingCount > 0 && <Badge tone="amber">{c.pendingCount} pending</Badge>}
            </Card>
          ))}
        </div>
      )}
    </Section>
  )
}
