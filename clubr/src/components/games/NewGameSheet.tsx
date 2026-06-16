import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, Timer, ChevronRight } from 'lucide-react'
import { Sheet } from '@/components/common/ui'
import { CreateGameSheet } from '@/components/ll/CreateGameSheet'

// One entry point to host any game type — "What do you want to host?" → route to
// that type's create flow. Adding a game type = adding one row here (scales to N).
export function NewGameSheet({ open, onClose, fixedClubId }: { open: boolean; onClose: () => void; fixedClubId?: string }) {
  const navigate = useNavigate()
  const [llOpen, setLlOpen] = useState(false)

  const TYPES = [
    {
      key: 'ft_fantasy', label: 'FT Fantasy', sub: 'Draft a streamed final table (Stack Draft)',
      icon: Target, ring: 'border-accent-purple/30 bg-accent-purple/10', chip: 'bg-accent-purple',
      go: () => { onClose(); navigate('/host-ft') },
    },
    {
      key: 'last_longer', label: 'Last Longer', sub: "Your club's own live tournament",
      icon: Timer, ring: 'border-accent-amber/30 bg-accent-amber/10', chip: 'bg-accent-amber',
      go: () => { onClose(); setLlOpen(true) },
    },
    // Football Squares slots in here in Phase 3 — no other change needed.
  ]

  return (
    <>
      <Sheet open={open} onClose={onClose} title="What do you want to host?">
        <div className="flex flex-col gap-2">
          {TYPES.map((t) => (
            <button key={t.key} type="button" onClick={t.go} className={`flex items-center gap-3 rounded-2xl border ${t.ring} p-3.5 text-left transition-transform active:scale-[0.99] cursor-pointer`}>
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ${t.chip}`}><t.icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-text-primary">{t.label}</span>
                <span className="block text-xs text-text-muted">{t.sub}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
            </button>
          ))}
        </div>
      </Sheet>
      <CreateGameSheet open={llOpen} onClose={() => setLlOpen(false)} fixedClubId={fixedClubId} />
    </>
  )
}
