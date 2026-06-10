import { describe, expect, it } from 'vitest'
import { parseHandHistory } from './ParserFactory'
import { sampleHandReplay } from '@/data/sampleHandReplay'

const pokerStarsHand = `
PokerStars Hand #123456789: Hold'em No Limit ($1/$2 USD)
Table 'Alpha' 9-max Seat #1 is the button
Seat 1: Hero ($200 in chips)
Seat 2: Villain ($200 in chips)
*** HOLE CARDS ***
Dealt to Hero [Ah Kd]
Hero: raises $4 to $6
Villain: calls $4
*** FLOP *** [Ad Kh 2c]
Hero: bets $8
Villain: folds
Uncalled bet ($8) returned to Hero
Hero collected $12 from pot
*** SHOW DOWN ***
`

const allInHand = `
PokerStars Hand #987654321: Hold'em No Limit ($1/$2 USD)
Table 'Bravo' 2-max Seat #1 is the button
Seat 1: Hero ($20 in chips)
Seat 2: Villain ($20 in chips)
*** HOLE CARDS ***
Hero: posts small blind $1
Villain: posts big blind $2
Hero: raises $3 to $4
Villain: calls $2
*** FLOP *** [Ah Kh 2c]
Hero: bets $10 and is all-in
Villain: folds
Uncalled bet ($10) returned to Hero
Hero collected $8 from pot
*** SHOW DOWN ***
`

const ggPokerHand = `
GGPoker Hand #H1-222222222: Hold'em No Limit ($1/$2)
Table 'Orion' 2-max Seat #1 is the button
Seat 1: Hero ($100)
Seat 2: Villain ($120)
*** HOLE CARDS ***
Hero: posts small blind $1
Villain: posts big blind $2
Hero: raises to $6
Villain: calls $4
*** FLOP *** [Ah Kd 2c]
Hero: bets $10
Villain: folds
Uncalled bet of $10 returned to Hero
Hero collected $12 from pot
*** SHOW DOWN ***
`

const fullBoardHand = `
PokerStars Hand #333333333: Hold'em No Limit ($1/$2 USD)
Table 'Delta' 3-max Seat #2 is the button
Seat 1: Hero ($100 in chips)
Seat 2: Villain ($120 in chips)
Seat 3: Caller ($80 in chips)
*** HOLE CARDS ***
Hero: posts small blind $1
Villain: posts big blind $2
Caller: calls $2
Hero: calls $1
Villain: checks
*** FLOP *** [Ah Td 2c]
Hero: checks
Caller: checks
Villain: bets $6
Hero: calls $6
Caller: folds
*** TURN *** [Ah Td 2c] [9s]
Villain: bets $12
Hero: calls $12
*** RIVER *** [Ah Td 2c 9s] [9d]
Villain: checks
Hero: bets $30
Villain: folds
Uncalled bet of $30 returned to Hero
Hero collected $50 from pot
*** SHOW DOWN ***
`

const showdownRevealHand = `
PokerStars Hand #444444444: Hold'em No Limit ($1/$2 USD)
Table 'Echo' 2-max Seat #1 is the button
Seat 1: Hero ($200 in chips)
Seat 2: Villain ($250 in chips)
*** HOLE CARDS ***
Hero: posts small blind $1
Villain: posts big blind $2
Hero: raises to $6
Villain: calls $4
*** FLOP *** [Ah Kd 2c]
Hero: bets $12
Villain: calls $12
*** TURN *** [Ah Kd 2c] [9h]
Hero: bets $30
Villain: calls $30
*** RIVER *** [Ah Kd 2c 9h] [3s]
Hero: checks
Villain: bets $60
Hero: calls $60
*** SHOW DOWN ***
Villain: shows [Qs Qc]
Hero: shows [Ad Kh]
Villain collected $216 from pot
*** SUMMARY ***
`

const summaryWithoutShowdownHand = `
PokerStars Hand #555555555: Hold'em No Limit ($1/$2 USD)
Table 'Foxtrot' 2-max Seat #1 is the button
Seat 1: Hero ($100 in chips)
Seat 2: Villain ($120 in chips)
*** HOLE CARDS ***
Hero: posts small blind $1
Villain: posts big blind $2
Hero: raises to $6
Villain: calls $4
*** FLOP *** [Ah Kd 2c]
Hero: bets $10
Villain: folds
Uncalled bet ($10) returned to Hero
Hero collected $12 from pot
*** SUMMARY ***
Total pot $12 | Rake $0
Board [Ah Kd 2c]
Seat 1: Hero collected ($12)
Seat 2: Villain folded on the Flop
`

const summaryOnlyWinHand = `
PokerStars Hand #666666666: Hold'em No Limit ($1/$2 USD)
Table 'Golf' 2-max Seat #1 is the button
Seat 1: Hero ($100 in chips)
Seat 2: Villain ($120 in chips)
*** HOLE CARDS ***
Hero: posts small blind $1
Villain: posts big blind $2
Hero: calls $1
Villain: checks
*** FLOP *** [Ah Kd 2c]
Hero: bets $4
Villain: calls $4
*** TURN *** [Ah Kd 2c] [7s]
Hero: bets $8
Villain: calls $8
*** RIVER *** [Ah Kd 2c 7s] [3h]
Hero: bets $12
Villain: calls $12
*** SHOW DOWN ***
*** SUMMARY ***
Total pot $52 | Rake $0
Board [Ah Kd 2c 7s 3h]
Seat 1: Hero showed [Ac Kh] and won ($52)
Seat 2: Villain showed [9c 9d] and lost with a pair of Nines
`

const euroCommaHand = `
PokerStars Hand #777777777: Hold'em No Limit (€0,50/€1)
Table 'Euro' 2-max Seat #1 is the button
Seat 1: Hero (€1.500,50 in chips)
Seat 2: Villain (€800,25 in chips)
*** HOLE CARDS ***
Hero: posts small blind €0,50
Villain: posts big blind €1
Hero: calls €0,50
Villain: checks
*** FLOP *** [Ah Kd 2c]
Hero: bets €2,25
Villain: folds
Uncalled bet (€2,25) returned to Hero
Hero collected €2,00 from pot
*** SHOW DOWN ***
*** SUMMARY ***
Total pot €2,00 | Rake €0
Board [Ah Kd 2c]
Seat 1: Hero collected (€2,00)
Seat 2: Villain folded on the Flop
`

describe('parseHandHistory', () => {
  it('parses native HandReplay object without modification', () => {
    const parsed = parseHandHistory(sampleHandReplay)
    expect(parsed.handId).toBe(sampleHandReplay.handId)
    expect(parsed.steps.length).toBeGreaterThan(0)
  })

  it('parses JSON stringified HandReplay payloads', () => {
    const serialized = JSON.stringify(sampleHandReplay)
    const parsed = parseHandHistory(serialized)
    expect(parsed.handId).toBe(sampleHandReplay.handId)
    expect(parsed.steps.length).toBe(sampleHandReplay.steps.length)
    expect(parsed.createdAt instanceof Date).toBe(true)
  })

  it('parses PokerStars formatted hand history text', () => {
    const parsed = parseHandHistory(pokerStarsHand)
    expect(parsed.handId).toContain('123456789')
    expect(parsed.steps.length).toBeGreaterThan(1)
    expect(parsed.steps[0].state.players.length).toBeGreaterThan(0)
  })

  it('handles all-in actions, blind positions, and uncalled bets', () => {
    const parsed = parseHandHistory(allInHand)
    const finalStep = parsed.steps[parsed.steps.length - 1]
    const hero = finalStep.state.players.find((p) => p.name === 'Hero')
    const villain = finalStep.state.players.find((p) => p.name === 'Villain')

    expect(hero?.isAllIn).toBe(true)
    expect(hero?.currentStack).toBe(24)
    expect(hero?.lastAction).toBe('win')
    expect(hero?.position).toBe('BTN')
    expect(villain?.isFolded).toBe(true)
    expect(villain?.position).toBe('BB')
    expect(finalStep.state.winnerIds).toContain(hero?.id)
    expect(finalStep.state.winnings[hero?.id ?? '']).toBe(8)
    expect(finalStep.state.pot).toBe(0)
    expect(finalStep.state.actions.some((action) => action.action === 'uncalled-bet')).toBe(true)
  })

  it('parses GGPoker formatted hand history with raise-to lines and uncalled bets', () => {
    const parsed = parseHandHistory(ggPokerHand)
    const finalStep = parsed.steps[parsed.steps.length - 1]!
    const hero = finalStep.state.players.find((player) => player.name === 'Hero')
    const villain = finalStep.state.players.find((player) => player.name === 'Villain')

    expect(parsed.handId).toContain('H1-222222222')
    expect(parsed.gameType).toBe('NLH')
    expect(hero?.position).toBe('BTN')
    expect(villain?.position).toBe('BB')
    expect(hero?.currentStack).toBe(106)
    expect(villain?.isFolded).toBe(true)
    expect(finalStep.state.pot).toBe(0)
    expect(finalStep.state.winnerIds).toContain(hero?.id)
    expect(finalStep.state.winnings[hero?.id ?? '']).toBe(12)
    expect(finalStep.state.actions.some((action) => action.action === 'uncalled-bet')).toBe(true)
  })

  it('parses flop/turn/river boards and preserves all five community cards', () => {
    const parsed = parseHandHistory(fullBoardHand)
    const flopStep = parsed.steps.find((step) => step.state.street === 'flop')
    const turnStep = parsed.steps.find((step) => step.state.street === 'turn')
    const riverStep = parsed.steps.find((step) => step.state.street === 'river')
    const finalStep = parsed.steps[parsed.steps.length - 1]!
    const hero = finalStep.state.players.find((player) => player.name === 'Hero')

    expect(flopStep?.state.communityCards).toHaveLength(3)
    expect(turnStep?.state.communityCards).toHaveLength(4)
    expect(riverStep?.state.communityCards).toHaveLength(5)
    expect(finalStep.state.communityCards.map((card) => card.rank)).toContain('10')
    expect(finalStep.state.pot).toBe(0)
    expect(hero?.currentStack).toBe(122)
    expect(finalStep.state.winnings[hero?.id ?? '']).toBe(42)
  })

  it('reveals showdown cards from show/muck lines and keeps stacks accurate', () => {
    const parsed = parseHandHistory(showdownRevealHand)
    const finalStep = parsed.steps[parsed.steps.length - 1]!
    const hero = finalStep.state.players.find((player) => player.name === 'Hero')
    const villain = finalStep.state.players.find((player) => player.name === 'Villain')

    expect(finalStep.state.street).toBe('showdown')
    expect(hero?.holeCards?.map((card) => card.rank)).toEqual(['A', 'K'])
    expect(villain?.holeCards?.map((card) => card.rank)).toEqual(['Q', 'Q'])
    expect(finalStep.state.actions.filter((action) => action.action === 'show').length).toBe(2)
    expect(finalStep.state.winnerIds).toContain(villain?.id)
    expect(finalStep.state.pot).toBe(0)
    expect(hero?.currentStack).toBe(92)
    expect(villain?.currentStack).toBe(358)
  })

  it('forces showdown state and refunds uncalled bets into total contributions when summary lacks showdown', () => {
    const parsed = parseHandHistory(summaryWithoutShowdownHand)
    const finalStep = parsed.steps[parsed.steps.length - 1]!
    const hero = finalStep.state.players.find((player) => player.name === 'Hero')

    expect(finalStep.state.street).toBe('showdown')
    expect(hero?.currentBet).toBe(0)
    expect(hero?.totalBet).toBe(6)
    expect(hero?.currentStack).toBe(106)
    expect(finalStep.state.pot).toBe(0)
    expect(finalStep.state.winnings[hero?.id ?? '']).toBe(12)
  })

  it('awards summary-only winners and clears table bets', () => {
    const parsed = parseHandHistory(summaryOnlyWinHand)
    const finalStep = parsed.steps[parsed.steps.length - 1]!
    const hero = finalStep.state.players.find((player) => player.name === 'Hero')
    const villain = finalStep.state.players.find((player) => player.name === 'Villain')

    expect(finalStep.state.street).toBe('showdown')
    expect(finalStep.state.winnerIds).toContain(hero?.id)
    expect(finalStep.state.actions.some((action) => action.action === 'win')).toBe(true)
    expect(finalStep.state.winnings[hero?.id ?? '']).toBe(52)
    expect(finalStep.state.pot).toBe(0)
    expect(hero?.holeCards?.map((card) => card.rank)).toEqual(['A', 'K'])
    expect(villain?.holeCards?.map((card) => card.rank)).toEqual(['9', '9'])
    expect(hero?.currentStack).toBe(126)
    expect(villain?.currentStack).toBe(94)
    expect(finalStep.state.players.every((player) => player.currentBet === 0)).toBe(true)
  })

  it('parses comma-based euro amounts for blinds, stacks, and actions', () => {
    const parsed = parseHandHistory(euroCommaHand)
    const finalStep = parsed.steps[parsed.steps.length - 1]!
    const hero = finalStep.state.players.find((player) => player.name === 'Hero')
    const villain = finalStep.state.players.find((player) => player.name === 'Villain')

    expect(parsed.blinds.smallBlind).toBeCloseTo(0.5, 5)
    expect(parsed.blinds.bigBlind).toBeCloseTo(1, 5)
    expect(hero?.startingStack).toBeCloseTo(1500.5, 5)
    expect(villain?.startingStack).toBeCloseTo(800.25, 5)
    expect(hero?.currentStack).toBeCloseTo(1501.5, 5)
    expect(villain?.currentStack).toBeCloseTo(799.25, 5)
    expect(finalStep.state.winnings[hero?.id ?? '']).toBeCloseTo(2, 5)
    expect(finalStep.state.actions.some((action) => action.action === 'uncalled-bet' && Math.abs(action.amount - 2.25) < 0.0001)).toBe(true)
    expect(finalStep.state.pot).toBe(0)
  })
})
