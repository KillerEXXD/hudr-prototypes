/**
 * Card Prototype Preview Component
 *
 * Interactive preview of all card designs and sizes.
 * Use this to visually compare and select the best design.
 *
 * Add to any page: <CardPrototypePreview />
 */

import { useEffect, useRef, useState } from 'react'
import {
  drawCardPrototype,
  HOLE_CARD_SIZES,
  COMMUNITY_CARD_SIZES,
  type CardDesign,
  type HoleCardSize,
  type CommunityCardSize,
} from './CardPrototypes'
import type { Card } from '@/types/hand'

const DESIGNS: CardDesign[] = ['clean', 'classic', 'ggpoker', 'premium', 'minimal']

const DESIGN_DESCRIPTIONS: Record<CardDesign, string> = {
  clean: 'Current design - White background, suit-colored border',
  classic: 'Traditional playing card - Cream background, dark border',
  ggpoker: 'GGPoker inspired - Bold colors, thick border, high contrast',
  premium: 'Luxury feel - Gold accents, subtle gradients',
  minimal: 'Ultra-clean - Rank in center, subtle styling',
}

const TEST_HANDS: [Card, Card][] = [
  [{ rank: 'A', suit: 'spades' }, { rank: 'A', suit: 'hearts' }],
  [{ rank: 'K', suit: 'hearts' }, { rank: 'Q', suit: 'hearts' }],
  [{ rank: '7', suit: 'diamonds' }, { rank: '2', suit: 'clubs' }],
]

const COMMUNITY_CARDS: Card[] = [
  { rank: 'A', suit: 'hearts' },
  { rank: 'K', suit: 'spades' },
  { rank: '10', suit: 'diamonds' },
  { rank: '5', suit: 'clubs' },
  { rank: '2', suit: 'hearts' },
]

export function CardPrototypePreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedDesign, setSelectedDesign] = useState<CardDesign>('ggpoker')
  const [holeCardSize, setHoleCardSize] = useState<HoleCardSize>('M')
  const [communityCardSize, setCommunityCardSize] = useState<CommunityCardSize>('L')
  const [showHighlight, setShowHighlight] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    // Clear canvas with dark background
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, width, height)

    const holeSize = HOLE_CARD_SIZES[holeCardSize]
    const commSize = COMMUNITY_CARD_SIZES[communityCardSize]

    let y = 20

    // Title
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 18px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`Design: ${selectedDesign.toUpperCase()}`, width / 2, y)
    y += 30

    // Description
    ctx.fillStyle = '#888888'
    ctx.font = '12px Arial'
    ctx.fillText(DESIGN_DESCRIPTIONS[selectedDesign], width / 2, y)
    y += 40

    // Community Cards Section
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(`Community Cards (${communityCardSize}: ${commSize.width}×${commSize.height}px)`, 20, y)
    y += 20

    // Draw community cards centered
    const totalCommWidth = COMMUNITY_CARDS.length * commSize.width + (COMMUNITY_CARDS.length - 1) * commSize.gap
    let commX = (width - totalCommWidth) / 2

    COMMUNITY_CARDS.forEach((card, idx) => {
      drawCardPrototype({
        ctx,
        x: commX,
        y,
        width: commSize.width,
        height: commSize.height,
        card,
        design: selectedDesign,
        highlight: showHighlight && idx === 0,
      })
      commX += commSize.width + commSize.gap
    })

    y += commSize.height + 40

    // Hole Cards Section
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(`Hole Cards (${holeCardSize}: ${holeSize.width}×${holeSize.height}px)`, 20, y)
    y += 20

    // Draw multiple hole card combinations
    const handWidth = holeSize.width * 2 - holeSize.gap
    const totalHandsWidth = TEST_HANDS.length * handWidth + (TEST_HANDS.length - 1) * 40
    let handX = (width - totalHandsWidth) / 2

    TEST_HANDS.forEach(([card1, card2], handIdx) => {
      // First card
      drawCardPrototype({
        ctx,
        x: handX,
        y,
        width: holeSize.width,
        height: holeSize.height,
        card: card1,
        design: selectedDesign,
        highlight: showHighlight && handIdx === 0,
      })
      // Second card (overlapping)
      drawCardPrototype({
        ctx,
        x: handX + holeSize.width - holeSize.gap,
        y,
        width: holeSize.width,
        height: holeSize.height,
        card: card2,
        design: selectedDesign,
        highlight: showHighlight && handIdx === 0,
      })

      handX += handWidth + 40
    })

    y += holeSize.height + 40

    // Face-down cards
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'left'
    ctx.fillText('Face-Down Cards', 20, y)
    y += 20

    // Community face-down
    let faceDownX = (width - (commSize.width + 40 + holeSize.width * 2 - holeSize.gap)) / 2

    drawCardPrototype({
      ctx,
      x: faceDownX,
      y,
      width: commSize.width,
      height: commSize.height,
      faceDown: true,
      design: selectedDesign,
    })

    faceDownX += commSize.width + 40

    // Hole cards face-down
    drawCardPrototype({
      ctx,
      x: faceDownX,
      y,
      width: holeSize.width,
      height: holeSize.height,
      faceDown: true,
      design: selectedDesign,
    })
    drawCardPrototype({
      ctx,
      x: faceDownX + holeSize.width - holeSize.gap,
      y,
      width: holeSize.width,
      height: holeSize.height,
      faceDown: true,
      design: selectedDesign,
    })

  }, [selectedDesign, holeCardSize, communityCardSize, showHighlight])

  return (
    <div className="bg-slate-900 p-4 rounded-lg">
      <h2 className="text-white text-xl font-bold mb-4">Card Design Prototypes</h2>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-4">
        {/* Design Selector */}
        <div>
          <label className="text-gray-400 text-sm block mb-1">Design</label>
          <select
            value={selectedDesign}
            onChange={(e) => setSelectedDesign(e.target.value as CardDesign)}
            className="bg-slate-800 text-white px-3 py-2 rounded border border-slate-700"
          >
            {DESIGNS.map((design) => (
              <option key={design} value={design}>
                {design.charAt(0).toUpperCase() + design.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Hole Card Size */}
        <div>
          <label className="text-gray-400 text-sm block mb-1">Hole Card Size</label>
          <select
            value={holeCardSize}
            onChange={(e) => setHoleCardSize(e.target.value as HoleCardSize)}
            className="bg-slate-800 text-white px-3 py-2 rounded border border-slate-700"
          >
            {Object.entries(HOLE_CARD_SIZES).map(([size, dims]) => (
              <option key={size} value={size}>
                {size}: {dims.width}×{dims.height}px
              </option>
            ))}
          </select>
        </div>

        {/* Community Card Size */}
        <div>
          <label className="text-gray-400 text-sm block mb-1">Community Card Size</label>
          <select
            value={communityCardSize}
            onChange={(e) => setCommunityCardSize(e.target.value as CommunityCardSize)}
            className="bg-slate-800 text-white px-3 py-2 rounded border border-slate-700"
          >
            {Object.entries(COMMUNITY_CARD_SIZES).map(([size, dims]) => (
              <option key={size} value={size}>
                {size}: {dims.width}×{dims.height}px
              </option>
            ))}
          </select>
        </div>

        {/* Highlight Toggle */}
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showHighlight}
              onChange={(e) => setShowHighlight(e.target.checked)}
              className="w-4 h-4"
            />
            Show Winner Highlight
          </label>
        </div>
      </div>

      {/* Canvas Preview */}
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg"
        style={{ height: '500px' }}
      />

      {/* Recommendations */}
      <div className="mt-4 p-4 bg-slate-800 rounded-lg">
        <h3 className="text-white font-bold mb-2">Recommendations</h3>
        <ul className="text-gray-400 text-sm space-y-1">
          <li>• <strong>Community Cards:</strong> L (48×72) or XL (56×84) for better visibility</li>
          <li>• <strong>Hole Cards:</strong> M (36×52) or L (44×64) for clearer rank/suit</li>
          <li>• <strong>Design:</strong> GGPoker for mobile (bold, high contrast), Premium for desktop</li>
          <li>• <strong>Current:</strong> XS hole cards (20×28), S community cards (32×48)</li>
        </ul>
      </div>

      {/* All Designs Comparison */}
      <div className="mt-4">
        <h3 className="text-white font-bold mb-2">Quick Design Comparison</h3>
        <div className="flex flex-wrap gap-2">
          {DESIGNS.map((design) => (
            <button
              key={design}
              onClick={() => setSelectedDesign(design)}
              className={`px-3 py-2 rounded text-sm ${
                selectedDesign === design
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              {design.charAt(0).toUpperCase() + design.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CardPrototypePreview
