import { LayoutDashboard, ChevronRight, ExternalLink } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/common/ui'
import { PLAYER_IDS, userName, userColor } from '@/data/referralStore'

const BLURB: Record<string, string> = {
  u_alice: 'Top referrer — full downline (direct + residual)',
  u_ben: 'Referred by Alice — has his own referrals',
  u_dana: 'Referred by Alice — one sub-referral',
  u_fresh: 'Fresh player — no referrals yet (empty state)',
}

export function ReferralLogin() {
  const { loginAs } = useAuth()
  return (
    <div className="min-h-dvh bg-bg-primary text-text-primary">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
        <div className="mb-6 text-center">
          <div className="text-4xl">🎁</div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight">ClubrGo Referrals</h1>
          <p className="mt-1 text-sm text-text-muted">Interactive prototype · pick a demo identity to explore both sides.</p>
        </div>

        <div className="space-y-2">
          <div className="px-1 text-[11px] font-bold uppercase tracking-wide text-text-muted">Players</div>
          {PLAYER_IDS.map((id) => (
            <button key={id} type="button" onClick={() => loginAs('member', id)} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-bg-card px-3 py-3 text-left transition-colors hover:bg-bg-surface cursor-pointer">
              <Avatar name={userName(id)} color={userColor(id)} size={40} />
              <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{userName(id)}</div><div className="truncate text-xs text-text-muted">{BLURB[id]}</div></div>
              <ChevronRight className="h-4 w-4 text-text-muted" />
            </button>
          ))}
          <div className="px-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-text-muted">Admin</div>
          <button type="button" onClick={() => loginAs('admin', 'u_admin')} className="flex w-full items-center gap-3 rounded-2xl border border-accent-purple/30 bg-accent-purple/10 px-3 py-3 text-left transition-colors hover:bg-accent-purple/15 cursor-pointer">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-purple text-white"><LayoutDashboard className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1"><div className="text-sm font-bold">Master dashboard</div><div className="text-xs text-text-muted">Config, every player, payouts, reverse</div></div>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </button>
        </div>

        <a href="/clubr-referral/" target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-1.5 text-xs font-semibold text-accent-blue hover:underline">
          Read the how-it-works explainer <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  )
}
