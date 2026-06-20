import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/**
 * The single, consistent "How game works" pill. Lives in each game's detail-page
 * header (next to the status badge) for FT Fantasy, Last Longer & Squares, so
 * the affordance looks and sits identically everywhere. Opens that game's
 * step-by-step walkthrough sheet via `onClick`.
 */
export function HowItWorksButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer', className)}
    >
      <HelpCircle className="h-3.5 w-3.5" />How game works
    </button>
  )
}
