import { useState } from 'react'
import { Send } from 'lucide-react'
import { Card, Button, Input } from '@/components/ui'
import { AI_CHAT_SUGGESTIONS } from '@/data'

export default function AIChatInterface() {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([])
  const [input, setInput] = useState('')

  const handleSend = (text: string) => {
    if (!text.trim()) return
    setMessages(prev => [
      ...prev,
      { role: 'user', text },
      { role: 'ai', text: 'AI analysis coming soon. This is a prototype placeholder.' },
    ])
    setInput('')
  }

  return (
    <Card className="space-y-3">
      <h3 className="font-semibold text-sm text-text-primary">Ask HUDR AI</h3>

      {messages.length === 0 && (
        <div className="space-y-2">
          <p className="text-xs text-text-muted">Suggested questions:</p>
          {AI_CHAT_SUGGESTIONS.slice(0, 3).map(q => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="block w-full text-left text-xs text-accent-blue hover:text-accent-blue/80 py-1"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`text-xs p-2 rounded-lg ${m.role === 'user' ? 'bg-accent-blue/10 text-accent-blue ml-8' : 'bg-bg-surface text-text-secondary mr-8'}`}>
            {m.text}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend(input)}
          placeholder="Ask about the tournament..."
          className="text-xs h-8"
        />
        <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => handleSend(input)}>
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  )
}
