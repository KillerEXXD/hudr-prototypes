import type { SeatPosition } from '../types/canvas-types'
import { logger } from '@/lib/logger'

// =====================
// Layout Mode Types
// =====================

export type LayoutMode = 'landscape' | 'portrait'

/**
 * Fixed 10-seat positions for poker table with perspective view.
 * Each entry contains [x%, y%] coordinates.
 * Seat 0 is at the bottom center (BTN), going LEFT (clockwise around physical table).
 *
 * Visual layout (viewer looking at screen):
 *         [4]      [5]
 *       [3]          [6]
 *      [2]            [7]
 *       [1/SB]      [8]
 *            [0/BTN]
 *              [9]
 *
 * Clockwise around physical table = LEFT on screen from BTN's perspective:
 * BTN(0) → SB(1, bottom-left) → BB(2, left) → ... → CO(9, top)
 */
const FIXED_10_SEAT_POSITIONS: Array<[number, number]> = [
  [50, 93],  // 0: bottom center (BTN)
  [24, 84],  // 1: bottom-LEFT (SB - clockwise from BTN)
  [10, 64],  // 2: left-lower (BB)
  [12, 42],  // 3: left-upper
  [32, 18],  // 4: top-left
  [68, 18],  // 5: top-right
  [88, 42],  // 6: right-upper
  [90, 64],  // 7: right-lower
  [76, 84],  // 8: bottom-right
  [50, 10],  // 9: top center (CO)
]

// =====================
// Portrait Mode Coordinates (Mobile-First)
// =====================

/**
 * Portrait mode 9-seat positions for mobile-first vertical oval table.
 * Optimized for portrait aspect ratio (~1:1.8).
 *
 * Layout:
 * - BTN at bottom center (seat 0)
 * - Seats go LEFT from BTN (clockwise around table = left from viewer's perspective)
 * - SB is to the LEFT of BTN, BB is further left, etc.
 *
 * Visual layout (viewer looking at phone screen):
 *         [4]      [5]
 *       [3]          [6]
 *      [2]            [7]
 *       [1/SB]      [8]
 *            [0/BTN]
 *
 * Clockwise around physical table = LEFT on screen from BTN's perspective
 *
 * NOTE: Top seats (4, 5) positioned at y=16 to be on table edge/circumference
 */
const PORTRAIT_9_SEAT_POSITIONS: Array<[number, number]> = [
  [50, 88],  // 0: bottom center (BTN) - slightly higher to leave room for controls
  [16, 74],  // 1: bottom-LEFT (SB - clockwise from BTN)
  [6, 52],   // 2: left-lower (BB)
  [10, 32],  // 3: left-upper
  [30, 16],  // 4: top-left - on table circumference
  [70, 16],  // 5: top-right - on table circumference
  [90, 32],  // 6: right-upper
  [94, 52],  // 7: right-lower
  [84, 74],  // 8: bottom-right (CO - just before BTN)
]

/**
 * Portrait mode table parameters for vertical oval shape.
 * Table is taller than wide, optimized for mobile portrait screens.
 * Table is shifted slightly down to give more room for close button at top.
 */
const PORTRAIT_TABLE_PARAMS = {
  centerX: 50,
  centerY: 52,       // Shifted down slightly to give room for close button at top
  radiusX: 38,       // Narrower horizontal radius for portrait
  radiusY: 36,       // Reduced from 42 to keep players inside table bounds
  topWidthRatio: 0.85,  // More tapered at top for depth
  seatOffset: 1.12,     // Seats slightly further from table edge
}

// =====================
// Perspective Table Parameters
// =====================

/**
 * Table perspective configuration matching Table.ts
 * The table is a pill/oval shape with the top narrower than the bottom
 */
const TABLE_PERSPECTIVE = {
  // Center of the table in percentage coordinates
  centerX: 50,
  centerY: 50,
  // Semi-axes of the pill shape (percentage of canvas)
  // These define the path seats follow around the table edge
  radiusX: 42,      // Horizontal radius (wider)
  radiusY: 40,      // Vertical radius
  // Perspective taper: top is narrower than bottom
  topWidthRatio: 0.9,
  // Offset seats slightly outside the table edge
  seatOffset: 1.08,
}

/**
 * Calculate a point on the perspective pill-shaped table edge.
 * Uses parametric equations adjusted for perspective taper.
 *
 * @param angle Angle in radians (0 = right, PI/2 = bottom, PI = left, 3PI/2 = top)
 * @returns [x%, y%] coordinates on the table edge
 */
function getPointOnPerspectiveTable(angle: number): [number, number] {
  const { centerX, centerY, radiusX, radiusY, topWidthRatio, seatOffset } = TABLE_PERSPECTIVE

  // Basic ellipse point
  const baseX = Math.cos(angle) * radiusX * seatOffset
  const baseY = Math.sin(angle) * radiusY * seatOffset

  // Apply perspective taper based on Y position
  // Top of table (negative Y from center) is narrower
  const yNormalized = baseY / (radiusY * seatOffset) // -1 to 1
  const taperFactor = 1 - (1 - topWidthRatio) * (1 - yNormalized) / 2

  const x = centerX + baseX * taperFactor
  const y = centerY + baseY

  return [x, y]
}

/**
 * Calculate dynamic seat positions based on player count.
 * Distributes seats evenly around the perspective pill table,
 * always placing seat 0 at the bottom center (hero position).
 *
 * @param playerCount Number of players (2-10)
 * @returns Array of [x%, y%] positions for each seat
 */
export function calculateDynamicSeatPositions(playerCount: number): Array<[number, number]> {
  const count = Math.max(2, Math.min(10, playerCount))

  // Special case: use fixed positions for 10 players (optimized layout)
  if (count === 10) {
    return [...FIXED_10_SEAT_POSITIONS]
  }

  const positions: Array<[number, number]> = []

  // Start at bottom center (PI/2 radians = 90 degrees in screen coords where Y increases downward)
  // Go LEFT on screen (counter-clockwise on screen = clockwise around physical table)
  // Adding angle moves: 90° → 180° (left) → 270° (top) → 0°/360° (right) → back to 90° (bottom)
  const startAngle = Math.PI / 2  // Bottom center
  const angleStep = (2 * Math.PI) / count

  for (let i = 0; i < count; i++) {
    // LEFT on screen (clockwise around physical table): ADD angle
    const angle = startAngle + (i * angleStep)
    const [x, y] = getPointOnPerspectiveTable(angle)
    positions.push([x, y])
  }

  return positions
}

/**
 * Calculate perspective scale based on Y position
 * Players at the top (far) are smaller, players at the bottom (near) are larger
 * @param yPercent Y position as percentage (0-100, where 0 is top/far)
 * @returns Scale factor (0.82 at top to 1.05 at bottom)
 */
function calculatePerspectiveScale(yPercent: number): number {
  const normalizedY = yPercent / 100
  const minScale = 0.82
  const maxScale = 1.05
  return minScale + (maxScale - minScale) * normalizedY
}

/**
 * Get the normalized position for a specific seat index (0-9).
 * Always uses the fixed 10-seat layout.
 */
export function getSeatPositionNormalized(seatIndex: number): SeatPosition {
  const idx = Math.max(0, Math.min(9, seatIndex))
  const pos = FIXED_10_SEAT_POSITIONS[idx]

  // Calculate angle for dealer chip positioning (pointing toward center)
  const dx = pos[0] - 50
  const dy = pos[1] - 50
  const angle = Math.atan2(dy, dx)

  // Calculate perspective scale based on Y position
  const scale = calculatePerspectiveScale(pos[1])

  return { x: pos[0], y: pos[1], angle, scale }
}

export interface BuildSeatPositionsOptions {
  /** Number of players - if provided, distributes seats dynamically */
  playerCount?: number
  /** Custom position overrides (percentages). Use undefined to skip overriding a position. */
  overrides?: Array<{ x: number; y: number; scale?: number } | undefined>
}

/**
 * Build seat positions scaled to canvas dimensions.
 *
 * If `playerCount` is provided, positions are dynamically distributed
 * evenly around the table based on the actual number of players.
 * Otherwise, uses the fixed 10-seat layout.
 *
 * @param width Canvas width in pixels
 * @param height Canvas height in pixels
 * @param options Configuration options (playerCount, overrides)
 */
export function buildSeatPositions(
  width: number,
  height: number,
  options?: BuildSeatPositionsOptions | Array<{ x: number; y: number; scale?: number }>
): SeatPosition[] {
  // Guard against invalid inputs
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return []
  }
  if (width <= 0 || height <= 0) {
    return []
  }

  // Handle legacy array format for backwards compatibility
  const opts: BuildSeatPositionsOptions = Array.isArray(options)
    ? { overrides: options }
    : options ?? {}

  const { playerCount, overrides } = opts

  // Determine base positions: dynamic if playerCount provided, otherwise fixed 10
  const basePositions = playerCount !== undefined
    ? calculateDynamicSeatPositions(playerCount)
    : FIXED_10_SEAT_POSITIONS

  const positions: SeatPosition[] = []

  for (let i = 0; i < basePositions.length; i++) {
    const override = overrides?.[i]
    const defaultPos = basePositions[i]

    const x = override && Number.isFinite(override.x) ? override.x : defaultPos[0]
    const y = override && Number.isFinite(override.y) ? override.y : defaultPos[1]
    const angle = Math.atan2(y - 50, x - 50)
    const scale = override?.scale ?? calculatePerspectiveScale(y)

    positions.push({
      x: (x / 100) * width,
      y: (y / 100) * height,
      angle,
      scale,
    })
  }

  return positions
}

// Legacy export for backwards compatibility - deprecated
/** @deprecated Use getSeatPositionNormalized instead */
export const calculateSeatPositionNormalized = getSeatPositionNormalized

// =====================
// Portrait Mode Functions (Mobile-First)
// =====================

/**
 * Calculate a point on the portrait mode vertical oval table.
 * Uses parametric equations for a vertically-oriented ellipse.
 *
 * @param angle Angle in radians (0 = right, PI/2 = bottom, PI = left, 3PI/2 = top)
 * @returns [x%, y%] coordinates on the table edge
 */
function getPointOnPortraitTable(angle: number): [number, number] {
  const { centerX, centerY, radiusX, radiusY, topWidthRatio, seatOffset } = PORTRAIT_TABLE_PARAMS

  // Basic ellipse point
  const baseX = Math.cos(angle) * radiusX * seatOffset
  const baseY = Math.sin(angle) * radiusY * seatOffset

  // Apply perspective taper (top is narrower)
  const yNormalized = baseY / (radiusY * seatOffset)
  const taperFactor = 1 - (1 - topWidthRatio) * (1 - yNormalized) / 2

  const x = centerX + baseX * taperFactor
  const y = centerY + baseY

  return [x, y]
}

// =====================
// Fixed Portrait Seat Positions Per Player Count (2-8)
// =====================

/**
 * Hand-tuned fixed positions for each player count in portrait mode.
 * Optimized to maximize spacing and avoid element overlaps at each count.
 *
 * Layout principles:
 * - 2 players: Top/bottom only, maximizes vertical distance
 * - 3 players: Triangle layout with wide spacing
 * - 4 players: Diamond layout
 * - 5-6 players: Standard poker table distribution
 * - 7-8 players: Tighter spacing, positions match 9-seat subset
 *
 * All coordinates are [x%, y%] where:
 * - Seat 0 = BTN (always bottom center)
 * - Seats go clockwise around physical table (LEFT on screen from BTN)
 */
const PORTRAIT_FIXED_POSITIONS: Record<number, Array<[number, number]>> = {
  2: [
    [50, 82],  // 0: BTN — bottom center
    [50, 20],  // 1: BB — top center (wide vertical spacing)
  ],
  3: [
    [50, 85],  // 0: BTN — bottom center
    [15, 45],  // 1: SB — left middle
    [85, 45],  // 2: BB — right middle (triangle)
  ],
  4: [
    [50, 88],  // 0: BTN — bottom
    [12, 60],  // 1: SB — left-lower
    [50, 18],  // 2: BB — top center
    [88, 60],  // 3: UTG — right-lower (diamond)
  ],
  5: [
    [50, 88],  // 0: BTN
    [14, 68],  // 1: SB — bottom-left
    [10, 38],  // 2: BB — left-upper
    [90, 38],  // 3: UTG — right-upper
    [86, 68],  // 4: CO — bottom-right
  ],
  6: [
    [50, 88],  // 0: BTN
    [14, 72],  // 1: SB
    [8, 44],   // 2: BB
    [30, 17],  // 3: UTG — top-left
    [70, 17],  // 4: HJ — top-right
    [92, 44],  // 5: CO — right
  ],
  7: [
    [50, 88],  // 0: BTN
    [16, 74],  // 1: SB
    [6, 50],   // 2: BB
    [14, 28],  // 3: UTG
    [50, 16],  // 4: MP — top center
    [86, 28],  // 5: HJ
    [94, 50],  // 6: CO
  ],
  8: [
    [50, 88],  // 0: BTN
    [16, 74],  // 1: SB
    [6, 52],   // 2: BB
    [10, 32],  // 3: UTG
    [30, 16],  // 4: UTG+1 — top-left
    [70, 16],  // 5: MP — top-right
    [90, 32],  // 6: HJ
    [94, 52],  // 7: CO
  ],
}

/**
 * Calculate seat positions for portrait mode based on player count.
 * Uses hand-tuned fixed positions for all player counts (2-9).
 * Seat 0 is always at bottom center (BTN position).
 * Seats go LEFT on screen (clockwise around physical table).
 *
 * @param playerCount Number of players (2-9)
 * @returns Array of [x%, y%] positions for each seat
 */
export function calculatePortraitSeatPositions(playerCount: number): Array<[number, number]> {
  const count = Math.max(2, Math.min(9, playerCount))

  // Use fixed positions for 9 players
  if (count === 9) {
    return [...PORTRAIT_9_SEAT_POSITIONS]
  }

  // Use hand-tuned fixed positions for 2-8 players
  const fixed = PORTRAIT_FIXED_POSITIONS[count]
  if (fixed) {
    return fixed.map(pos => [...pos])
  }

  // Fallback to dynamic calculation (shouldn't reach here)
  const positions: Array<[number, number]> = []
  const startAngle = Math.PI / 2
  const angleStep = (2 * Math.PI) / count

  for (let i = 0; i < count; i++) {
    const angle = startAngle + (i * angleStep)
    const [x, y] = getPointOnPortraitTable(angle)
    positions.push([x, y])
  }

  return positions
}

/**
 * Calculate perspective scale for portrait mode.
 * Players at the top (far) are smaller, players at the bottom (near) are larger.
 * Portrait mode has less dramatic scaling since the table is more vertical.
 *
 * @param yPercent Y position as percentage (0-100, where 0 is top/far)
 * @returns Scale factor (0.85 at top to 1.0 at bottom)
 */
function calculatePortraitPerspectiveScale(yPercent: number): number {
  const normalizedY = yPercent / 100
  const minScale = 0.85  // Slightly larger minimum for portrait
  const maxScale = 1.0   // Less dramatic max scale
  return minScale + (maxScale - minScale) * normalizedY
}

/**
 * Get normalized position for a specific seat in portrait mode.
 * Uses the fixed 9-seat portrait layout.
 */
export function getPortraitSeatPositionNormalized(seatIndex: number): SeatPosition {
  const idx = Math.max(0, Math.min(8, seatIndex))
  const pos = PORTRAIT_9_SEAT_POSITIONS[idx]

  // Calculate angle pointing toward center
  const dx = pos[0] - 50
  const dy = pos[1] - 50
  const angle = Math.atan2(dy, dx)

  // Calculate perspective scale
  const scale = calculatePortraitPerspectiveScale(pos[1])

  return { x: pos[0], y: pos[1], angle, scale }
}

/**
 * Build seat positions for portrait mode, scaled to canvas dimensions.
 *
 * @param width Canvas width in pixels
 * @param height Canvas height in pixels
 * @param playerCount Number of players (2-9)
 * @param dealerSeatIndex The seat index where the dealer button is located
 * @returns Array of SeatPosition with dealer at index 0 (bottom center)
 */
export function buildPortraitSeatPositions(
  width: number,
  height: number,
  playerCount: number,
  dealerSeatIndex: number = 0
): SeatPosition[] {
  // Guard against invalid inputs
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return []
  }
  if (width <= 0 || height <= 0) {
    return []
  }

  const count = Math.max(2, Math.min(9, playerCount))
  const basePositions = calculatePortraitSeatPositions(count)

  // Rotate positions so dealer is at bottom center (position 0)
  // This ensures the dealer button holder is always at the bottom of the screen
  const rotatedPositions = rotatePositionsForDealer(basePositions, dealerSeatIndex)

  const positions: SeatPosition[] = []

  for (let i = 0; i < rotatedPositions.length; i++) {
    const pos = rotatedPositions[i]
    const angle = Math.atan2(pos[1] - 50, pos[0] - 50)
    const scale = calculatePortraitPerspectiveScale(pos[1])

    positions.push({
      x: (pos[0] / 100) * width,
      y: (pos[1] / 100) * height,
      angle,
      scale,
    })
  }

  return positions
}

/**
 * Rotate seat positions so that a specific player index ends up at visual position 0 (bottom center),
 * with subsequent players going CLOCKWISE around the table (to the RIGHT from viewer's perspective).
 *
 * Visual layout (portrait mode, 6 players example):
 *         [3]      [2]
 *        [4]        [1]
 *            [0/BTN]
 *             [5]
 *
 * Base positions array (PORTRAIT_9_SEAT_POSITIONS) indices go CLOCKWISE:
 * 0=bottom, 1=bottom-right (SB), 2=right-upper, 3=top, 4=left-upper, 5=bottom-left
 *
 * In poker, action goes CLOCKWISE around the physical table.
 * From the VIEWER's perspective (looking down at table), clockwise = RIGHT direction.
 * So if dealer is at position 0 (bottom), SB should be at position 1 (bottom-RIGHT),
 * then BB at position 2, etc.
 *
 * This function creates a mapping where:
 * - rotated[playerIndex] = the visual position for that player
 * - Player at dealerPlayerIndex → visual position 0 (bottom)
 * - Player at dealerPlayerIndex+1 → visual position 1 (bottom-right, SB)
 * - Player at dealerPlayerIndex+2 → visual position 2 (BB)
 * - etc.
 *
 * @param positions Original seat positions (visual positions going clockwise from bottom)
 * @param dealerPlayerIndex The player array index that should be placed at position 0 (bottom)
 * @returns Reordered positions array where rotated[playerIndex] gives visual position for that player
 */
function rotatePositionsForDealer(
  positions: Array<[number, number]>,
  dealerPlayerIndex: number
): Array<[number, number]> {
  const count = positions.length
  if (count === 0) return []

  // Normalize dealer index to handle wraparound
  const normalizedDealer = ((dealerPlayerIndex % count) + count) % count

  // Create rotated array where rotated[playerIndex] gives visual position for that player
  // We want:
  // - Player at dealerPlayerIndex (BTN) → positions[0] (bottom center)
  // - Player at dealerPlayerIndex+1 (SB) → positions[1] (bottom-right, clockwise from BTN)
  // - Player at dealerPlayerIndex+2 (BB) → positions[2] (right side)
  // - etc.
  //
  // The mapping is: rotated[i] = positions[(i - dealerPlayerIndex + count) % count]
  // This means player i gets the visual position that is (i - dealer) steps clockwise from bottom
  const rotated: Array<[number, number]> = []
  const debugMapping: Array<{ playerIndex: number; offset: number; positionXY: [number, number] }> = []

  for (let playerIndex = 0; playerIndex < count; playerIndex++) {
    // How many steps clockwise from dealer is this player?
    // Player at dealerIndex: offset = 0 → positions[0] (bottom)
    // Player at dealerIndex+1: offset = 1 → positions[1] (bottom-right)
    // Player at dealerIndex-1 (or +count-1): offset = count-1 → positions[count-1] (bottom-left)
    const offsetFromDealer = ((playerIndex - normalizedDealer) + count) % count
    const pos = positions[offsetFromDealer]
    rotated.push(pos)
    debugMapping.push({ playerIndex, offset: offsetFromDealer, positionXY: pos })
  }

  // Debug: Log the rotation mapping
  logger.debug('[rotatePositionsForDealer] Rotation mapping:', {
    dealerPlayerIndex,
    normalizedDealer,
    count,
    basePositions: positions.map((p, i) => ({ index: i, x: p[0], y: p[1] })),
    mapping: debugMapping.map(m => ({
      playerIdx: m.playerIndex,
      posIdx: m.offset,
      x: m.positionXY[0],
      y: m.positionXY[1],
    })),
  })

  return rotated
}

// =====================
// Position-Based Seat Assignment (Clockwise Action Order)
// =====================

/**
 * Player interface for action order sorting.
 * This matches the ReplayPlayer structure used by the canvas replayer.
 */
interface PlayerForOrdering {
  id: string
  name: string
  position?: string
  seatNumber: number
}

/**
 * Rotate players so BTN is first, maintaining seat_number (clockwise) order.
 *
 * IMPORTANT: seat_number already represents clockwise physical seating.
 * We just need to rotate so the BTN player is at index 0.
 *
 * Example with 6 players (seat numbers 1-6):
 * - Original order: [Seat1, Seat2, Seat3, Seat4, Seat5, Seat6]
 * - If BTN is at Seat3: [Seat3(BTN), Seat4(SB), Seat5(BB), Seat6(UTG), Seat1(HJ), Seat2(CO)]
 *
 * The returned array index IS the visual position:
 * - index 0 = BTN (visual position 0, bottom center)
 * - index 1 = SB (visual position 1, bottom-right, clockwise from BTN)
 * - index 2 = BB (visual position 2, right side)
 * - etc.
 *
 * @param players Array of players sorted by seat_number (clockwise order)
 * @returns Players rotated so BTN is at index 0, maintaining clockwise order
 */
export function getPlayerActionOrder<T extends PlayerForOrdering>(players: T[]): T[] {
  if (players.length === 0) return []

  // Find the BTN player
  const btnIndex = players.findIndex(p => p.position?.toUpperCase() === 'BTN')

  // If no BTN found, return as-is (shouldn't happen in valid hands)
  if (btnIndex === -1) {
    console.warn('[getPlayerActionOrder] No BTN player found, using original order')
    return [...players]
  }

  // Rotate array so BTN is at index 0
  // Players after BTN in the array are clockwise from BTN (SB, BB, UTG, ...)
  // Players before BTN wrap around (CO is just before BTN)
  const rotated: T[] = []
  const count = players.length

  for (let i = 0; i < count; i++) {
    const sourceIndex = (btnIndex + i) % count
    rotated.push(players[sourceIndex])
  }

  logger.debug('[getPlayerActionOrder] Rotation:', {
    btnIndex,
    original: players.map(p => `${p.name}(${p.position}, seat${p.seatNumber})`),
    rotated: rotated.map(p => `${p.name}(${p.position}, seat${p.seatNumber})`),
  })

  return rotated
}

/**
 * Build seat positions for portrait mode based on player ACTION ORDER (not seat numbers).
 *
 * This ensures that:
 * - BTN is always at the bottom (visual position 0)
 * - SB is always to the bottom-right (visual position 1) - CLOCKWISE from BTN
 * - BB is to the right (visual position 2)
 * - Action flows CLOCKWISE around the table from viewer's perspective
 *
 * The returned array maps: seatPositions[originalPlayerIndex] = visual position
 * So when rendering, use: position = seatPositions[playerIndex]
 *
 * KEY INSIGHT: The `actionOrderPlayers` array index IS the visual position.
 * - actionOrderPlayers[0] is BTN → visual position 0 (bottom center)
 * - actionOrderPlayers[1] is SB → visual position 1 (bottom-RIGHT, clockwise from BTN)
 * - actionOrderPlayers[2] is BB → visual position 2 (right side)
 * - etc.
 *
 * @param width Canvas width in pixels
 * @param height Canvas height in pixels
 * @param originalPlayers Players in their original array order (from initialPlayers, sorted by seat_number)
 * @param actionOrderPlayers Players sorted by clockwise action order (from getPlayerActionOrder)
 * @returns Array where seatPositions[i] = visual position for player at originalPlayers[i]
 */
export function buildPortraitSeatPositionsByActionOrder(
  width: number,
  height: number,
  originalPlayers: PlayerForOrdering[],
  actionOrderPlayers: PlayerForOrdering[]
): SeatPosition[] {
  // Guard against invalid inputs
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return []
  }
  if (width <= 0 || height <= 0) {
    return []
  }

  const count = originalPlayers.length
  if (count === 0) return []

  // Get base visual positions going clockwise from bottom
  // basePositions[0] = bottom center, [1] = bottom-right (SB spot), [2] = right, etc.
  const basePositions = calculatePortraitSeatPositions(count)

  // Build a map: player ID -> their INDEX in the actionOrderPlayers array
  // This index IS the visual position (0 = bottom for BTN, 1 = bottom-right for SB, etc.)
  const actionIndexMap = new Map<string, number>()
  actionOrderPlayers.forEach((p, arrayIndex) => {
    // arrayIndex is 0, 1, 2, ... which corresponds to visual position 0, 1, 2, ...
    actionIndexMap.set(p.id, arrayIndex)
  })

  // Debug: Log the mapping
  logger.debug('[buildPortraitSeatPositionsByActionOrder] Mapping:', {
    count,
    basePositions: basePositions.map((p, i) => ({ visualIdx: i, x: p[0].toFixed(0), y: p[1].toFixed(0) })),
    actionOrder: actionOrderPlayers.map((p, idx) => ({
      visualIdx: idx,
      name: p.name,
      position: p.position,
      visualXY: basePositions[idx] ? `[${basePositions[idx][0].toFixed(0)}, ${basePositions[idx][1].toFixed(0)}]` : 'N/A'
    })),
  })

  // Create result array where result[originalIndex] = visual position for that player
  const positions: SeatPosition[] = []

  for (let originalIndex = 0; originalIndex < count; originalIndex++) {
    const player = originalPlayers[originalIndex]
    // Find this player's index in the action order array = their visual position
    const visualIndex = actionIndexMap.get(player.id) ?? originalIndex

    // Get the visual position coordinates
    const visualPos = basePositions[visualIndex] ?? basePositions[0]
    const angle = Math.atan2(visualPos[1] - 50, visualPos[0] - 50)
    const scale = calculatePortraitPerspectiveScale(visualPos[1])

    positions.push({
      x: (visualPos[0] / 100) * width,
      y: (visualPos[1] / 100) * height,
      angle,
      scale,
    })

    logger.debug(`[Seat] ${player.name} (${player.position}): origIdx=${originalIndex} → visualIdx=${visualIndex} → [${visualPos[0].toFixed(0)}, ${visualPos[1].toFixed(0)}]`)
  }

  return positions
}

// =====================
// Per-Count Layout Config (Portrait Mode)
// =====================

/**
 * Per-player-count layout configuration for portrait mode.
 * Controls spacing of dynamic elements to prevent overlaps at each table size.
 */
export interface PortraitLayoutConfig {
  /** Multiplier for win badge distance from avatar (1.0 = default 50px*scale) */
  winBadgeDistance: number
  /** Pot Y offset below community cards bottom edge (pixels) */
  potGapBelowCards: number
  /** Hand info Y as fraction of canvas height */
  handInfoY: number
}

/**
 * Get layout configuration tuned for a specific player count.
 * More players = tighter spacing; fewer players = more room.
 */
export function getPortraitLayoutConfig(playerCount: number): PortraitLayoutConfig {
  switch (playerCount) {
    case 2: return { winBadgeDistance: 1.4, potGapBelowCards: 25, handInfoY: 0.32 }
    case 3: return { winBadgeDistance: 1.3, potGapBelowCards: 22, handInfoY: 0.30 }
    case 4: return { winBadgeDistance: 1.2, potGapBelowCards: 20, handInfoY: 0.28 }
    case 5: return { winBadgeDistance: 1.1, potGapBelowCards: 18, handInfoY: 0.28 }
    case 6: return { winBadgeDistance: 1.0, potGapBelowCards: 16, handInfoY: 0.27 }
    case 7: return { winBadgeDistance: 0.9, potGapBelowCards: 14, handInfoY: 0.26 }
    case 8: return { winBadgeDistance: 0.85, potGapBelowCards: 12, handInfoY: 0.25 }
    default: return { winBadgeDistance: 0.8, potGapBelowCards: 10, handInfoY: 0.24 } // 9+
  }
}

/**
 * Get the portrait table parameters for rendering.
 */
export function getPortraitTableParams() {
  return { ...PORTRAIT_TABLE_PARAMS }
}

/**
 * Get fixed portrait 9-seat positions.
 */
export function getPortrait9SeatPositions(): ReadonlyArray<[number, number]> {
  return PORTRAIT_9_SEAT_POSITIONS
}
