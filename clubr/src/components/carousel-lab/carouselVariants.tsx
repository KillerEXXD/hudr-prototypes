import { useEffect, useRef } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { EffectCoverflow } from 'swiper/modules'
import { useKeenSlider } from 'keen-slider/react'
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import 'keen-slider/keen-slider.min.css'
import { ClubLabCard, type LabClub } from './ClubLabCard'

// ── 1. Hand-rolled: CSS scroll-snap + a rAF scroll listener for scale/dim (no dep).
export function HandRolledCarousel({ clubs }: { clubs: LabClub[] }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const track = ref.current
    if (!track) return
    let raf = 0
    const paint = () => {
      raf = 0
      const r = track.getBoundingClientRect(); const mid = r.left + r.width / 2
      for (const card of Array.from(track.querySelectorAll<HTMLElement>('[data-card]'))) {
        const cr = card.getBoundingClientRect()
        const d = Math.min(1, Math.abs(cr.left + cr.width / 2 - mid) / (r.width / 1.4))
        card.style.transform = `scale(${(1 - d * 0.16).toFixed(3)})`
        card.style.opacity = (1 - d * 0.5).toFixed(3)
      }
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(paint) }
    paint(); track.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll)
    return () => { track.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (raf) cancelAnimationFrame(raf) }
  }, [clubs.length])
  return (
    <div ref={ref} className="flex snap-x snap-mandatory gap-3 overflow-x-auto overflow-y-hidden no-scrollbar px-[12%] py-2">
      {clubs.map((c) => (
        <div key={c.id} data-card className="w-[76%] shrink-0 origin-center snap-center transition-[transform,opacity] duration-100 ease-out"><ClubLabCard club={c} /></div>
      ))}
    </div>
  )
}

// ── 2. Embla: headless; scale via the scroll-progress API (transform/opacity, 60fps).
export function EmblaLabCarousel({ clubs }: { clubs: LabClub[] }) {
  const [ref, api] = useEmblaCarousel({ align: 'center', containScroll: false })
  useEffect(() => {
    if (!api) return
    const apply = () => {
      const snaps = api.scrollSnapList(); const progress = api.scrollProgress(); const nodes = api.slideNodes()
      snaps.forEach((snap, i) => {
        const d = Math.min(1, Math.abs(snap - progress) * 1.6)
        nodes[i].style.transform = `scale(${(1 - d * 0.18).toFixed(3)})`
        nodes[i].style.opacity = (1 - d * 0.5).toFixed(3)
      })
    }
    api.on('scroll', apply); api.on('reInit', apply); apply()
    return () => { api.off('scroll', apply); api.off('reInit', apply) }
  }, [api])
  return (
    <div ref={ref} className="overflow-hidden">
      <div className="flex gap-3 py-2">
        {clubs.map((c) => <div key={c.id} className="min-w-0 flex-[0_0_76%] origin-center transition-opacity"><ClubLabCard club={c} /></div>)}
      </div>
    </div>
  )
}

// ── 3. Swiper: built-in 3D coverflow effect (the tilt).
export function SwiperLabCarousel({ clubs }: { clubs: LabClub[] }) {
  return (
    <Swiper
      modules={[EffectCoverflow]} effect="coverflow" grabCursor centeredSlides slidesPerView={1.35}
      coverflowEffect={{ rotate: 28, depth: 120, modifier: 1, stretch: 0, slideShadows: false }} className="py-3"
    >
      {clubs.map((c) => <SwiperSlide key={c.id} style={{ width: '72%' }}><ClubLabCard club={c} /></SwiperSlide>)}
    </Swiper>
  )
}

// ── 4. keen-slider: headless, centered, native-feel drag.
export function KeenLabCarousel({ clubs }: { clubs: LabClub[] }) {
  const [ref] = useKeenSlider<HTMLDivElement>({ slides: { perView: 1.4, spacing: 12, origin: 'center' } })
  return (
    <div ref={ref} className="keen-slider py-2">
      {clubs.map((c) => <div key={c.id} className="keen-slider__slide"><ClubLabCard club={c} /></div>)}
    </div>
  )
}
