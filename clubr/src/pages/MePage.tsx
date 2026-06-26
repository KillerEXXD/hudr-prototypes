import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Crown, User as UserIcon, LogOut, ChevronRight, Palette, Coins, Pencil, MapPin, GalleryHorizontalEnd, Camera, Check, Ban } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useWallet } from '@/hooks/credits'
import { Avatar, Badge, Btn, Card, Section, Sheet, Field } from '@/components/common/ui'
import { CityField } from '@/components/common/CityField'
import { SkinPicker } from '@/components/common/SkinPicker'
import { AVATAR_POOL } from '@/data/store'
import type { AccountRole, User } from '@/types'
import { EmailVerifyRow } from '@/components/me/EmailVerifyRow'

const ROLE_META: Record<AccountRole, { label: string; tone: 'purple' | 'green' | 'blue'; icon: typeof UserIcon }> = {
  admin: { label: 'Admin', tone: 'purple', icon: ShieldCheck },
  owner: { label: 'Owner', tone: 'green', icon: Crown },
  member: { label: 'Member', tone: 'blue', icon: UserIcon },
}

// Demo-account quick-switch — roles plus the real-data club hosts. (Prototype
// only: the gallery lets reviewers explore each role. Lives on /me so the app
// has one account home; the header avatar is just a shortcut here.)
const SWITCH: { role: AccountRole; userId?: string; label: string; icon: typeof UserIcon }[] = [
  { role: 'member', label: 'Member', icon: UserIcon },
  { role: 'owner', label: 'Aces High Owner', icon: Crown },
  { role: 'owner', userId: 'u_cc_host', label: 'Bayou City Poker Club Owner', icon: Crown },
  { role: 'owner', userId: 'u_tch_host', label: 'Gulf Coast Card Club Owner', icon: Crown },
  { role: 'admin', label: 'App Admin', icon: ShieldCheck },
]


/** Edit the signed-in user's name + email. Changing the email marks it unverified. */
function EditProfileSheet({ open, onClose, user }: { open: boolean; onClose: () => void; user: User }) {
  const { updateProfile } = useAuth()
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [city, setCity] = useState(user.location ?? '')
  const [err, setErr] = useState('')
  useEffect(() => { if (open) { setName(user.name); setEmail(user.email); setCity(user.location ?? ''); setErr('') } }, [open, user.name, user.email, user.location])
  const emailChanged = email.trim().toLowerCase() !== (user.email ?? '').toLowerCase()
  function save() {
    if (!name.trim()) { setErr('Name is required'); return }
    if (!/.+@.+\..+/.test(email.trim())) { setErr('Enter a valid email'); return }
    updateProfile({ name, email, city })
    onClose()
  }
  return (
    <Sheet open={open} onClose={onClose} title="Edit profile">
      <div className="flex flex-col gap-3">
        <Field label="Name" value={name} onChange={(v) => { setName(v); setErr('') }} placeholder="Your name" />
        <Field label="Email" value={email} onChange={(v) => { setEmail(v); setErr('') }} type="email" placeholder="you@example.com" />
        <CityField label="City" value={city} onChange={(v) => { setCity(v); setErr('') }} />
        {emailChanged && <p className="text-[11px] leading-snug text-accent-amber">Changing your email marks it unverified — you'll need to verify the new address.</p>}
        {err && <p className="text-xs font-semibold text-accent-red">{err}</p>}
        <Btn className="w-full" onClick={save}>Save changes</Btn>
      </div>
    </Sheet>
  )
}

/** Pick a profile picture from a fun set — or choose "No photo" to keep initials. */
function AvatarPickerSheet({ open, onClose, user }: { open: boolean; onClose: () => void; user: User }) {
  const { setAvatar } = useAuth()
  // The curated 3-D avatar pack, plus the "none" (initials) option.
  const options = AVATAR_POOL
  const choose = (url: string | null) => { setAvatar(url); onClose() }
  return (
    <Sheet open={open} onClose={onClose} title="Profile picture">
      <p className="mb-3 text-xs text-text-muted">Pick a picture, or choose <b className="text-text-primary">No photo</b> to show your initials.</p>
      <div className="grid grid-cols-4 gap-3">
        {/* No photo → initials */}
        <button type="button" onClick={() => choose(null)}
          className={`relative flex flex-col items-center gap-1 rounded-xl p-0.5 cursor-pointer ${!user.avatarUrl ? 'ring-2 ring-accent-blue' : 'ring-1 ring-transparent'}`}>
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-bg-surface text-text-muted"><Ban className="h-5 w-5" /></span>
          <span className="text-[10px] text-text-muted">None</span>
          {!user.avatarUrl && <Check className="absolute right-0 top-0 h-4 w-4 rounded-full bg-accent-blue p-0.5 text-white" />}
        </button>
        {options.map((url) => {
          const on = user.avatarUrl === url
          return (
            <button key={url} type="button" onClick={() => choose(url)}
              className={`relative rounded-xl p-0.5 cursor-pointer ${on ? 'ring-2 ring-accent-blue' : 'ring-1 ring-transparent'}`}>
              <Avatar name={user.name} pic={url} size={56} />
              {on && <Check className="absolute right-0 top-0 h-4 w-4 rounded-full bg-accent-blue p-0.5 text-white" />}
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}

export function MePage() {
  const { user, realRole, actAs, logout, loginAs } = useAuth()
  const navigate = useNavigate()
  const wallet = useWallet()
  const [editOpen, setEditOpen] = useState(false)
  const [photoOpen, setPhotoOpen] = useState(false)
  if (!user) return null
  const role = ROLE_META[user.role]

  return (
    <div className="animate-fade-up">
      <h1 className="text-xl font-extrabold tracking-tight text-text-primary">Me</h1>

      <Card className="mt-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setPhotoOpen(true)} className="relative shrink-0 cursor-pointer" aria-label="Change profile picture">
            <Avatar name={user.name} color={user.avatarColor} pic={user.avatarUrl} size={52} />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent-blue text-white ring-2 ring-bg-card"><Camera className="h-3 w-3" /></span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-text-primary">{user.name}</p>
            {user.location && (
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-text-muted">
                <MapPin className="h-3 w-3 shrink-0" />{user.location}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <button type="button" onClick={() => setEditOpen(true)} className="flex items-center gap-1 text-xs font-semibold text-accent-blue hover:underline cursor-pointer"><Pencil className="h-3 w-3" />Edit</button>
            <Badge tone={role.tone}><role.icon className="h-3 w-3" />{role.label}</Badge>
          </div>
        </div>
        <EmailVerifyRow user={user} />
      </Card>
      <EditProfileSheet open={editOpen} onClose={() => setEditOpen(false)} user={user} />
      <AvatarPickerSheet open={photoOpen} onClose={() => setPhotoOpen(false)} user={user} />

      {/* App Admin ONLY: view the app as any role. Gated on the REAL role so it stays
          visible while acting as Host/Player. Changes the view, not your permissions. */}
      {realRole === 'admin' && (
        <Section title="Acting as" action={<span className="text-[11px] text-text-muted">App Admin only</span>}>
          <div className="grid grid-cols-3 gap-2">
            {(['admin', 'owner', 'member'] as AccountRole[]).map((r) => {
              const m = ROLE_META[r]
              const active = user.role === r
              return (
                <button key={r} type="button" onClick={() => actAs(r)} aria-pressed={active}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-xs font-semibold transition-colors cursor-pointer ${active ? 'border-accent-blue bg-accent-blue/10 text-accent-blue' : 'border-border bg-bg-card text-text-secondary hover:bg-bg-surface'}`}>
                  <m.icon className="h-4 w-4" />{m.label}
                </button>
              )
            })}
          </div>
          <p className="mt-1.5 text-[10px] leading-snug text-text-muted">Switch your view between App Admin, Owner and Member. Only you see this — it changes what you see, not your permissions.</p>
        </Section>
      )}

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

      <Section title="Prototype">
        <Card onClick={() => navigate('/carousel-lab')} className="flex items-center gap-3">
          <GalleryHorizontalEnd className="h-5 w-5 text-accent-blue" />
          <div className="flex-1"><p className="text-sm font-bold text-text-primary">Carousel Lab</p><p className="text-xs text-text-muted">Compare carousel styles · pick the one you like</p></div>
          <ChevronRight className="h-4 w-4 text-text-muted" />
        </Card>
      </Section>

      {user.role === 'admin' && (
        <Section title="App administration">
          <Card onClick={() => navigate('/admin')} className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-accent-purple" />
            <div className="flex-1"><p className="text-sm font-bold text-text-primary">Admin console</p><p className="text-xs text-text-muted">All clubs &amp; all users</p></div>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </Card>
        </Section>
      )}

      <Section title="Appearance" action={<Palette className="h-4 w-4 text-text-muted" />}>
        <SkinPicker onSelect={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} />
      </Section>

      <Section title="Switch demo account">
        <div className="grid grid-cols-2 gap-2">
          {SWITCH.map((s) => (
            <button key={s.label} onClick={() => { loginAs(s.role, s.userId); navigate('/') }} className="flex flex-col items-center gap-1 rounded-xl border border-border bg-bg-card p-2.5 text-center text-xs font-semibold text-text-secondary hover:bg-bg-surface cursor-pointer">
              <s.icon className="h-4 w-4 text-accent-blue" />{s.label}
            </button>
          ))}
        </div>
      </Section>

      <Btn variant="danger" className="mt-5 w-full" onClick={logout}><LogOut className="h-4 w-4" />Sign out</Btn>
      <p className="mt-4 text-center text-[11px] text-text-muted">ClubR prototype · mock data behind a swappable services layer</p>
    </div>
  )
}
