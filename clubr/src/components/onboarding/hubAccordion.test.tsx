import { describe, it, expect } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ClubExplainerCard } from './ClubExplainerCard'
import { GameHowItWorksCards } from './GameHowItWorksCards'

// Mirrors how GetStartedHub wires the two: one shared openId, so the club card and
// the game cards form a single accordion (opening one closes the others).
function Hub() {
  const [openId, setOpenId] = useState<string | null>(null)
  return (
    <>
      <ClubExplainerCard open={openId === 'club'} onToggle={() => setOpenId(openId === 'club' ? null : 'club')} />
      <GameHowItWorksCards openId={openId} onOpen={setOpenId} />
    </>
  )
}

describe('cold-start hub accordion — club card + game cards are mutually exclusive', () => {
  it('opening a game card closes the club card, and vice versa', () => {
    render(<Hub />)
    // Open the club card.
    fireEvent.click(screen.getByText('Learn more'))
    expect(screen.getByText('A club is your crew')).toBeInTheDocument()

    // Open a game card → the club card collapses.
    fireEvent.click(screen.getByText('FT Fantasy'))
    expect(screen.queryByText('A club is your crew')).toBeNull()
    expect(screen.getByText('Find a contest')).toBeInTheDocument() // FT step now visible

    // Re-open the club card → the game card collapses.
    fireEvent.click(screen.getByText('Learn more'))
    expect(screen.queryByText('Find a contest')).toBeNull()
    expect(screen.getByText('A club is your crew')).toBeInTheDocument()
  })
})
