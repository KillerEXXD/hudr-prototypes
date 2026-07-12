import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronsLeft, Trophy, Target, Grid3x3, ClipboardCopy, type LucideIcon } from 'lucide-react'
import { Card, Section } from '@/components/common/ui'
import { cn } from '@/lib/utils/cn'

/**
 * Mascot Variants — internal preview page for evaluating Midjourney-generated
 * game-type mascot/badge art. Accessed from the /me page so you can flip
 * through each generated set side-by-side, grouped by game type, and pick the
 * variant that ships.
 *
 * Naming convention for assets in `public/mascot-variants/`:
 *   set{1..4}-{variant}-{ft|ll|sq}.png
 *
 * Each card has a "Copy" button next to a `<pre>` where you can paste the
 * Midjourney prompt that generated the set — keeps the recipe with the art
 * so iteration doesn't lose context.
 */

type Tone = 'amber' | 'purple' | 'emerald'
type GameCode = 'll' | 'ft' | 'sq'

const SETS = [
  {
    key: 1,
    name: 'Themed Icons',
    blurb: 'Crown (FT), flame chip (LL), football (SQ) — abstract symbol style.',
    prompt: '(paste Midjourney prompt here)',
    variantSuffix: 'themed',
    isShipped: false,
  },
  {
    key: 2,
    name: 'Jeweled Buttons',
    blurb: 'Gemstone-encrusted label buttons with metallic frame.',
    prompt: '(paste Midjourney prompt here)',
    variantSuffix: 'jeweled',
    isShipped: false,
  },
  {
    key: 3,
    name: 'Horizontal Badge Pills',
    blurb: 'Long-form horizontal badge variant.',
    prompt: '(paste Midjourney prompt here)',
    variantSuffix: 'badge',
    isShipped: false,
  },
  {
    key: 4,
    name: 'Clean Glossy Pills',
    blurb: 'The shipped set — gold-framed 3-D enamel pill.',
    prompt: '(paste Midjourney prompt here)',
    variantSuffix: 'pill',
    isShipped: true,
  },
  {
    key: 5,
    name: 'Clean Glossy Pills — CONDENSED',
    blurb: 'Same Set 4 art, dark padding programmatically cropped (3.5:1 aspect). Text is ~30% bigger at the same badge height — readable at 22px.',
    prompt: 'Same as Set 4. CSS/code automation: cropped 6-10% L/R, 16-30% T/B via System.Drawing.',
    variantSuffix: 'pill',
    isShipped: false,
    isCondensed: true,
  },
] as const

const GAMES: { code: GameCode; label: string; Icon: LucideIcon; tone: Tone }[] = [
  { code: 'll', label: 'Last Longer', Icon: Trophy, tone: 'amber' },
  { code: 'ft', label: 'FT Fantasy', Icon: Target, tone: 'purple' },
  { code: 'sq', label: 'Football Squares', Icon: Grid3x3, tone: 'emerald' },
]

function VariantImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-bg-surface/40 p-2">
      <img src={src} alt={alt} className="block h-auto w-full" loading="lazy" />
    </div>
  )
}

function PromptBox({ prompt, idx }: { prompt: string; idx: number }) {
  const [copied, setCopied] = useState(false)
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }
  return (
    <div className="mt-2 rounded-lg border border-border bg-bg-surface/60 p-2.5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Prompt #{idx + 1}</span>
        <button type="button" onClick={onCopy} className="inline-flex items-center gap-1 text-[10px] font-bold text-accent-blue hover:underline cursor-pointer">
          <ClipboardCopy className="h-3 w-3" />{copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-snug text-text-secondary">{prompt}</pre>
    </div>
  )
}

export function MascotVariantsPage() {
  const navigate = useNavigate()
  return (
    <div className="animate-fade-up">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-3 inline-flex items-center gap-1 rounded-full border border-border bg-bg-surface/60 px-3 py-1.5 text-sm font-semibold text-text-secondary hover:text-text-primary cursor-pointer"
      >
        <ChevronsLeft className="h-4 w-4" />Back
      </button>
      <h1 className="text-xl font-extrabold tracking-tight text-text-primary">Mascot variants</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Four sets generated from Midjourney, grouped by game type. Compare side-by-side, paste the Midjourney prompt that generated each set so the recipe stays with the art.
      </p>

      {GAMES.map((g) => (
        <Section
          key={g.code}
          title={g.label}
          action={
            <g.Icon
              className={cn(
                'h-4 w-4',
                g.tone === 'amber' ? 'text-accent-amber' : g.tone === 'purple' ? 'text-accent-purple' : 'text-accent-emerald',
              )}
            />
          }
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SETS.map((s, i) => (
              <Card key={`${g.code}-${s.key}`} className={cn('overflow-hidden', s.isShipped && 'ring-2 ring-accent-emerald/40', ('isCondensed' in s && s.isCondensed) && 'ring-2 ring-accent-blue/40')}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Set {s.key}</span>
                      {s.isShipped && (
                        <span className="rounded-full bg-accent-emerald/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent-emerald">
                          Shipped
                        </span>
                      )}
                    </div>
                    <h3 className="truncate text-sm font-bold text-text-primary">{s.name}</h3>
                    <p className="truncate text-[11px] text-text-muted">{s.blurb}</p>
                  </div>
                </div>
                <VariantImage src={`${import.meta.env.BASE_URL}mascot-variants/set${s.key === 5 ? 4 : s.key}-${s.variantSuffix}-${g.code}${('isCondensed' in s && s.isCondensed) ? '-condensed' : ''}.png`} alt={`${g.label} — ${s.name}`} />
                {('isCondensed' in s && s.isCondensed) && (
                  <div className="mt-2 rounded-lg border border-accent-emerald/30 bg-accent-emerald/5 p-2.5">
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-accent-emerald">At actual badge sizes</div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-text-muted">22px</span>
                        <img src={`${import.meta.env.BASE_URL}mascot-variants/set4-${s.variantSuffix}-${g.code}-condensed.png`} alt="" className="h-[22px] w-auto" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-text-muted">32px</span>
                        <img src={`${import.meta.env.BASE_URL}mascot-variants/set4-${s.variantSuffix}-${g.code}-condensed.png`} alt="" className="h-[32px] w-auto" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-text-muted">44px</span>
                        <img src={`${import.meta.env.BASE_URL}mascot-variants/set4-${s.variantSuffix}-${g.code}-condensed.png`} alt="" className="h-[44px] w-auto" />
                      </div>
                    </div>
                  </div>
                )}
                <PromptBox prompt={s.prompt} idx={i} />
              </Card>
            ))}
          </div>
        </Section>
      ))}

      <p className="mt-6 text-center text-[11px] text-text-muted">
        Each card has a Copy button next to the prompt area — paste the Midjourney prompt you used and the team can iterate without losing the recipe.
      </p>
    </div>
  )
}
