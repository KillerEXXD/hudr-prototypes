import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/**
 * The single, consistent "How it works" help affordance — a quiet "?" that sits
 * by the game's title on each detail page (FT Fantasy, Last Longer & Squares), so
 * it looks and sits identically everywhere without competing with the title. Opens
 * that game's step-by-step walkthrough sheet via `onClick`. Pass `className` for
 * per-title baseline alignment.
 */
export function HowItWorksButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="How this game works"
      title="How this game works"
      className={cn('inline-flex text-text-muted hover:text-text-secondary cursor-pointer', className)}
    >
      <HelpCircle className="h-[18px] w-[18px]" />
    </button>
  )
}
