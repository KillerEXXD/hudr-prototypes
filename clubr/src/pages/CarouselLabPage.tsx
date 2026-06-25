import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { LAB_CLUBS } from '@/components/carousel-lab/ClubLabCard'
import { HandRolledCarousel, EmblaLabCarousel, SwiperLabCarousel, KeenLabCarousel } from '@/components/carousel-lab/carouselVariants'

// Prototype-only playground: the SAME card + clubs through four carousel engines so
// you can feel each and pick one. Reached from the Me page.
const VARIANTS = [
  { name: 'Hand-rolled (CSS scroll-snap)', note: 'Zero dependency. Native scroll feel; centre scales via a rAF listener. (What is live now.)', C: HandRolledCarousel },
  { name: 'Embla', note: 'Headless, ~5kb. Best drag/snap inertia; scale via the scroll-progress API. (Recommended)', C: EmblaLabCarousel },
  { name: 'Swiper — 3D coverflow', note: 'Built-in 3D tilt. Flashiest, but heavier (~40kb) and re-introduces the tilt.', C: SwiperLabCarousel },
  { name: 'keen-slider', note: 'Headless, ~5kb. Centred, native-feel drag (no centre-scale here).', C: KeenLabCarousel },
]

export function CarouselLabPage() {
  const navigate = useNavigate()
  return (
    <div className="animate-fade-up">
      <button onClick={() => navigate(-1)} className="mb-2 flex items-center gap-1 text-sm font-semibold text-text-secondary cursor-pointer"><ChevronLeft className="h-4 w-4" />Back</button>
      <h1 className="text-xl font-extrabold tracking-tight text-text-primary">Carousel Lab</h1>
      <p className="text-sm text-text-secondary">Same card + clubs, four carousel engines. Swipe each and pick the feel you like.</p>
      <div className="mt-4 flex flex-col gap-9">
        {VARIANTS.map((v) => (
          <section key={v.name}>
            <h2 className="px-1 text-sm font-extrabold text-text-primary">{v.name}</h2>
            <p className="mb-1.5 px-1 text-xs text-text-muted">{v.note}</p>
            <v.C clubs={LAB_CLUBS} />
          </section>
        ))}
      </div>
    </div>
  )
}
