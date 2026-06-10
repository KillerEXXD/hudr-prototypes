import { useTheme, type UXMode } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'

const modes: { id: UXMode; label: string; desc: string }[] = [
  { id: 'pulse', label: 'Pulse', desc: 'Live & dynamic' },
  { id: 'nexus', label: 'Nexus', desc: 'Connected data' },
  { id: 'oracle', label: 'Oracle', desc: 'AI insights' },
  { id: 'atlas', label: 'Atlas', desc: 'Deep exploration' },
  { id: 'prism', label: 'Prism', desc: 'Visual analytics' },
]

export default function ThemeSwitcher() {
  const { mode, setMode } = useTheme()

  return (
    <div className="flex gap-1 p-1 rounded-xl bg-bg-surface">
      {modes.map(m => (
        <button
          key={m.id}
          onClick={() => setMode(m.id)}
          className={cn(
            'flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all',
            mode === m.id
              ? 'bg-accent-blue text-white shadow-sm'
              : 'text-text-muted hover:text-text-secondary'
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
