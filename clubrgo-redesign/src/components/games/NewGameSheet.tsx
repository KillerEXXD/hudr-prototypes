import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Sheet } from '@/components/common/ui'
import { CreateGameSheet } from '@/components/ll/CreateGameSheet'
import { CreateSquaresSheet } from '@/components/squares/CreateSquaresSheet'
import { GAME_TYPES, type GameType, type GameTypeDef } from '@/games/types'

// One entry point to host any game type — driven by the game-type registry.
// Route-create types navigate to their flow; sheet-create types open their
// create sheet (mapped below). Adding a type = a registry entry (+ its sheet here
// if it's a sheet-create type).
export function NewGameSheet({ open, onClose, fixedClubId }: { open: boolean; onClose: () => void; fixedClubId?: string }) {
  const navigate = useNavigate()
  const [sheetType, setSheetType] = useState<GameType | null>(null)

  function choose(t: GameTypeDef) {
    onClose()
    if (t.create.kind === 'route') navigate(t.create.to)
    else setSheetType(t.id)
  }

  return (
    <>
      <Sheet open={open} onClose={onClose} title="What do you want to host?">
        <div className="flex flex-col gap-2">
          {GAME_TYPES.map((t) => (
            <button key={t.id} type="button" onClick={() => choose(t)} className={`flex items-center gap-3 rounded-2xl border ${t.ring} p-3.5 text-left transition-transform active:scale-[0.99] cursor-pointer`}>
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ${t.iconBg}`}><t.icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-text-primary">{t.label}</span>
                <span className="block text-xs text-text-muted">{t.sub}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" />
            </button>
          ))}
        </div>
      </Sheet>

      {/* Sheet-create flows (route-create types navigate instead). */}
      <CreateGameSheet open={sheetType === 'last_longer'} onClose={() => setSheetType(null)} fixedClubId={fixedClubId} />
      <CreateSquaresSheet open={sheetType === 'football_squares'} onClose={() => setSheetType(null)} fixedClubId={fixedClubId} />
    </>
  )
}
