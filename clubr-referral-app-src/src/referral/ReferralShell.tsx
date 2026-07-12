import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Gift, Calculator, Banknote, LayoutDashboard, Users, Wallet, SlidersHorizontal, ChevronDown, ExternalLink } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, Sheet } from '@/components/common/ui'
import { cn } from '@/lib/utils/cn'
import { PLAYER_IDS, userName, userColor } from '@/data/referralStore'

const PLAYER_NAV = [
  { to: '/referrals', label: 'Referrals', Icon: Gift },
  { to: '/referrals/projector', label: 'Projector', Icon: Calculator },
  { to: '/referrals/withdraw', label: 'Withdraw', Icon: Banknote },
]
const ADMIN_NAV = [
  { to: '/admin', label: 'Overview', Icon: LayoutDashboard },
  { to: '/admin/players', label: 'Players', Icon: Users },
  { to: '/admin/withdrawals', label: 'Payouts', Icon: Wallet },
  { to: '/admin/config', label: 'Config', Icon: SlidersHorizontal },
]

export function ReferralShell() {
  const { user, realRole, loginAs } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [switcher, setSwitcher] = useState(false)
  const isAdmin = realRole === 'admin'
  const items = isAdmin ? ADMIN_NAV : PLAYER_NAV
  const active = (to: string) => (to === '/referrals' || to === '/admin' ? loc.pathname === to : loc.pathname.startsWith(to))

  const switchTo = (role: 'admin' | 'member', id?: string) => { loginAs(role, id); setSwitcher(false); nav(role === 'admin' ? '/admin' : '/referrals') }

  return (
    <div className="min-h-dvh bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-bg-primary/85 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
          <span className="text-lg">🎁</span>
          <span className="font-extrabold tracking-tight">ClubrGo <span className="text-text-muted font-semibold">Referrals</span></span>
          {isAdmin && <span className="ml-1 rounded-full bg-accent-purple/15 px-2 py-0.5 text-[10px] font-bold text-accent-purple">ADMIN</span>}
          <button onClick={() => setSwitcher(true)} className="ml-auto flex items-center gap-2 rounded-full border border-border bg-bg-surface py-1 pl-1 pr-2.5 text-sm font-semibold transition-colors hover:bg-bg-elevated cursor-pointer">
            <Avatar name={user?.name} color={user?.avatarColor} pic={user?.avatarUrl} size={26} />
            <span className="max-w-[92px] truncate">{user?.name?.split(' ')[0]}</span>
            <ChevronDown className="h-4 w-4 text-text-muted" />
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-2xl px-4 pb-28 pt-4">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg-primary/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-2xl items-stretch justify-around px-2">
          {items.map(({ to, label, Icon }) => (
            <button key={to} onClick={() => nav(to)} className={cn('flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors cursor-pointer', active(to) ? 'text-accent-blue' : 'text-text-muted hover:text-text-secondary')}>
              <Icon className="h-5 w-5" strokeWidth={active(to) ? 2.6 : 2} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Identity switcher */}
      <Sheet open={switcher} onClose={() => setSwitcher(false)} title="Switch demo identity">
        <p className="mb-3 text-xs text-text-muted">Jump between players and the admin to see every side of the program.</p>
        <div className="space-y-2">
          {PLAYER_IDS.map((id) => (
            <button key={id} onClick={() => switchTo('member', id)} className="flex w-full items-center gap-3 rounded-xl border border-border bg-bg-surface px-3 py-2.5 text-left transition-colors hover:bg-bg-elevated cursor-pointer">
              <Avatar name={userName(id)} color={userColor(id)} size={34} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{userName(id)}</div>
                <div className="text-xs text-text-muted">{id === 'u_alice' ? 'Top referrer · full downline' : id === 'u_ben' ? 'Referred by Alice · has own referrals' : id === 'u_dana' ? 'Referred by Alice · one sub-referral' : 'Fresh player · no referrals yet'}</div>
              </div>
            </button>
          ))}
          <button onClick={() => switchTo('admin', 'u_admin')} className="flex w-full items-center gap-3 rounded-xl border border-accent-purple/30 bg-accent-purple/10 px-3 py-2.5 text-left transition-colors hover:bg-accent-purple/15 cursor-pointer">
            <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-accent-purple text-white"><LayoutDashboard className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1"><div className="text-sm font-bold">Admin · Master dashboard</div><div className="text-xs text-text-muted">Config, every player, payouts</div></div>
          </button>
        </div>
        <a href="/clubr-referral/" target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-accent-blue hover:underline">
          Open the how-it-works explainer <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </Sheet>
    </div>
  )
}
