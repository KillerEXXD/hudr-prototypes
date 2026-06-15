import { Check } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils/cn'

/** The 6-skin picker (shared with the hudr-prototypes appearance system). */
export function SkinPicker() {
  const { theme, setTheme, themes } = useTheme()
  return (
    <div className="grid grid-cols-2 gap-2">
      {themes.map((t) => {
        const active = t.name === theme
        return (
          <button
            key={t.name}
            onClick={() => setTheme(t.name)}
            className={cn(
              'flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all cursor-pointer',
              active ? 'border-accent-blue ring-2 ring-accent-blue/30' : 'border-border hover:bg-bg-surface',
            )}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: t.swatch.bg }}>
              <span className="h-3.5 w-3.5 rounded-full" style={{ background: t.swatch.accent }} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1 text-xs font-bold text-text-primary">{t.label}{active && <Check className="h-3 w-3 text-accent-blue" />}</span>
              <span className="block truncate text-[10px] text-text-muted">{t.tagline}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
