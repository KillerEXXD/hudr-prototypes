import { useState } from 'react'
import { Send, MessageCircle } from 'lucide-react'
import { Avatar } from './ui'
import { cn } from '@/lib/utils/cn'
import type { ChatMsg } from '@/types/ft'

// Per-game chat — reused by FT Fantasy and Last Longer. Players in the game
// chat among themselves; system lines mark joins/eliminations.
export function GameChat({ messages, onSend, canSend, currentUserId }: { messages: ChatMsg[]; onSend: (text: string) => void; canSend: boolean; currentUserId: string }) {
  const [text, setText] = useState('')
  function send() { if (text.trim()) { onSend(text); setText('') } }
  return (
    <div className="rounded-2xl border border-border bg-bg-card p-3">
      <div className="mb-2 flex max-h-64 flex-col gap-2 overflow-y-auto scrollbar-thin pr-1">
        {messages.length === 0 && <p className="py-4 text-center text-xs text-text-muted">No messages yet. Say hi 👋</p>}
        {messages.map((m) => m.kind === 'system' ? (
          <p key={m.id} className="self-center rounded-full bg-bg-surface px-2.5 py-1 text-center text-[11px] text-text-muted">{m.text}</p>
        ) : (
          <div key={m.id} className={cn('flex items-start gap-2', m.userId === currentUserId && 'flex-row-reverse')}>
            <Avatar name={m.name} color={m.avatarColor} size={26} />
            <div className={cn('max-w-[78%] rounded-2xl px-3 py-1.5', m.userId === currentUserId ? 'bg-accent-blue text-white' : 'bg-bg-surface text-text-primary')}>
              {m.userId !== currentUserId && <p className="text-[10px] font-bold opacity-70">{m.name}</p>}
              <p className="text-[13px] leading-snug">{m.text}</p>
            </div>
          </div>
        ))}
      </div>
      {canSend ? (
        <div className="flex items-center gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Message the table…" className="flex-1 rounded-xl border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue" />
          <button onClick={send} className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-blue text-white cursor-pointer" aria-label="Send"><Send className="h-4 w-4" /></button>
        </div>
      ) : (
        <p className="flex items-center justify-center gap-1 py-1 text-[11px] text-text-muted"><MessageCircle className="h-3 w-3" />Get admitted to chat with the table.</p>
      )}
    </div>
  )
}
