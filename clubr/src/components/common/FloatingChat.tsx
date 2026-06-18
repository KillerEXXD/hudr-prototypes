import { useState, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import { Sheet } from './ui'
import { GameChat } from './GameChat'
import type { ChatMsg } from '@/types/ft'

// Per-game floating chat: a bubble (with an unread count) that opens the game's
// conversation in a slide-up sheet. It only ever renders the messages it's given
// — which are scoped to ONE game (g.chat / c.chat) — so chat never crosses
// between games. Render it with key={gameId} per page so the unread count resets
// when you navigate to a different game.
export function FloatingChat({ messages, onSend, canSend, currentUserId }: {
  messages: ChatMsg[]; onSend: (text: string) => void; canSend: boolean; currentUserId: string
}) {
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState(messages.length)
  // Everything is "seen" whenever the chat is open (and as it grows while open).
  useEffect(() => { if (open) setSeen(messages.length) }, [open, messages.length])
  // Unread = incoming messages (not your own) since you last had it open.
  const unread = open ? 0 : messages.slice(seen).filter((m) => m.userId !== currentUserId).length

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={unread > 0 ? `Open table chat, ${unread} unread` : 'Open table chat'}
          className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-accent-blue text-white shadow-lg ring-2 ring-bg-primary transition-transform active:scale-95 cursor-pointer"
        >
          <MessageCircle className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent-red px-1 text-[11px] font-extrabold leading-none text-white ring-2 ring-bg-primary">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>
      )}
      <Sheet open={open} onClose={() => setOpen(false)} title="Table chat">
        <GameChat bare messages={messages} onSend={onSend} canSend={canSend} currentUserId={currentUserId} />
      </Sheet>
    </>
  )
}
