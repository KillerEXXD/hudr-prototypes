import { useState } from 'react'
import { Palette, LogOut, ShieldCheck, Crown, User as UserIcon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, Badge, Btn, Sheet } from '@/components/common/ui'
import { SkinPicker } from '@/components/common/SkinPicker'
import type { AccountRole } from '@/types'

const ROLE_META: Record<AccountRole, { label: string; tone: 'purple' | 'green' | 'blue'; icon: typeof UserIcon }> = {
  admin: { label: 'App Admin', tone: 'purple', icon: ShieldCheck },
  host: { label: 'Club Host', tone: 'green', icon: Crown },
  player: { label: 'Player', tone: 'blue', icon: UserIcon },
}

export function Header() {
  const { label } = useTheme()
  const { user, loginAs, logout } = useAuth()
  const [skinOpen, setSkinOpen] = useState(false)
  const [acctOpen, setAcctOpen] = useState(false)
  if (!user) return null
  const role = ROLE_META[user.role]

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg-secondary/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="text-lg font-extrabold tracking-tight text-text-primary">🃏 ClubR</span>
        <Badge tone={role.tone}><role.icon className="h-3 w-3" />{role.label}</Badge>
      </div>
      <div className="flex items-center gap-1.5">
        <button onClick={() => setSkinOpen(true)} className="flex items-center gap-1.5 rounded-full border border-border bg-bg-card px-2.5 py-1.5 text-xs font-semibold text-text-secondary hover:bg-bg-surface cursor-pointer" aria-label="Change appearance">
          <Palette className="h-3.5 w-3.5 text-accent-blue" /> <span>{label}</span>
        </button>
        <button onClick={() => setAcctOpen(true)} aria-label="Account"><Avatar name={user.name} color={user.avatarColor} size={32} /></button>
      </div>

      <Sheet open={skinOpen} onClose={() => setSkinOpen(false)} title="Appearance — 6 skins">
        <p className="mb-3 text-xs text-text-muted">Same theme system as the HUDR prototypes. Your pick is saved.</p>
        <SkinPicker />
      </Sheet>

      <Sheet open={acctOpen} onClose={() => setAcctOpen(false)} title="Account">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-bg-surface/50 p-3">
          <Avatar name={user.name} color={user.avatarColor} size={44} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-text-primary">{user.name}</p>
            <p className="truncate text-xs text-text-muted">{user.email}</p>
          </div>
          <Badge tone={role.tone} className="ml-auto"><role.icon className="h-3 w-3" />{role.label}</Badge>
        </div>
        <p className="mt-4 mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">Switch demo account</p>
        <div className="grid grid-cols-3 gap-2">
          {(['admin', 'host', 'player'] as AccountRole[]).map((r) => {
            const m = ROLE_META[r]
            return (
              <button key={r} onClick={() => { loginAs(r); setAcctOpen(false) }} className="flex flex-col items-center gap-1 rounded-xl border border-border bg-bg-card p-2.5 text-xs font-semibold text-text-secondary hover:bg-bg-surface cursor-pointer">
                <m.icon className="h-4 w-4 text-accent-blue" />{m.label}
              </button>
            )
          })}
        </div>
        <Btn variant="danger" className="mt-4 w-full" onClick={() => { logout(); setAcctOpen(false) }}><LogOut className="h-4 w-4" /> Sign out</Btn>
      </Sheet>
    </header>
  )
}
