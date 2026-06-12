import { Check } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

// Swatch grid of selectable skins. Shared by the header chip popover, the
// profile menu, and the Profile page. Applies instantly on tap.
export default function SkinPicker({ onSelect, columns = 2 }: { onSelect?: () => void; columns?: 2 | 3 }) {
  const { theme, setTheme, themes } = useTheme()
  return (
    <div className={cn('grid gap-2', columns === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
      {themes.map((t) => {
        const active = t.name === theme
        return (
          <button
            key={t.name}
            type="button"
            onClick={() => { setTheme(t.name); onSelect?.() }}
            aria-pressed={active}
            className={cn(
              'flex flex-col gap-1.5 rounded-xl border p-2 text-left transition-colors cursor-pointer',
              active ? 'border-accent-blue ring-1 ring-accent-blue/40' : 'border-border hover:border-border-light',
            )}
          >
            <span
              className="flex h-8 w-full items-center gap-1.5 rounded-md border border-black/10 px-2"
              style={{ background: t.swatch.bg }}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: t.swatch.accent }} />
              <span className="h-1.5 flex-1 rounded-full" style={{ background: t.swatch.text, opacity: 0.28 }} />
            </span>
            <span className="flex items-center gap-1">
              <span className="text-xs font-bold text-text-primary">{t.label}</span>
              {active && <Check className="h-3 w-3 text-accent-blue" />}
            </span>
            <span className="truncate text-[10px] text-text-muted">{t.tagline}</span>
          </button>
        )
      })}
    </div>
  )
}
