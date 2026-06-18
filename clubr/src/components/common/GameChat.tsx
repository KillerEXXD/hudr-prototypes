import { useState, useRef, useEffect } from 'react'
import { Send, MessageCircle } from 'lucide-react'
import { Avatar } from './ui'
import { cn } from '@/lib/utils/cn'
import type { ChatMsg } from '@/types/ft'

// Per-game chat — reused by FT Fantasy and Last Longer. Players in the game
// chat among themselves; system lines mark joins/eliminations.
export function GameChat({ messages, onSend, canSend, currentUserId, bare = false }: { messages: ChatMsg[]; onSend: (text: string) => void; canSend: boolean; currentUserId: string; bare?: boolean }) {
  const [text, setText] = useState('')
  function send() { if (text.trim()) { onSend(text); setText('') } }

  // Pin the chat's OWN scroll to the bottom (latest message). We set the
  // container's scrollTop directly — NOT scrollIntoView, which would also scroll
  // the window and drag the whole page down to the chat. So the page stays at the
  // top; the chat just opens already showing the newest messages. On later
  // messages we only re-pin if the user is already near the bottom.
  const scrollRef = useRef<HTMLDivElement>(null)
  const mounted = useRef(false)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (!mounted.current || nearBottom) el.scrollTop = el.scrollHeight
    mounted.current = true
  }, [messages.length])

  return (
    <div className={bare ? 'flex flex-1 flex-col' : 'rounded-2xl border border-border bg-bg-card p-3'}>
      <div ref={scrollRef} className={cn('mb-2 flex flex-col gap-2 overflow-y-auto scrollbar-thin pr-1', bare ? 'max-h-[58vh] flex-1' : 'max-h-64')}>
        {messages.length === 0 && <p className="py-4 text-center text-xs text-text-muted">No messages yet. Say hi 👋</p>}
        {messages.map((m) => m.kind === 'system' ? (
          <p key={m.id} className="self-center rounded-full border border-border bg-bg-surface px-2.5 py-1 text-center text-[11px] font-medium text-text-secondary">{m.text}</p>
        ) : (
          <div key={m.id} className={cn('flex items-start gap-2', m.userId === currentUserId && 'flex-row-reverse')}>
            <Avatar name={m.name} color={m.avatarColor} size={26} />
            <div className={cn('max-w-[78%] rounded-2xl px-3 py-1.5', m.userId === currentUserId ? 'bg-accent-blue text-white shadow-sm' : 'border border-border bg-bg-surface text-text-primary')}>
              {m.userId !== currentUserId && <p className="text-[11px] font-bold" style={{ color: m.avatarColor }}>{m.name}</p>}
              <p className="text-sm leading-snug">{m.text}</p>
            </div>
          </div>
        ))}
      </div>
      {canSend ? (
        <div className="flex items-center gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Message the players…" className="flex-1 rounded-xl border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue" />
          <button onClick={send} className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-blue text-white cursor-pointer" aria-label="Send"><Send className="h-4 w-4" /></button>
        </div>
      ) : (
        <p className="flex items-center justify-center gap-1 py-1 text-[11px] text-text-muted"><MessageCircle className="h-3 w-3" />Get admitted to chat with the players.</p>
      )}
    </div>
  )
}
