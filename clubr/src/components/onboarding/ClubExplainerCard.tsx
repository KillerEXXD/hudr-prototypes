import { useState } from 'react'
import { ChevronDown, ShieldCheck, Users, Search, Crown, Ticket, Link2 } from 'lucide-react'
import { HowItWorks, type HowStep } from '@/components/common/HowItWorks'
import { cn } from '@/lib/utils/cn'

// What a club is + how to get into one. Drives the cold-start hub's first card —
// games only run inside a club, so a brand-new user needs this before the games.
const CLUB_STEPS: HowStep[] = [
  { icon: Users, title: 'A club is your crew', body: 'Every game — FT Fantasy, Last Longer, Squares — is played inside a club. No club, no games.' },
  { icon: Search, title: 'Join one', body: 'Request a club from the list above, or paste an invite code. The host reviews it and admits you.' },
  { icon: Crown, title: 'Or be the host', body: 'Create your own club, invite your friends, and run games for your crew. Tap the + button (bottom-right) to create one.' },
  { icon: Ticket, title: 'Invite link', body: 'A host can share a club link — tap it and you go straight to requesting to join that club.' },
  { icon: Link2, title: 'Game link', body: 'Shared a specific game? Tapping its link drops you right into it — and into the club too, if you’re not already in.' },
]

/**
 * "How a club works" — the foundational explainer above THE GAMES on the cold-start
 * hub. Tap-to-expand (matches the game cards). No create button of its own; the
 * floating Create-a-club CTA is the single host door (see FloatingCreateClubButton).
 *
 * Accordion: pass `open` + `onToggle` to coordinate with the game cards (one card
 * open at a time across the whole hub); omit them for standalone uncontrolled use.
 */
export function ClubExplainerCard({ open: openProp, onToggle }: { open?: boolean; onToggle?: () => void } = {}) {
  const [openSelf, setOpenSelf] = useState(false)
  const open = openProp ?? openSelf
  const toggle = onToggle ?? (() => setOpenSelf((o) => !o))
  return (
    <div className="overflow-hidden rounded-2xl border border-accent-blue/30">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-bg-surface/40 cursor-pointer"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-blue text-white">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-extrabold text-text-primary">How a club works</span>
          <span className="mt-0.5 block truncate text-[11px] text-text-muted">Why you need one — and how to get in</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-text-muted">
          {open ? 'Hide' : 'Learn more'}
          <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
        </span>
      </button>
      {open && (
        <div className="border-t border-border/60 bg-bg-card/40 px-3.5 py-3.5">
          <HowItWorks steps={CLUB_STEPS} dotBg="bg-accent-blue" iconColor="text-accent-blue" />
        </div>
      )}
    </div>
  )
}
