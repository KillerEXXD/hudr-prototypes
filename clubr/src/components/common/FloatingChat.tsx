import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { MessageCircle } from 'lucide-react'
import { Sheet } from './ui'
import { GameChat } from './GameChat'
import { cn } from '@/lib/utils/cn'
import type { ChatMsg } from '@/types/ft'

// Per-game floating chat: a small, subtle bubble (with an unread count) that
// opens the game's conversation in a slide-up sheet. It only ever renders the
// messages it's given — scoped to ONE game (g.chat / c.chat) — so chat never
// crosses between games. Render it with key={gameId} per page so the unread
// count resets on navigation. Sits bottom-RIGHT (Instagram/Messenger DM
// placement) as a solid-blue puck for contrast, and fades out while you scroll
// the list, back in when you stop. Pages that render it add bottom padding so
// the last row's right-side actions never sit under the puck at rest.
export function FloatingChat({ messages, onSend, canSend, currentUserId }: {
  messages: ChatMsg[]; onSend: (text: string) => void; canSend: boolean; currentUserId: string
}) {
  const [open, setOpen] = useState(false)
  const [scrolling, setScrolling] = useState(false)
  const [seen, setSeen] = useState(messages.length)
  // Everything is "seen" whenever the chat is open (and as it grows while open).
  useEffect(() => { if (open) setSeen(messages.length) }, [open, messages.length])
  // Hide while the page scrolls; reappear a beat after it settles.
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const onScroll = () => { setScrolling(true); clearTimeout(t); t = setTimeout(() => setScrolling(false), 240) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(t) }
  }, [])
  // Unread = incoming messages (not your own) since you last had it open.
  const unread = open ? 0 : messages.slice(seen).filter((m) => m.userId !== currentUserId).length

  // One-shot pulse the moment the unread count grows (a new message arrived).
  const [ping, setPing] = useState(false)
  const prevUnread = useRef(unread)
  useEffect(() => {
    if (unread > prevUnread.current) {
      setPing(true)
      const t = setTimeout(() => setPing(false), 1200)
      prevUnread.current = unread
      return () => clearTimeout(t)
    }
    prevUnread.current = unread
  }, [unread])

  return createPortal(
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={unread > 0 ? `Open table chat, ${unread} unread` : 'Open table chat'}
          className={cn(
            'fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent-blue to-blue-600 text-white shadow-lg shadow-accent-blue/30 ring-2 ring-bg-primary transition-all duration-200 active:scale-95 cursor-pointer',
            scrolling ? 'pointer-events-none translate-y-2 opacity-0' : 'opacity-100',
          )}
        >
          {/* brief expanding ring when a new message lands */}
          {ping && <span className="absolute inset-0 rounded-full bg-accent-blue/40 animate-ping" aria-hidden />}
          <MessageCircle className="relative h-[22px] w-[22px]" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent-red px-1 text-[10px] font-extrabold leading-none text-white ring-2 ring-bg-primary">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>
      )}
      <Sheet open={open} onClose={() => setOpen(false)} title="Table chat">
        <GameChat bare messages={messages} onSend={onSend} canSend={canSend} currentUserId={currentUserId} />
      </Sheet>
    </>,
    document.body,
  )
}
