import type { Card } from '@/types/hand'
import type { ActionType, HandReplay, ReplayPlayer, ReplayState, ReplayStep, Street } from '@/types/replay'

export function parsePokerStarsHandHistory(text: string): HandReplay {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (!lines.length) {
    throw new Error('Empty hand history provided')
  }

  const handIdMatch = lines[0].match(/Hand\s+#([\w-]+)/i)
  const handId = handIdMatch ? handIdMatch[1] : `pokerstars-${Date.now()}`
  const blinds = parseBlinds(lines[0]) ?? { smallBlind: 50, bigBlind: 100 }
  const players = parsePlayers(lines)
  const buttonSeat = parseButtonSeat(lines)
  if (buttonSeat !== null) {
    const btnIndex = players.findIndex((player) => player.seatNumber === buttonSeat)
    if (btnIndex >= 0) {
      players[btnIndex] = { ...players[btnIndex], position: 'BTN' }
    }
  }

  const { steps } = buildStepsFromLines(lines, players)

  return {
    handId,
    gameType: 'NLH',
    blinds,
    initialPlayers: players,
    steps,
    createdAt: new Date(),
  }
}

function parsePlayers(lines: string[]): ReplayPlayer[] {
  const seatRegex = /^Seat\s+(\d+):\s+(.+?)\s+\(([$€£]?)([\d.,\s]+)(?:\s*(?:in\s+chips|chips|bb))?\)/i
  return lines
    .map((line) => {
      const match = line.match(seatRegex)
      if (!match) return null
      const seat = Number.parseInt(match[1], 10) - 1
      const name = match[2].trim()
      const stack = parseNumericValue(match[4])
      const player: ReplayPlayer = {
        id: `player-${seat}-${name.replace(/\s+/g, '-').toLowerCase()}`,
        name,
        seatNumber: seat,
        startingStack: stack,
        currentStack: stack,
        isActive: true,
        isFolded: false,
        isAllIn: false,
        currentBet: 0,
        totalBet: 0,
      }
      return player
    })
    .filter((player): player is ReplayPlayer => Boolean(player))
}

function parseBlinds(line: string): { smallBlind: number; bigBlind: number } | null {
  const match = line.match(/\(([^/]+)\/([^)]+)\)/)
  if (!match) return null
  const small = parseNumericValue(match[1])
  const big = parseNumericValue(match[2])
  if (Number.isNaN(small) || Number.isNaN(big)) return null
  return { smallBlind: small, bigBlind: big }
}

function parseButtonSeat(lines: string[]): number | null {
  const line = lines.find((l) => /Seat\s+#?\d+\s+is the button/i.test(l))
  if (!line) return null
  const match = line.match(/Seat\s+#?(\d+)/i)
  return match ? Number.parseInt(match[1], 10) - 1 : null
}

function buildStepsFromLines(lines: string[], players: ReplayPlayer[]) {
  const steps: ReplayStep[] = []
  const state: ReplayState = {
    street: 'preflop',
    pot: 0,
    communityCards: [],
    players: players.map((player) => ({ ...player })),
    actions: [],
    activePlayerIndex: null,
    winnerIds: [],
    winnings: {},
  }

  const pushStep = (description: string, highlightedPlayerId?: string) => {
    steps.push({
      stepNumber: steps.length,
      description,
      highlightedPlayerId,
      state: cloneState(state),
    })
  }

  pushStep('Hand starts')

  let currentStreet: Street = 'preflop'
  const streetRegex = /^\*{3}\s+(FLOP|TURN|RIVER|SHOWDOWN)\s+\*{3}(.*)$/i
  const dealtRegex = /^Dealt to\s+(.+?)\s+\[(.+?)\]/i

  let inSummary = false

  lines.forEach((line) => {
    if (/^\*{3}\s+SUMMARY\s+\*{3}/i.test(line)) {
      inSummary = true
      if (state.street !== 'showdown') {
        state.street = 'showdown'
        pushStep('Showdown')
      }
      return
    }

    if (inSummary) {
      handleSummaryLine(line, state, pushStep)
      return
    }

    const streetMatch = line.match(streetRegex)
    if (streetMatch) {
      const streetName = streetMatch[1].toLowerCase() as Street
      currentStreet = streetName === 'flop' ? 'flop' : streetName === 'turn' ? 'turn' : streetName === 'river' ? 'river' : 'showdown'
      state.street = currentStreet
      const cardSection = streetMatch[2]
      if (cardSection) {
        const cards = extractCards(cardSection)
        state.communityCards = cards
      }
      state.players = state.players.map((player) => ({ ...player, currentBet: 0 }))
      pushStep(`Street changes to ${currentStreet.toUpperCase()}`)
      return
    }

    const dealtMatch = line.match(dealtRegex)
    if (dealtMatch) {
      const playerName = dealtMatch[1].trim()
      const cards = extractCards(dealtMatch[2])
      const index = state.players.findIndex((p) => p.name === playerName)
      if (index >= 0 && cards.length >= 2) {
        state.players[index].holeCards = [cards[0], cards[1]]
      }
      return
    }

    const action = parseAction(line, state.players, state)
    if (action) {
      const playerIndex = state.players.findIndex((p) => p.id === action.playerId)
      if (playerIndex >= 0) {
        const normalized = normalizeActionAmount(action, state, playerIndex)
        applyAction(state, playerIndex, normalized)
        pushStep(action.description, action.playerId)
      }
    }
  })

  if (state.winnerIds.length) {
    pushStep('Hand complete')
  }

  if (!steps.length) {
    pushStep('Hand starts')
  }

  return { steps }
}

interface ParsedAction {
  playerId: string
  description: string
  type: ActionType
  amount: number
  targetTotal?: number
  cards?: Card[]
}

function normalizeActionAmount(action: ParsedAction, state: ReplayState, playerIndex: number): ParsedAction {
  const player = state.players[playerIndex]
  if ((action.type === 'raise' || action.type === 'all-in') && action.targetTotal !== undefined) {
    const target = action.targetTotal
    const wager = Math.max(0, target - player.currentBet)
    return { ...action, amount: wager, targetTotal: target }
  }

  if (action.type === 'call') {
    const highestBet = Math.max(...state.players.map((p) => p.currentBet))
    const amountToCall = Math.max(0, highestBet - player.currentBet)
    return { ...action, amount: amountToCall || action.amount }
  }

  if (action.type === 'all-in' && action.amount <= 0) {
    return { ...action, amount: Math.max(0, player.currentStack) }
  }

  return action
}

function applyAction(state: ReplayState, playerIndex: number, action: ParsedAction) {
  const player = state.players[playerIndex]
  const amount = Math.max(0, action.amount)
  let appliedAmount = amount
  state.activePlayerIndex = playerIndex

  switch (action.type) {
    case 'bet':
    case 'raise':
    case 'call':
    case 'all-in': {
      const wager = Math.min(player.currentStack, amount)
      appliedAmount = wager
      player.currentStack = Math.max(0, player.currentStack - wager)
      const targetBet = action.targetTotal ?? player.currentBet + wager
      player.currentBet = targetBet
      player.totalBet += wager
      state.pot += wager
      if (action.type === 'all-in' || player.currentStack <= 0) {
        player.isAllIn = true
      }
      player.lastAction = action.type
      break
    }
    case 'small-blind':
    case 'big-blind':
    case 'ante':
    case 'straddle': {
      const wager = Math.min(player.currentStack, amount)
      appliedAmount = wager
      player.currentStack = Math.max(0, player.currentStack - wager)
      player.currentBet += wager
      player.totalBet += wager
      state.pot += wager
      if (action.type === 'small-blind' && !player.position) player.position = 'SB'
      if (action.type === 'big-blind' && !player.position) player.position = 'BB'
      if (action.type === 'straddle') {
        player.hasStraddled = true
        if (!player.position) player.position = 'UTG'
      }
      player.lastAction = action.type
      break
    }
    case 'fold':
      player.isFolded = true
      player.isActive = false
      player.currentBet = 0
      player.lastAction = action.type
      break
    case 'check':
      player.lastAction = action.type
      break
    case 'uncalled-bet': {
      appliedAmount = Math.max(0, Math.min(amount, player.currentBet))
      player.currentStack += appliedAmount
      player.currentBet = Math.max(0, player.currentBet - appliedAmount)
      player.totalBet = Math.max(0, player.totalBet - appliedAmount)
      state.pot = Math.max(0, state.pot - appliedAmount)
      player.lastAction = action.type
      if (countActivePlayers(state) <= 1) {
        state.street = 'showdown'
      }
      break
    }
    case 'win': {
      const availablePot = state.pot > 0 ? state.pot : amount
      const payout = amount > 0 ? Math.min(amount, availablePot) : availablePot
      appliedAmount = payout
      player.currentStack += payout
      state.winnings[player.id] = (state.winnings[player.id] ?? 0) + payout
      if (!state.winnerIds.includes(player.id)) {
        state.winnerIds.push(player.id)
      }
      state.pot = Math.max(0, state.pot - payout)
      player.lastAction = action.type
      state.street = 'showdown'
      state.players = state.players.map((p) => ({ ...p, currentBet: 0 }))
      if (state.pot <= 0.0001) {
        state.pot = 0
        state.activePlayerIndex = null
      }
      break
    }
    case 'show':
    case 'muck': {
      const cards = action.cards ?? []
      if (cards.length >= 2) {
        player.holeCards = [cards[0], cards[1]]
      }
      state.street = 'showdown'
      player.lastAction = action.type
      break
    }
  }

  if (countActivePlayers(state) <= 1 && state.street !== 'showdown') {
    state.street = 'showdown'
  }

  state.actions.push({
    playerId: player.id,
    action: action.type,
    amount: appliedAmount,
    timestamp: Date.now(),
  })
}

function parseAction(line: string, players: ReplayPlayer[], state: ReplayState): ParsedAction | null {
  const cleaned = line.trim()
  if (!cleaned) return null

  const uncalledBet = cleaned.match(/^Uncalled bet(?:\s+of)?\s+\(?([$€£]?[\d,.]+)\)?\s+returned to\s+(.+)$/i)
  if (uncalledBet) {
    const amount = parseAmount(uncalledBet[1])
    const name = uncalledBet[2].trim()
    const playerId = findPlayerIdByName(players, name)
    if (!playerId) return null
    return { playerId, description: cleaned, type: 'uncalled-bet', amount }
  }

  const collected = cleaned.match(/^(.+?) collected ([$€£]?)([\d,.]+)/i)
  if (collected) {
    const name = collected[1].trim()
    const amount = parseAmount(collected[3])
    const playerId = findPlayerIdByName(players, name)
    if (!playerId) return null
    return { playerId, description: cleaned, type: 'win', amount }
  }

  const matchedName = players.find((p) => cleaned.toLowerCase().startsWith(p.name.toLowerCase()))
  if (!matchedName) return null
  const playerId = matchedName.id
  const isAllIn = /all[- ]?in/i.test(cleaned)

  const showMatch = cleaned.match(/shows\s+\[([^\]]+)\]/i)
  if (showMatch) {
    const cards = extractCards(`[${showMatch[1]}]`)
    return { playerId, description: cleaned, type: 'show', amount: 0, cards }
  }

  const muckMatch = cleaned.match(/mucks(?:\s+hand)?\s+\[([^\]]+)\]/i)
  if (muckMatch) {
    const cards = extractCards(`[${muckMatch[1]}]`)
    return { playerId, description: cleaned, type: 'muck', amount: 0, cards }
  }

  if (/posts small blind/i.test(cleaned)) {
    return { playerId, description: cleaned, type: 'small-blind', amount: parseAmount(cleaned) }
  }
  if (/posts big blind/i.test(cleaned)) {
    return { playerId, description: cleaned, type: 'big-blind', amount: parseAmount(cleaned) }
  }
  if (/posts the ante/i.test(cleaned)) {
    return { playerId, description: cleaned, type: 'ante', amount: parseAmount(cleaned) }
  }
  if (/posts .*straddle/i.test(cleaned)) {
    return { playerId, description: cleaned, type: 'straddle', amount: parseAmount(cleaned) }
  }
  if (/folds/i.test(cleaned)) {
    return { playerId, description: cleaned, type: 'fold', amount: 0 }
  }
  if (/checks/i.test(cleaned)) {
    return { playerId, description: cleaned, type: 'check', amount: 0 }
  }

  const raiseMatch = cleaned.match(/raises(?:\s+[$€£]?([\d,.]+))?(?:\s+to\s+[$€£]?([\d,.]+))?/i)
  if (raiseMatch) {
    const raiseAmount = parseAmount(raiseMatch[1])
    const targetTotal = parseAmount(raiseMatch[2])
    const amount = targetTotal || raiseAmount
    if (amount <= 0) return null
    return {
      playerId,
      description: cleaned,
      type: isAllIn ? 'all-in' : 'raise',
      amount,
      targetTotal: targetTotal || undefined,
    }
  }

  const betMatch = cleaned.match(/bets\s+[$€£]?([\d,.]+)/i)
  if (betMatch) {
    return { playerId, description: cleaned, type: isAllIn ? 'all-in' : 'bet', amount: parseAmount(betMatch[1]) }
  }

  const callMatch = cleaned.match(/calls\s+[$€£]?([\d,.]+)/i)
  if (callMatch) {
    return { playerId, description: cleaned, type: isAllIn ? 'all-in' : 'call', amount: parseAmount(callMatch[1]) }
  }

  // Handle generic "bets X and is all-in" when no keyword matched above
  if (isAllIn) {
    const stack = state.players.find((p) => p.id === playerId)?.currentStack ?? 0
    return { playerId, description: cleaned, type: 'all-in', amount: parseAmount(cleaned) || stack }
  }

  return null
}

function parseAmount(raw?: string) {
  return parseNumericValue(raw)
}

function parseNumericValue(raw?: string) {
  if (!raw) return 0
  const cleaned = raw.replace(/[^0-9.,\s-]/g, '').replace(/\s+/g, '')
  if (!cleaned) return 0

  const hasComma = cleaned.includes(',')
  const hasDot = cleaned.includes('.')

  if (hasComma && hasDot) {
    const lastComma = cleaned.lastIndexOf(',')
    const lastDot = cleaned.lastIndexOf('.')
    const normalized =
      lastComma > lastDot
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned.replace(/,/g, '')
    const value = Number.parseFloat(normalized)
    return Number.isFinite(value) ? value : 0
  }

  if (hasComma) {
    const parts = cleaned.split(',')
    if (parts.length === 2 && parts[1].length <= 2) {
      const normalized = `${parts[0].replace(/,/g, '')}.${parts[1]}`
      const value = Number.parseFloat(normalized)
      if (Number.isFinite(value)) return value
    }
    const value = Number.parseFloat(cleaned.replace(/,/g, ''))
    return Number.isFinite(value) ? value : 0
  }

  const value = Number.parseFloat(cleaned)
  return Number.isFinite(value) ? value : 0
}

function findPlayerIdByName(players: ReplayPlayer[], name: string) {
  const lower = name.toLowerCase()
  return players.find((p) => lower.startsWith(p.name.toLowerCase()))?.id ?? null
}

function extractCards(section: string): Card[] {
  const groups = Array.from(section.matchAll(/\[([^\]]+)\]/g))
  if (!groups.length) return []
  const seen = new Set<string>()
  const cards: Card[] = []

  for (const match of groups) {
    const tokens = match[1].trim().split(/\s+/)
    tokens.forEach((token) => {
      const rank = token.slice(0, -1)
      const suit = token.slice(-1)
      const card = toCard(rank, suit)
      if (!card) return
      const key = `${card.rank}-${card.suit}`
      if (!seen.has(key) && cards.length < 5) {
        seen.add(key)
        cards.push(card)
      }
    })
  }

  return cards
}

function toCard(rankRaw: string, suitRaw: string): Card | null {
  const normalizedRank = rankRaw.toUpperCase() === 'T' ? '10' : rankRaw.toUpperCase()
  const suitChar = suitRaw.toLowerCase()
  const suitMap: Record<string, Card['suit']> = {
    h: 'hearts',
    d: 'diamonds',
    c: 'clubs',
    s: 'spades',
  }
  const suit = suitMap[suitChar]
  if (!suit) return null
  const isValidRank = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '?'].includes(
    normalizedRank
  )
  if (!isValidRank) return null
  return { rank: normalizedRank as Card['rank'], suit }
}

function handleSummaryLine(
  line: string,
  state: ReplayState,
  pushStep: (description: string, highlightedPlayerId?: string) => void
): boolean {
  const seatLine = line.match(/^Seat\s+\d+:\s+(.+)$/i)
  if (!seatLine) return false

  const details = seatLine[1].trim()
  const player = state.players.find((p) => details.toLowerCase().startsWith(p.name.toLowerCase()))
  if (!player) return false

  const playerIndex = state.players.findIndex((p) => p.id === player.id)
  if (playerIndex < 0) return false

  const cards = extractCards(details)
  const wonMatch = details.match(/(?:won|collected)\s+\(?[$€£]?([\d,.]+)/i)
  const isMuck = /muck/i.test(details)
  const alreadyWon = state.actions.some((action) => action.action === 'win' && action.playerId === player.id)

  let updated = false

  if (cards.length) {
    applyAction(state, playerIndex, {
      playerId: player.id,
      description: line,
      type: isMuck ? 'muck' : 'show',
      amount: 0,
      cards,
    })
    updated = true
  }

  if (wonMatch && !alreadyWon) {
    const amount = parseAmount(wonMatch[1])
    if (amount > 0) {
      applyAction(state, playerIndex, {
        playerId: player.id,
        description: line,
        type: 'win',
        amount,
      })
      updated = true
    }
  }

  if (updated) {
    state.street = 'showdown'
    const amountText = wonMatch ? parseAmount(wonMatch[1]) : 0
    const parts: string[] = []
    if (amountText > 0) {
      parts.push(`wins ${amountText}`)
    }
    if (cards.length) {
      parts.push(isMuck ? 'mucks' : 'shows')
    }
    const description = parts.length ? `${player.name} ${parts.join(' and ')}` : `Summary update for ${player.name}`
    pushStep(description, player.id)
  }

  return updated
}

function cloneState(state: ReplayState): ReplayState {
  return {
    ...state,
    communityCards: [...state.communityCards],
    players: state.players.map((p) => ({ ...p, holeCards: p.holeCards ? [...p.holeCards] : undefined })),
    actions: state.actions.map((action) => ({ ...action })),
    winnings: { ...state.winnings },
    winnerIds: [...state.winnerIds],
  }
}

function countActivePlayers(state: ReplayState) {
  return state.players.filter((player) => !player.isFolded).length
}
