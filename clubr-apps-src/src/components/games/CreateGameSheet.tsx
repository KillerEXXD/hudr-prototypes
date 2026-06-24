import { useNavigate } from 'react-router-dom'
import { Trophy, Clock, Grid3x3, X } from 'lucide-react'
import { APP_REGISTRY, type GameAppMeta } from '@/games/appRegistry'

/**
 * Sheet that opens from the center [+] in the dock. Lists every game type
 * registered in APP_REGISTRY; tapping one navigates to that game-app's landing
 * page (where the per-game create flow lives).
 *
 * Same data source as the Home apps grid — new games appear here
 * automatically when they're added to APP_REGISTRY.
 */
export function CreateGameSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl border border-border/60 bg-bg-card/95 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-text-muted/30" />
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-extrabold text-text-primary">Create a game</h2>
            <p className="text-xs text-text-secondary">Pick the type of game you want to host.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-bg-surface text-text-muted hover:text-text-primary">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {APP_REGISTRY.map((g) => <PickerTile key={g.id} g={g} onPick={() => { onClose(); navigate(g.route) }} />)}
        </div>
        <p className="mt-4 text-center text-[11px] text-text-muted">More game types coming soon — each lives as its own app on Home.</p>
      </div>
    </div>
  )
}

function PickerTile({ g, onPick }: { g: GameAppMeta; onPick: () => void }) {
  const Icon = g.id === 'fantasy' ? Trophy : g.id === 'last-longer' ? Clock : Grid3x3
  return (
    <button
      type="button"
      onClick={onPick}
      className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-border/40 bg-bg-surface/60 p-3 transition-colors hover:bg-bg-surface"
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${g.grad} text-white`}
        style={{ boxShadow: `0 8px 20px -6px ${g.glow}, inset 0 1px 0 0 rgba(255,255,255,0.35)` }}
      >
        <Icon className="h-6 w-6" />
      </div>
      <span className="text-xs font-bold text-text-primary">{g.label}</span>
    </button>
  )
}
