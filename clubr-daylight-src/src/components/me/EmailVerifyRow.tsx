import { MailCheck, MailWarning } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Badge, Btn } from '@/components/common/ui'
import type { User } from '@/types'

/**
 * Email + verification status, rendered as a divider row INSIDE the profile
 * card (no longer a separate card). Verified → a tick + the address; otherwise
 * an 'Unverified' badge + a Verify button.
 */
export function EmailVerifyRow({ user }: { user: User }) {
  const { verifyEmail } = useAuth()
  if (!user.email) return null

  if (user.emailVerified) {
    return (
      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-sm">
        <MailCheck className="h-4 w-4 text-accent-emerald" /><span className="text-text-secondary">Email verified</span>
        <span className="ml-auto truncate text-xs text-text-muted">{user.email}</span>
      </div>
    )
  }

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex items-center gap-2">
        <MailWarning className="h-4 w-4 text-accent-amber" />
        <span className="text-sm text-text-secondary">Email</span>
        <Badge tone="amber">Unverified</Badge>
        <Btn size="sm" variant="secondary" className="ml-auto" onClick={verifyEmail}>Verify</Btn>
      </div>
      <p className="mt-1 truncate text-xs text-text-muted">{user.email}</p>
    </div>
  )
}
