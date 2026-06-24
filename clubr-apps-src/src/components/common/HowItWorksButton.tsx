import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/**
 * The single, consistent "How it works" help affordance — a "?" that sits
 * next to the game-type title in each game-app's detail header. Soft pulse
 * + accent-blue so new users notice it without it shouting. Opens that
 * game's step-by-step walkthrough sheet via `onClick`.
 *
 * Mirrors C:\Apps\Clubr\app\src\components\common\HowItWorksButton.tsx so
 * the affordance is identical across both prototypes and the live app.
 */
export function HowItWorksButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="How this game works"
      title="How this game works"
      className={cn('inline-flex items-center justify-center text-accent-blue hover:text-accent-blue-deep cursor-pointer animate-pulse motion-reduce:animate-none', className)}
    >
      <HelpCircle className="h-5 w-5" />
    </button>
  )
}
