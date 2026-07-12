import { useState } from 'react'
import { Check } from 'lucide-react'
import { LAB_CLUBS, type LabClub } from './ClubLabCard'
import { HandRolledCarousel, EmblaLabCarousel, SwiperLabCarousel, KeenLabCarousel } from './carouselVariants'
import { cn } from '@/lib/utils/cn'

// Home-tab carousel chooser: flip between the 4 engines and see "Your clubs" render
// live, right in the Home context. The choice persists so the picked engine sticks.
const ENGINES = [
  { id: 'embla', name: 'Embla', C: EmblaLabCarousel },
  { id: 'hand', name: 'Classic', C: HandRolledCarousel },
  { id: 'swiper', name: 'Coverflow', C: SwiperLabCarousel },
  { id: 'keen', name: 'Keen', C: KeenLabCarousel },
] as const

// Shared selection key — the Home picker AND the Carousel Lab both read/write it,
// so a pick in either place sticks everywhere.
export const CAROUSEL_ENGINE_KEY = 'clubr-carousel-engine'

export function ClubCarouselPicker({ clubs = LAB_CLUBS }: { clubs?: LabClub[] }) {
  const [engine, setEngine] = useState<string>(() => {
    try { return localStorage.getItem(CAROUSEL_ENGINE_KEY) || 'embla' } catch { return 'embla' }
  })
  const pick = (id: string) => { setEngine(id); try { localStorage.setItem(CAROUSEL_ENGINE_KEY, id) } catch { /* ignore */ } }
  const active = ENGINES.find((e) => e.id === engine) ?? ENGINES[0]
  const Active = active.C

  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between gap-2 px-1">
        <h2 className="text-sm font-extrabold tracking-tight text-text-primary">Your clubs</h2>
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {ENGINES.map((e) => {
            const on = engine === e.id
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => pick(e.id)}
                className={cn('inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold cursor-pointer transition-colors',
                  on ? 'border-accent-blue bg-accent-blue/20 text-accent-blue ring-1 ring-accent-blue/40' : 'border-transparent text-text-secondary')}
              >
                {on && <Check className="h-3 w-3" />}{e.name}
              </button>
            )
          })}
        </div>
      </div>
      {/* Make the current choice unmistakable. */}
      <p className="mb-1.5 px-1 text-[11px] text-text-muted">Selected: <span className="font-bold text-accent-blue">{active.name}</span></p>
      <Active clubs={clubs} />
    </div>
  )
}
