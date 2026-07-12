import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Check } from 'lucide-react'
import { LAB_CLUBS } from '@/components/carousel-lab/ClubLabCard'
import { HandRolledCarousel, EmblaLabCarousel, SwiperLabCarousel, KeenLabCarousel } from '@/components/carousel-lab/carouselVariants'
import { CAROUSEL_ENGINE_KEY } from '@/components/carousel-lab/ClubCarouselPicker'
import { cn } from '@/lib/utils/cn'

// Prototype playground: the SAME card + clubs through four carousel engines. Each is
// SELECTABLE (like the skin picker) — picking one here persists it and the Home tab
// renders that engine. The currently-selected one is shown in a selected state.
const VARIANTS = [
  { id: 'embla', name: 'Embla', note: 'Headless, ~5kb. Best drag/snap inertia; scale via the scroll-progress API. (Recommended)', C: EmblaLabCarousel },
  { id: 'hand', name: 'Classic (CSS scroll-snap)', note: 'Zero dependency. Native scroll feel; centre scales via a rAF listener.', C: HandRolledCarousel },
  { id: 'swiper', name: 'Coverflow (Swiper)', note: 'Built-in 3D tilt. Flashiest, but heavier (~40kb).', C: SwiperLabCarousel },
  { id: 'keen', name: 'keen-slider', note: 'Headless, ~5kb. Centred, native-feel drag (no centre-scale here).', C: KeenLabCarousel },
]

export function CarouselLabPage() {
  const navigate = useNavigate()
  const [engine, setEngine] = useState<string>(() => {
    try { return localStorage.getItem(CAROUSEL_ENGINE_KEY) || 'embla' } catch { return 'embla' }
  })
  const select = (id: string) => { setEngine(id); try { localStorage.setItem(CAROUSEL_ENGINE_KEY, id) } catch { /* ignore */ } }

  return (
    <div className="animate-fade-up">
      <button type="button" onClick={() => navigate(-1)} className="mb-2 flex items-center gap-1 text-sm font-semibold text-text-secondary cursor-pointer"><ChevronLeft className="h-4 w-4" />Back</button>
      <h1 className="text-xl font-extrabold tracking-tight text-text-primary">Carousel Lab</h1>
      <p className="text-sm text-text-secondary">Swipe each, then tap <b className="text-text-primary">Select</b> on the one you want — it's used on your Home tab.</p>
      <div className="mt-4 flex flex-col gap-5">
        {VARIANTS.map((v) => {
          const on = engine === v.id
          return (
            <section key={v.id} className={cn('rounded-2xl border p-2.5 transition-all', on ? 'border-accent-blue ring-2 ring-accent-blue/30' : 'border-border')}>
              <div className="mb-1.5 flex items-start justify-between gap-2 px-0.5">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-text-primary">{v.name}{on && <Check className="h-3.5 w-3.5 text-accent-blue" />}</h2>
                  <p className="text-xs text-text-muted">{v.note}</p>
                </div>
                <button
                  type="button"
                  onClick={() => select(v.id)}
                  className={cn('shrink-0 rounded-full border px-3 py-1 text-xs font-bold cursor-pointer transition-colors',
                    on ? 'border-accent-blue bg-accent-blue/20 text-accent-blue ring-1 ring-accent-blue/40' : 'border-border text-text-secondary hover:bg-bg-surface')}
                >
                  {on ? <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5" />Selected</span> : 'Select'}
                </button>
              </div>
              <v.C clubs={LAB_CLUBS} />
            </section>
          )
        })}
      </div>
    </div>
  )
}
