import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { fetchCitySuggestions, newSessionToken } from '@/lib/cityAutocomplete'

/**
 * City typeahead. Backed by Google Places Autocomplete (cities-only) when a key
 * is configured (VITE_GOOGLE_PLACES_KEY), else a bundled list. Keystrokes are
 * debounced and stale requests aborted; free text is always allowed (so it also
 * works for venue-style entries). One shared component for every city input —
 * onboarding, club create, profile edit, game location.
 */
export function CityField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false)
  const [matches, setMatches] = useState<string[]>([])
  const token = useRef('')
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abort = useRef<AbortController | null>(null)

  // Debounced lookup whenever the value changes while the menu is open.
  useEffect(() => {
    if (!open) return
    if (!token.current) token.current = newSessionToken()
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      abort.current?.abort()
      const ac = new AbortController()
      abort.current = ac
      const out = await fetchCitySuggestions(value, token.current, ac.signal)
      if (!ac.signal.aborted) setMatches(out)
    }, 280)
    return () => { if (debounce.current) clearTimeout(debounce.current) }
  }, [value, open])

  function pick(c: string) {
    onChange(c)
    setOpen(false)
    setMatches([])
    token.current = '' // selection ends the billing session
  }

  return (
    <label className="relative block">
      <span className="mb-1 block text-xs font-semibold text-text-secondary">{label}</span>
      <div className="flex items-center rounded-xl border border-border bg-bg-surface focus-within:ring-2 focus-within:ring-accent-blue">
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
