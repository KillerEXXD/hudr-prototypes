import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/**
 * The single, consistent "How it works?" help affordance — a calm clickable text
 * link (with a ? ) next to the game-type chip / title on each detail page.
 * Opens that game's step-by-step walkthrough sheet via `onClick`.
 */
export function HowItWorksButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="How this game works"
      title="How this game works"
      className={cn('inline-flex items-center gap-1 text-[11px] font-semibold text-accent-blue hover:text-accent-blue-deep hover:underline cursor-pointer', className)}
    >
      <HelpCircle className="h-3.5 w-3.5" />How it works?
    </button>
  )
}
