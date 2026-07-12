import { cn } from '@/lib/utils/cn'

/**
 * The small top-right corner dot that marks the "Live" affordance (bottom-nav Live
 * tab + the Live/Finished pills). When something is actually in progress it's the
 * classic live-stream dot — a solid red core with an expanding `animate-ping` ring
 * and a soft glow. Otherwise it rests as a single static elephant-grey dot, so the
 * corner-dot slot stays consistent (Finished is always this calm grey).
 *
 * `motion-reduce` collapses the ping to a steady dot for reduced-motion users.
 */
export function LiveDot({ live, className }: { live: boolean; className?: string }) {
  if (!live) {
    return <span className={cn('block h-2 w-2 rounded-full bg-text-muted', className)} aria-hidden />
  }
  return (
    <span className={cn('relative block h-2 w-2', className)} aria-hidden>
      <span className="absolute inset-0 rounded-full bg-accent-red opacity-75 motion-safe:animate-ping motion-reduce:hidden" />
      <span className="relative block h-2 w-2 rounded-full bg-accent-red shadow-[0_0_6px_rgba(239,68,68,0.85)]" />
    </span>
  )
}
