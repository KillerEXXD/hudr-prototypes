/**
 * Centered Badge Prototype Preview Component (BUG-179)
 *
 * Visual prototype showing action badges centered ON the avatar
 * vs the current positioning (above/below the avatar).
 *
 * This addresses the UX issue where:
 * - ALL-IN badges hide the bet amount chips
 * - FOLD badges hide the hole cards
 *
 * Add to any page: <CenteredBadgePrototype />
 */

import { useEffect, useRef, useState } from 'react'

// Player position types
type PlayerPosition = 'top' | 'bottom' | 'left' | 'right'

interface MockPlayer {
  name: string
  stack: number
  position: PlayerPosition
  action?: string
  amount?: number
  cards?: [string, string]
  isAllIn?: boolean
}

// Avatar/frame dimensions (scaled)
const FRAME_RADIUS = 28
const NAME_BOX_HEIGHT = 32
const CARD_WIDTH = 36
const CARD_HEIGHT = 52

/**
 * Draw a single player with badge in either current or centered position
 */
function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  player: MockPlayer,
  scale: number,
  useCenteredBadge: boolean
) {
  const frameRadius = FRAME_RADIUS * scale
  const nameBoxHeight = NAME_BOX_HEIGHT * scale
  const cardWidth = CARD_WIDTH * scale
  const cardHeight = CARD_HEIGHT * scale

  // Frame center position
  const frameY = y - nameBoxHeight / 2 - frameRadius + 4 * scale

  // Draw laurel wreath frame (simplified)
  ctx.beginPath()
  ctx.arc(x, frameY, frameRadius, 0, Math.PI * 2)
  ctx.strokeStyle = player.action === 'ALL-IN' ? 'rgba(220, 38, 38, 0.9)' : 'rgba(148, 163, 184, 0.7)'
  ctx.lineWidth = 2 * scale
  ctx.stroke()

  // Draw hole cards inside frame
  if (player.cards) {
    const card1X = x - cardWidth + 2 * scale
    const card2X = x - 2 * scale
    const cardY = frameY - cardHeight / 2

    // Card 1
    ctx.fillStyle = '#ffffff'
    drawRoundedRect(ctx, card1X, cardY, cardWidth, cardHeight, 4 * scale)
    ctx.fill()
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 1
    ctx.stroke()

    // Card text
    ctx.fillStyle = player.cards[0].includes('h') || player.cards[0].includes('d') ? '#dc2626' : '#1e293b'
    ctx.font = `bold ${Math.round(14 * scale)}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(player.cards[0], card1X + cardWidth / 2, cardY + cardHeight / 2)

    // Card 2
    ctx.fillStyle = '#ffffff'
    drawRoundedRect(ctx, card2X, cardY, cardWidth, cardHeight, 4 * scale)
    ctx.fill()
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = player.cards[1].includes('h') || player.cards[1].includes('d') ? '#dc2626' : '#1e293b'
    ctx.fillText(player.cards[1], card2X + cardWidth / 2, cardY + cardHeight / 2)
  }

  // Draw name box
  const nameBoxY = frameY + frameRadius + 2 * scale
  const nameBoxWidth = 72 * scale
  drawRoundedRect(ctx, x - nameBoxWidth / 2, nameBoxY, nameBoxWidth, nameBoxHeight, 6 * scale)
  ctx.fillStyle = 'rgba(20, 30, 50, 0.94)'
  ctx.fill()

  // Name text
  ctx.fillStyle = '#e2e8f0'
  ctx.font = `600 ${Math.round(11 * scale)}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(player.name, x, nameBoxY + 10 * scale)

  // Stack text
  ctx.fillStyle = '#fbbf24'
  ctx.font = `bold ${Math.round(12 * scale)}px Arial`
  ctx.fillText(formatStack(player.stack), x, nameBoxY + 22 * scale)

  // Draw action badge
  if (player.action) {
    const badgeColors: Record<string, string> = {
      'ALL-IN': 'rgba(220, 38, 38, 0.95)',
      'FOLD': 'rgba(220, 38, 38, 0.95)',
      'CALL': 'rgba(34, 197, 94, 0.95)',
      'CHECK': 'rgba(34, 197, 94, 0.8)',
      'RAISE': 'rgba(59, 130, 246, 0.95)',
      'BET': 'rgba(234, 179, 8, 0.95)',
    }

    // CURRENT vs CENTERED positioning
    let badgeY: number
    if (useCenteredBadge) {
      // PROTOTYPE: Badge centered ON the avatar
      badgeY = frameY
    } else {
      // CURRENT: Badge above/below avatar based on position
      if (player.position === 'top') {
        badgeY = nameBoxY + nameBoxHeight + 8 * scale
      } else {
        badgeY = frameY - frameRadius - 14 * scale
      }
    }

    // Draw badge pill
    const badgeText = player.action
    ctx.font = `bold ${Math.round(12 * scale)}px Arial`
    const textWidth = ctx.measureText(badgeText).width
    const badgeWidth = textWidth + 16 * scale
    const badgeHeight = 22 * scale

    // Badge shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 4 * scale

    drawRoundedRect(ctx, x - badgeWidth / 2, badgeY - badgeHeight / 2, badgeWidth, badgeHeight, badgeHeight / 2)
    ctx.fillStyle = badgeColors[player.action] || 'rgba(100, 116, 139, 0.9)'
    ctx.fill()

    ctx.shadowBlur = 0

    // Badge text
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(badgeText, x, badgeY)
  }

  // Draw bet amount chip (if player has bet)
  if (player.amount && player.amount > 0) {
    const chipY = player.position === 'top'
      ? frameY + frameRadius + nameBoxHeight + 30 * scale
      : frameY - frameRadius - 40 * scale

    // Chip circle
    ctx.beginPath()
    ctx.arc(x, chipY, 14 * scale, 0, Math.PI * 2)
    ctx.fillStyle = '#fbbf24'
    ctx.fill()
    ctx.strokeStyle = '#92400e'
    ctx.lineWidth = 2 * scale
    ctx.stroke()

    // Amount text below chip
    ctx.fillStyle = '#fbbf24'
    ctx.font = `bold ${Math.round(11 * scale)}px Arial`
    ctx.textAlign = 'center'
    ctx.fillText(formatStack(player.amount), x, chipY + 22 * scale)
  }
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function formatStack(amount: number): string {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`
  return amount.toString()
}

// Player layouts for different table sizes
const LAYOUTS: Record<number, Array<{ x: number; y: number; position: PlayerPosition }>> = {
  2: [
    { x: 50, y: 85, position: 'bottom' },
    { x: 50, y: 20, position: 'top' },
  ],
  6: [
    { x: 50, y: 88, position: 'bottom' },
    { x: 15, y: 65, position: 'left' },
    { x: 15, y: 35, position: 'left' },
    { x: 50, y: 15, position: 'top' },
    { x: 85, y: 35, position: 'right' },
    { x: 85, y: 65, position: 'right' },
  ],
  9: [
    { x: 50, y: 88, position: 'bottom' },
    { x: 16, y: 74, position: 'left' },
    { x: 8, y: 52, position: 'left' },
    { x: 12, y: 30, position: 'left' },
    { x: 30, y: 14, position: 'top' },
    { x: 70, y: 14, position: 'top' },
    { x: 88, y: 30, position: 'right' },
    { x: 92, y: 52, position: 'right' },
    { x: 84, y: 74, position: 'right' },
  ],
}

// Test scenarios with different actions
const TEST_PLAYERS: MockPlayer[] = [
  { name: 'Hero', stack: 125000, position: 'bottom', action: 'ALL-IN', amount: 125000, cards: ['Ah', 'Ks'], isAllIn: true },
  { name: 'Villain', stack: 85000, position: 'left', action: 'CALL', amount: 50000, cards: ['Qh', 'Qd'] },
  { name: 'Fish', stack: 45000, position: 'left', action: 'FOLD', cards: ['7c', '2s'] },
  { name: 'Shark', stack: 200000, position: 'top', action: 'RAISE', amount: 30000, cards: ['Jh', 'Js'] },
  { name: 'Whale', stack: 500000, position: 'right', action: 'CHECK', cards: ['9d', '8d'] },
  { name: 'Donk', stack: 30000, position: 'right', action: 'BET', amount: 15000, cards: ['Ac', 'Tc'] },
  { name: 'Pro', stack: 175000, position: 'top', action: 'CALL', cards: ['Kh', 'Kc'] },
  { name: 'Nit', stack: 90000, position: 'left', action: 'FOLD', cards: ['6h', '5h'] },
  { name: 'LAG', stack: 150000, position: 'bottom', cards: ['Ad', 'Qc'] },
]

export function CenteredBadgePrototype() {
  const currentCanvasRef = useRef<HTMLCanvasElement>(null)
  const proposedCanvasRef = useRef<HTMLCanvasElement>(null)
  const [playerCount, setPlayerCount] = useState<2 | 6 | 9>(6)

  useEffect(() => {
    const drawCanvas = (canvas: HTMLCanvasElement | null, useCenteredBadge: boolean) => {
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dpr = window.devicePixelRatio || 1
      const width = canvas.clientWidth
      const height = canvas.clientHeight

      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.scale(dpr, dpr)

      // Clear with dark felt background
      ctx.fillStyle = '#1a472a'
      ctx.fillRect(0, 0, width, height)

      // Draw table shape
      ctx.beginPath()
      ctx.ellipse(width / 2, height / 2, width * 0.4, height * 0.35, 0, 0, Math.PI * 2)
      ctx.strokeStyle = '#2d5a3d'
      ctx.lineWidth = 4
      ctx.stroke()

      // Get layout for player count
      const layout = LAYOUTS[playerCount]
      const players = TEST_PLAYERS.slice(0, playerCount)

      // Draw each player
      layout.forEach((pos, idx) => {
        const player = players[idx]
        if (!player) return

        const playerX = (pos.x / 100) * width
        const playerY = (pos.y / 100) * height
        const scale = pos.position === 'top' ? 0.85 : 1.0

        drawPlayer(ctx, playerX, playerY, { ...player, position: pos.position }, scale, useCenteredBadge)
      })

      // Draw label
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      drawRoundedRect(ctx, 10, height - 30, useCenteredBadge ? 180 : 150, 22, 4)
      ctx.fill()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'left'
      ctx.fillText(useCenteredBadge ? 'PROPOSED: Badge ON Avatar' : 'CURRENT: Badge Above/Below', 16, height - 15)
    }

    drawCanvas(currentCanvasRef.current, false)
    drawCanvas(proposedCanvasRef.current, true)
  }, [playerCount])

  return (
    <div className="bg-slate-900 p-4 rounded-lg">
      <h2 className="text-white text-xl font-bold mb-2">BUG-179: Centered Action Badge Prototype</h2>
      <p className="text-gray-400 text-sm mb-4">
        Comparing current badge positioning (above/below avatar) vs proposed (centered ON avatar).
        Notice how centered badges don't overlap with chips or cards.
      </p>

      {/* Player Count Selector */}
      <div className="mb-4">
        <label className="text-gray-400 text-sm block mb-2">Player Count</label>
        <div className="flex gap-2">
          {([2, 6, 9] as const).map((count) => (
            <button
              key={count}
              onClick={() => setPlayerCount(count)}
              className={`px-4 py-2 rounded text-sm font-medium ${
                playerCount === count
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              {count} Players
            </button>
          ))}
        </div>
      </div>

      {/* Side by Side Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Positioning */}
        <div>
          <h3 className="text-red-400 font-bold mb-2 text-center">CURRENT (Issue)</h3>
          <canvas
            ref={currentCanvasRef}
            className="w-full rounded-lg border border-red-500/30"
            style={{ height: '350px' }}
          />
          <p className="text-red-400 text-xs mt-1 text-center">
            Badge overlaps with chips/cards
          </p>
        </div>

        {/* Proposed Positioning */}
        <div>
          <h3 className="text-green-400 font-bold mb-2 text-center">PROPOSED (Fix)</h3>
          <canvas
            ref={proposedCanvasRef}
            className="w-full rounded-lg border border-green-500/30"
            style={{ height: '350px' }}
          />
          <p className="text-green-400 text-xs mt-1 text-center">
            Badge centered on avatar, chips/cards visible
          </p>
        </div>
      </div>

      {/* Issue Summary */}
      <div className="mt-4 p-4 bg-slate-800 rounded-lg">
        <h3 className="text-white font-bold mb-2">Issue Summary (BUG-179)</h3>
        <ul className="text-gray-400 text-sm space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-red-400">Current:</span>
            <span>ALL-IN badge positioned above frame hides the bet amount chips below</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400">Current:</span>
            <span>FOLD badge positioned above frame covers the hole cards area</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">Proposed:</span>
            <span>Center all action badges ON the avatar (at frame.y), keeping chips and cards visible</span>
          </li>
        </ul>
      </div>

      {/* Implementation Notes */}
      <div className="mt-4 p-4 bg-blue-900/30 rounded-lg border border-blue-500/30">
        <h3 className="text-blue-400 font-bold mb-2">Implementation</h3>
        <p className="text-gray-300 text-sm">
          In <code className="bg-slate-700 px-1 rounded">Player.ts</code>, change badge Y position from{' '}
          <code className="bg-slate-700 px-1 rounded">layout.statusAnchor.y</code> to{' '}
          <code className="bg-slate-700 px-1 rounded">layout.frame.y</code> (the avatar center).
        </p>
        <pre className="mt-2 bg-slate-800 p-2 rounded text-xs text-gray-300 overflow-x-auto">
{`// Current:
let badgeY = layout.statusAnchor.y

// Proposed:
let badgeY = layout.frame.y`}
        </pre>
      </div>
    </div>
  )
}

export default CenteredBadgePrototype
