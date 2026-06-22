import { useEffect, useState, type ComponentType } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils/cn'

/**
 * A floating action puck (Create-a-club, Feedback, …) with one consistent shape so
 * the pucks line up. Like the table-chat puck it's PORTALED to document.body (the
 * page root's `animate-fade-up` transform would otherwise trap `position: fixed`),
 * and it HIDES while the page scrolls, reappearing once it settles. Collapsed it's a
 * circular icon; on HOVER it expands leftward into a pill that reveals its label
 * (the icon stays anchored on the right, at `right-4`). Optionally pulses.
 */
export function FloatingPuck({ icon: Icon, label, ariaLabel, onClick, bottomClass = 'bottom-6', pulse = false }: {
  icon: ComponentType<{ className?: string }>
  label: string
  ariaLabel?: string
  onClick: () => void
  bottomClass?: string
  pulse?: boolean
}) {
  const [scrolling, setScrolling] = useState(false)
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const onScroll = () => { setScrolling(true); clearTimeout(t); t = setTimeout(() => setScrolling(false), 240) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(t) }
  }, [])

  return createPortal(
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      title={label}
      className={cn(
        'group fixed right-4 z-40 flex h-14 items-center justify-end rounded-full bg-gradient-to-br from-accent-blue to-blue-600 px-4 text-white shadow-lg ring-2 ring-bg-primary transition-all duration-200 ease-out active:scale-95 cursor-pointer',
        bottomClass,
        pulse && 'floating-puck-pulse',
        scrolling ? 'pointer-events-none translate-y-2 opacity-0' : 'opacity-100',
      )}
    >
      {/* Label reveals on hover, growing the puck leftward; the icon stays anchored right. */}
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-bold opacity-0 transition-all duration-200 group-hover:mr-2 group-hover:max-w-[200px] group-hover:opacity-100">{label}</span>
      <Icon className="h-6 w-6 shrink-0" />
      <style>{`@keyframes puckGlow { 0%,100% { box-shadow: 0 6px 18px -6px rgba(59,130,246,0.5); } 50% { box-shadow: 0 10px 30px -2px rgba(59,130,246,0.9); } }
.floating-puck-pulse { animation: puckGlow 2.6s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .floating-puck-pulse { animation: none; } }`}</style>
    </button>,
    document.body,
  )
}
