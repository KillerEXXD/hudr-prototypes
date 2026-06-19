import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { UnifiedGame } from '@/games/useUnifiedGames'

const games = vi.hoisted(() => ({ items: [] as UnifiedGame[], isLoading: false }))

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { name: 'Harper Host' } }) }))
vi.mock('@/hooks/ft', () => ({ useAvailableFTs: () => ({ data: [] }) }))
vi.mock('@/hooks', () => ({ useMyClubs: () => ({ data: [] }) }))
vi.mock('@/games/useUnifiedGames', () => ({
  useUnifiedGames: () => games,
  matchesType: (g: UnifiedGame, f: string) => f === 'all' || g.type === f,
  orderActiveGames: (items: UnifiedGame[]) => items.filter((g) => g.phase !== 'closed'),
}))
vi.mock('@/games/renderGame', () => ({ renderUnifiedGame: () => null }))

import { HostHomePage } from './HostHomePage'

const game = (type: UnifiedGame['type'], phase: 'reg' | 'live' | 'closed' = 'reg'): UnifiedGame =>
  ({ type, id: `${type}_${phase}`, clubId: 'c1', canManage: true, finished: phase === 'closed', phase, mine: false, sort: 0 } as unknown as UnifiedGame)

describe('HostHomePage', () => {
  it('greets the host and frames FTs as upcoming final tables to host', () => {
    games.items = []
    render(<MemoryRouter><HostHomePage /></MemoryRouter>)
    expect(screen.getByText(/Hey Harper/)).toBeInTheDocument()
    expect(screen.getByText(/Upcoming final tables available for you to host as Fantasy games in your club/)).toBeInTheDocument()
  })

  it('shows the relationship pills (Available · Playing · Hosting) under a "Games" section — no old two-section split', () => {
    games.items = [game('ft_fantasy', 'reg')]
    render(<MemoryRouter><HostHomePage /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Games' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Available/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Playing/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Hosting/ })).toBeInTheDocument()
    expect(screen.queryByText(/Open & live games/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Active games in your clubs/i)).not.toBeInTheDocument()
  })

  it('shows abbreviated type-filter chips (FTF / LL / Squares) when more than one type is active', () => {
    games.items = [game('ft_fantasy'), game('last_longer'), game('football_squares')]
    render(<MemoryRouter><HostHomePage /></MemoryRouter>)
    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('FTF')).toBeInTheDocument()
    expect(screen.getByText('LL')).toBeInTheDocument()
    expect(screen.getByText('Squares')).toBeInTheDocument()
  })

  it('drops CLOSED games — an all-closed feed shows the (Hosting) empty state', () => {
    games.items = [game('ft_fantasy', 'closed'), game('last_longer', 'closed')]
    render(<MemoryRouter><HostHomePage /></MemoryRouter>)
    expect(screen.getByText(/not hosting any open or running games/i)).toBeInTheDocument()
  })
})
