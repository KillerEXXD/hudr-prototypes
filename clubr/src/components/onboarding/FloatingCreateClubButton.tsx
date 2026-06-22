import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/**
 * The single Create-a-club CTA on the cold-start hub — a floating, gently-pulsing
 * icon puck, built the same way as the table-chat puck (FloatingChat): PORTALED to
 * document.body (the page root's `animate-fade-up` transform would otherwise trap
 * `position: fixed` to the page div, not the viewport), and it HIDES while the page
 * scrolls, reappearing a beat after it settles — so it never blocks the content.
 * Sits bottom-right, below the Feedback puck.
 */
export function FloatingCreateClubButton({ onClick }: { onClick: () => void }) {
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
      aria-label="Create your own club"
      title="Create your own club"
      className={cn(
        'club-cta-pulse fixed bottom-6 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent-blue to-blue-600 text-white ring-2 ring-bg-primary transition-all duration-200 active:scale-95 cursor-pointer',
        scrolling ? 'pointer-events-none translate-y-2 opacity-0' : 'opacity-100',
      )}
    >
      <Plus className="h-6 w-6" strokeWidth={2.6} />
      <style>{`@keyframes clubGlow { 0%,100% { box-shadow: 0 6px 18px -6px rgba(59,130,246,0.5); } 50% { box-shadow: 0 10px 30px -2px rgba(59,130,246,0.9); } }
.club-cta-pulse { animation: clubGlow 2.6s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .club-cta-pulse { animation: none; } }`}</style>
    </button>,
    document.body,
  )
}
