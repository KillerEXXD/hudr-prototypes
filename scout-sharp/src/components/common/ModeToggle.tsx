import { MessageCircle, BarChart3 } from 'lucide-react'
import { useMode } from '@/contexts/ModeContext'
import { cn } from '@/lib/utils'

// Animated segmented control: Plain English ⇆ Pro Stats.
// Sliding active pill (transform-based), dark glassy track.
export default function ModeToggle({ className }: { className?: string }) {
  const { mode, setMode } = useMode()
  const isPro = mode === 'pro'
  return (
    <div
      className={cn(
        'relative inline-grid grid-cols-2 rounded-full border border-border bg-bg-card/80 p-0.5 backdrop-blur select-none',
        className,
      )}
      role="tablist"
      aria-label="Analysis detail level"
    >
      <span
        aria-hidden
        className="absolute inset-y-0.5 w-[calc(50%-2px)] rounded-full bg-accent-blue shadow-lg shadow-accent-blue/30 transition-transform duration-300 ease-out"
        style={{ transform: isPro ? 'translateX(100%)' : 'translateX(0)' }}
      />
      <button
        role="tab"
        aria-selected={!isPro}
        onClick={() => setMode('plain')}
        className={cn(
          'relative z-10 flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-200 cursor-pointer',
          !isPro ? 'text-white' : 'text-text-muted hover:text-text-secondary',
        )}
      >
        <MessageCircle className="h-3.5 w-3.5" /> Amateur
      </button>
      <button
        role="tab"
        aria-selected={isPro}
        onClick={() => setMode('pro')}
        className={cn(
          'relative z-10 flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-200 cursor-pointer',
          isPro ? 'text-white' : 'text-text-muted hover:text-text-secondary',
        )}
      >
        <BarChart3 className="h-3.5 w-3.5" /> Pro
      </button>
    </div>
  )
}
