import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { fetchCitySuggestions } from '@/lib/cityAutocomplete'
import { cn } from '@/lib/utils/cn'

/**
 * City typeahead. Backed by the server-side geocoder proxy (Nominatim, free; see
 * cityAutocomplete.ts) with a bundled-list fallback. Keystrokes are debounced and
 * out-of-order responses dropped via a request-id guard. Free text is always
 * allowed (so it also works for venue-style entries). One shared component for
 * every city input — onboarding, club create, profile edit, game location.
 */
export function CityField({ label, value, onChange, placeholder, error }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; error?: boolean }) {
  const [open, setOpen] = useState(false)
  const [matches, setMatches] = useState<string[]>([])
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reqId = useRef(0)

  // Debounced lookup whenever the value changes while the menu is open.
  useEffect(() => {
    if (!open) return
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      const id = ++reqId.current
      const out = await fetchCitySuggestions(value)
      if (id === reqId.current) setMatches(out) // ignore stale (out-of-order) responses
    }, 280)
    return () => { if (debounce.current) clearTimeout(debounce.current) }
  }, [value, open])

  function pick(c: string) {
    onChange(c)
    setOpen(false)
    setMatches([])
  }

  return (
    <label className="relative block">
      <span className="mb-1 block text-xs font-semibold text-text-secondary">{label}{error && <span className="ml-1 font-bold text-accent-red">· Required</span>}</span>
      <div className={cn('flex items-center rounded-xl border bg-bg-surface', error ? 'border-accent-red ring-1 ring-accent-red/40 focus-within:ring-accent-red' : 'border-border focus-within:ring-2 focus-within:ring-accent-blue')}>
        <MapPin className="ml-3 h-4 w-4 shrink-0 text-text-muted" />
        <input
          type="text"
          value={value}
          autoComplete="off"
          onChange={(e) => { onChange(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          placeholder={placeholder ?? 'Start typing your city…'}
          className="w-full bg-transparent px-2 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>
      {open && matches.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-bg-card shadow-xl">
          {matches.map((c) => (
            <li key={c}>
              <button
                type="button"
                onMouseDown={() => pick(c)}
                className="block w-full px-3 py-2 text-left text-sm text-text-secondary hover:bg-bg-surface cursor-pointer"
              >
                {c}
              </button>
            </li>
          ))}
        </ul>
      )}
    </label>
  )
}
