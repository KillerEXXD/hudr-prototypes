import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, ShieldCheck, Crown, User as UserIcon, Coins } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useWallet } from '@/hooks/credits'
import { Avatar, Badge, Btn, Sheet } from '@/components/common/ui'
import type { AccountRole } from '@/types'

const ROLE_META: Record<AccountRole, { label: string; tone: 'purple' | 'green' | 'blue'; icon: typeof UserIcon }> = {
  admin: { label: 'App Admin', tone: 'purple', icon: ShieldCheck },
  host: { label: 'Club Host', tone: 'green', icon: Crown },
  player: { label: 'Player', tone: 'blue', icon: UserIcon },
}

// Demo-account quick-switch — roles plus the two real-data club hosts.
const SWITCH: { role: AccountRole; userId?: string; label: string; icon: typeof UserIcon }[] = [
  { role: 'player', label: 'Player', icon: UserIcon },
  { role: 'host', label: 'Aces High Host', icon: Crown },
  { role: 'host', userId: 'u_cc_host', label: 'Bayou City Poker Club Host', icon: Crown },
  { role: 'host', userId: 'u_tch_host', label: 'Gulf Coast Card Club Host', icon: Crown },
  { role: 'admin', label: 'App Admin', icon: ShieldCheck },
]

export function Header() {
  const { user, loginAs, logout } = useAuth()
  const navigate = useNavigate()
  const { data: wallet } = useWallet()
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
        {user.role !== 'admin' && (
          <button onClick={() => navigate('/wallet')} className="flex items-center gap-1 rounded-full border border-accent-amber/40 bg-accent-amber/10 px-2.5 py-1.5 text-xs font-bold text-accent-amber hover:bg-accent-amber/20 cursor-pointer" aria-label="Wallet" title="Your credits">
            <Coins className="h-3.5 w-3.5" /><span className="font-mono">{(wallet?.balance ?? 0).toLocaleString()}</span>
          </button>
        )}
        <button onClick={() => setAcctOpen(true)} aria-label="Account"><Avatar name={user.name} color={user.avatarColor} size={32} /></button>
      </div>

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
        <div className="grid grid-cols-2 gap-2">
          {SWITCH.map((s) => (
            <button key={s.label} onClick={() => { loginAs(s.role, s.userId); setAcctOpen(false); navigate('/') }} className="flex flex-col items-center gap-1 rounded-xl border border-border bg-bg-card p-2.5 text-center text-xs font-semibold text-text-secondary hover:bg-bg-surface cursor-pointer">
              <s.icon className="h-4 w-4 text-accent-blue" />{s.label}
            </button>
          ))}
        </div>
        <Btn variant="danger" className="mt-4 w-full" onClick={() => { logout(); setAcctOpen(false) }}><LogOut className="h-4 w-4" /> Sign out</Btn>
      </Sheet>
    </header>
  )
}
