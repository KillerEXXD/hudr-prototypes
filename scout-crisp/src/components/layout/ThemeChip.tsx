import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronDown } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import SkinPicker from '@/components/common/SkinPicker'

// Subtle, always-visible skin indicator in the header: a gently pulsing dot in
// the current accent + the skin name (in the accent colour). Tap → skin picker.
export default function ThemeChip() {
  const { label } = useTheme()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Skin: ${label}. Tap to change`}
        className="flex items-center gap-1.5 rounded-full border border-accent-blue/30 bg-accent-blue/10 px-2.5 py-1 text-[11px] font-bold text-accent-blue transition-colors hover:bg-accent-blue/20 cursor-pointer"
      >
        <span className="skin-dot h-2 w-2 rounded-full bg-accent-blue" />
        <span className="max-w-[96px] truncate">{label}</span>
        <ChevronDown className="h-3 w-3 opacity-70" />
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="animate-fade-up w-full max-w-sm rounded-2xl border border-border bg-bg-card p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary">Choose a skin</h3>
              <button onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-bg-surface cursor-pointer" aria-label="Close"><X className="h-4 w-4" /></button>
            </div>
            <p className="mb-3 text-xs text-text-muted">Re-skins the whole app. Your pick is remembered.</p>
            <SkinPicker columns={2} onSelect={() => setOpen(false)} />
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
