/**
 * Action Badge Demo - Visual preview of all badge variants
 *
 * To view: Navigate to /action-badge-demo in the app
 * Or import this component into any page
 */

import { useEffect, useRef, useState } from 'react'
import { ActionBadgePrototype, ACTION_BADGE_VARIANTS, ACTION_BADGE_LABELS, ANIMATED_BADGE_VARIANTS, getRandomStaticBadgeVariant, getRandomAnimatedBadgeVariant } from './entities/ActionBadgePrototype'
import { defaultReplayerTheme } from './constants/theme'

// Simulated hand IDs for randomization demo
const DEMO_HAND_IDS = [
  'hand-abc123-poker',
  'hand-xyz789-wsop',
  'hand-def456-main',
  'hand-ghi012-final',
  'hand-jkl345-headsup',
  'hand-mno678-allin',
]

const badge = new ActionBadgePrototype()

export function ActionBadgeDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [animProgress, setAnimProgress] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const animationRef = useRef<number | null>(null)

  // Render the demo
  const render = (progress: number = 0) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = 900
    const height = 1150

    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    // Dark background
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, width, height)

    const theme = defaultReplayerTheme
    const actions = ['CHECK', 'CALL', 'RAISE', 'BET', 'FOLD', 'ALL-IN']
    const now = performance.now()

    // Title
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 20px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Action Badge Variants', width / 2, 30)

    // =====================
    // STATIC VARIANTS SECTION
    // =====================
    ctx.fillStyle = '#fbbf24'
    ctx.font = 'bold 14px Inter, system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('STATIC VARIANTS (always visible)', 20, 60)

    const staticVariants = ACTION_BADGE_VARIANTS.filter(v => !ANIMATED_BADGE_VARIANTS.includes(v))
    const colWidth = 130
    const rowHeight = 55
    const startX = 140
    const startY = 90

    // Action labels
    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    actions.forEach((action, i) => {
      ctx.fillText(action, startX + i * colWidth + colWidth / 2, startY - 10)
    })

    // Variant labels and badges
    staticVariants.forEach((variant, row) => {
      // Label
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '11px Inter, system-ui, sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(ACTION_BADGE_LABELS[variant], startX - 10, startY + row * rowHeight + 18)

      // Badges for each action
      actions.forEach((action, col) => {
        badge.draw({
          ctx,
          x: startX + col * colWidth + colWidth / 2,
          y: startY + row * rowHeight,
          action,
          theme,
          scale: 0.85,
          variant,
          now,
        })
      })
    })

    // =====================
    // ANIMATED VARIANTS SECTION
    // =====================
    const animStartY = startY + staticVariants.length * rowHeight + 40

    ctx.fillStyle = '#fbbf24'
    ctx.font = 'bold 14px Inter, system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`ANIMATED VARIANTS (progress: ${Math.round(progress * 100)}%)`, 20, animStartY)

    // Progress labels
    const progressSteps = [0, 0.25, 0.5, 0.75, 1.0]
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    progressSteps.forEach((p, i) => {
      ctx.fillText(`${Math.round(p * 100)}%`, startX + i * colWidth + colWidth / 2, animStartY + 25)
    })

    // Animated variant badges at different progress points
    ANIMATED_BADGE_VARIANTS.forEach((variant, row) => {
      // Label
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '11px Inter, system-ui, sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(ACTION_BADGE_LABELS[variant], startX - 10, animStartY + 50 + row * rowHeight + 18)

      // Show each progress step
      progressSteps.forEach((stepProgress, col) => {
        const action = ['CALL', 'RAISE', 'BET', 'FOLD', 'CHECK'][col % 5]!
        badge.draw({
          ctx,
          x: startX + col * colWidth + colWidth / 2,
          y: animStartY + 50 + row * rowHeight,
          action,
          theme,
          scale: 0.8,
          variant,
          now,
          animProgress: stepProgress,
        })
      })
    })

    // =====================
    // LIVE ANIMATION PREVIEW
    // =====================
    const liveStartY = animStartY + 50 + ANIMATED_BADGE_VARIANTS.length * rowHeight + 50

    ctx.fillStyle = '#22c55e'
    ctx.font = 'bold 14px Inter, system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('LIVE ANIMATION (click Play below)', 20, liveStartY)

    // Draw live animated badges
    ANIMATED_BADGE_VARIANTS.forEach((variant, i) => {
      badge.draw({
        ctx,
        x: startX + i * 180 + 90,
        y: liveStartY + 40,
        action: 'RAISE',
        theme,
        scale: 1.0,
        variant,
        now,
        animProgress: progress,
      })

      // Label below
      ctx.fillStyle = '#94a3b8'
      ctx.font = '10px Inter, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(ACTION_BADGE_LABELS[variant], startX + i * 180 + 90, liveStartY + 80)
    })

    // =====================
    // RANDOMIZED PER HAND SECTION
    // =====================
    const randomStartY = liveStartY + 120

    ctx.fillStyle = '#ec4899'  // Pink for emphasis
    ctx.font = 'bold 14px Inter, system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('RANDOMIZED PER HAND (deterministic - same handId = same variant)', 20, randomStartY)

    // Column headers
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Hand ID', 70, randomStartY + 25)
    ctx.fillText('Static Variant', 220, randomStartY + 25)
    ctx.fillText('Preview', 380, randomStartY + 25)
    ctx.fillText('Animated Variant', 550, randomStartY + 25)
    ctx.fillText('Preview', 720, randomStartY + 25)

    // Draw randomized badges for each demo hand
    const randomRowHeight = 50
    DEMO_HAND_IDS.forEach((handId, row) => {
      const y = randomStartY + 45 + row * randomRowHeight

      // Hand ID (truncated)
      ctx.fillStyle = '#64748b'
      ctx.font = '9px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(handId.slice(0, 18), 20, y + 18)

      // Get deterministic variants for this hand
      const staticVariant = getRandomStaticBadgeVariant(handId)
      const animatedVariant = getRandomAnimatedBadgeVariant(handId)

      // Static variant name
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '11px Inter, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(ACTION_BADGE_LABELS[staticVariant], 220, y + 18)

      // Static badge preview
      badge.draw({
        ctx,
        x: 380,
        y: y,
        action: 'RAISE',
        theme,
        scale: 0.85,
        variant: staticVariant,
        now,
      })

      // Animated variant name
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '11px Inter, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(ACTION_BADGE_LABELS[animatedVariant], 550, y + 18)

      // Animated badge preview (at current progress)
      badge.draw({
        ctx,
        x: 720,
        y: y,
        action: 'BET',
        theme,
        scale: 0.85,
        variant: animatedVariant,
        now,
        animProgress: progress,
      })
    })
  }

  // Initial render
  useEffect(() => {
    render(animProgress)
  }, [animProgress])

  // Animation loop
  const startAnimation = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setAnimProgress(0)

    const startTime = performance.now()
    const duration = 1500 // 1.5 seconds

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)

      setAnimProgress(progress)
      render(progress)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
  }

  const resetAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    setIsAnimating(false)
    setAnimProgress(0)
    render(0)
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-gray-900 min-h-screen">
      <canvas
        ref={canvasRef}
        className="border border-gray-700 rounded-lg shadow-xl"
      />

      <div className="flex gap-4">
        <button
          onClick={startAnimation}
          disabled={isAnimating}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
        >
          {isAnimating ? 'Playing...' : 'Play Animation'}
        </button>
        <button
          onClick={resetAnimation}
          className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="flex items-center gap-4 text-white">
        <label className="text-sm">Manual Progress:</label>
        <input
          type="range"
          min="0"
          max="100"
          value={animProgress * 100}
          onChange={(e) => {
            const newProgress = parseInt(e.target.value) / 100
            setAnimProgress(newProgress)
            render(newProgress)
          }}
          disabled={isAnimating}
          className="w-64"
        />
        <span className="text-sm w-12">{Math.round(animProgress * 100)}%</span>
      </div>

      <p className="text-gray-400 text-sm max-w-2xl text-center mt-4">
        This demo shows all 10 action badge variants. The top section shows static variants that are always visible.
        The middle section shows animated variants at different progress points (0%, 25%, 50%, 75%, 100%).
        The live animation section shows a real-time preview - click "Play Animation" to see them animate.
        <br /><br />
        <span className="text-pink-400">The bottom section demonstrates per-hand randomization</span> - each hand ID
        deterministically selects a static and animated variant. The same handId always gets the same variants,
        ensuring consistent appearance when replaying the same hand.
      </p>
    </div>
  )
}
