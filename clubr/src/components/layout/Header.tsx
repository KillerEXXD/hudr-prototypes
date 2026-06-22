import { useNavigate, useLocation } from 'react-router-dom'
import { ShieldCheck, Crown, User as UserIcon, Coins, HelpCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useWallet } from '@/hooks/credits'
import { Avatar, Badge } from '@/components/common/ui'
import { LogoLockup } from '@/components/common/LogoMark'
import { NotificationBell } from '@/components/layout/NotificationBell'
import type { AccountRole } from '@/types'

const ROLE_META: Record<AccountRole, { label: string; tone: 'purple' | 'green' | 'blue'; icon: typeof UserIcon }> = {
  admin: { label: 'App Admin', tone: 'purple', icon: ShieldCheck },
  host: { label: 'Club Host', tone: 'green', icon: Crown },
  player: { label: 'Player', tone: 'blue', icon: UserIcon },
}

export function Header() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: wallet } = useWallet()
  if (!user) return null
  const onMe = location.pathname === '/me'
  const role = ROLE_META[user.role]

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg-secondary/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <LogoLockup size={22} />
        <Badge tone={role.tone}><role.icon className="h-3 w-3" />{role.label}</Badge>
      </div>
      <div className="flex items-center gap-1.5">
        {user.role !== 'admin' && (
          <button onClick={() => navigate('/wallet')} className="flex items-center gap-1 rounded-full border border-accent-amber/40 bg-accent-amber/10 px-2.5 py-1.5 text-xs font-bold text-accent-amber hover:bg-accent-amber/20 cursor-pointer" aria-label="Wallet" title="Your credits">
            <Coins className="h-3.5 w-3.5" /><span className="font-mono">{(wallet?.balance ?? 0).toLocaleString()}</span>
          </button>
        )}
        <button onClick={() => navigate('/how-games-work')} aria-label="Help" title="How the games work" className="rounded-full p-1.5 text-text-secondary hover:bg-bg-surface cursor-pointer">
          <HelpCircle className="h-5 w-5" />
        </button>
        <NotificationBell />
        {/* The avatar is a shortcut to the account home (the "Me" tab) — not a
            second account surface. The demo account-switcher lives on /me. */}
        <button onClick={() => onMe ? navigate(-1) : navigate('/me')} aria-label={onMe ? 'Close account' : 'Your account'} title={onMe ? 'Close account' : 'Your account'} aria-pressed={onMe}><Avatar name={user.name} color={user.avatarColor} size={32} /></button>
      </div>
    </header>
  )
}
