import { useState } from 'react'
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

const KEY = 'clubr-carousel-engine'

export function ClubCarouselPicker({ clubs = LAB_CLUBS }: { clubs?: LabClub[] }) {
  const [engine, setEngine] = useState<string>(() => {
    try { return localStorage.getItem(KEY) || 'embla' } catch { return 'embla' }
  })
  const pick = (id: string) => { setEngine(id); try { localStorage.setItem(KEY, id) } catch { /* ignore */ } }
  const Active = (ENGINES.find((e) => e.id === engine) ?? ENGINES[0]).C

  return (
    <div className="mt-3">
      <div className="mb-1.5 flex items-center justify-between gap-2 px-1">
        <h2 className="text-sm font-extrabold tracking-tight text-text-primary">Your clubs</h2>
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {ENGINES.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => pick(e.id)}
              className={cn('shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold cursor-pointer transition-colors',
                engine === e.id ? 'border-accent-blue bg-accent-blue/20 text-accent-blue ring-1 ring-accent-blue/40' : 'border-transparent text-text-secondary')}
            >
              {e.name}
            </button>
          ))}
        </div>
      </div>
      <Active clubs={clubs} />
    </div>
  )
}
