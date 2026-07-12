import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ClubView } from '@/types'

const clubs = vi.hoisted(() => ({ data: [] as ClubView[], isLoading: false }))
const myClubs = vi.hoisted(() => ({ data: [] as ClubView[], isLoading: false }))
vi.mock('@/hooks', () => ({ useRecentClubs: () => clubs, useMyClubs: () => myClubs, useRequestToJoin: () => ({ mutate: () => {}, isPending: false }) }))
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { name: 'Sam', location: 'Dallas, TX' } }) }))
vi.mock('@/components/common/cards', () => ({
  ClubRow: ({ club, right }: { club: ClubView; right?: React.ReactNode }) => <div data-testid="club"><span data-testid="club-name">{club.name}</span>{right}</div>,
  WaitingBadge: () => <span>Waiting for approval</span>,
}))

import { ClubsToJoinSection } from './ClubsToJoinSection'

const club = (id: string, name: string, location: string, myStatus: ClubView['myStatus'] = 'none'): ClubView =>
  ({ id, name, emoji: '🃏', location, myStatus, createdAt: '2026-01-01' } as unknown as ClubView)

describe('ClubsToJoinSection', () => {
  beforeEach(() => { clubs.data = []; myClubs.data = [] })

  it('caps the preview at 3, shows the total count in the title + a "See all" when there are more', () => {
    clubs.data = [club('a', 'A', 'Austin, TX'), club('b', 'B', 'Austin, TX'), club('c', 'C', 'Austin, TX'), club('d', 'D', 'Austin, TX')]
    render(<MemoryRouter><ClubsToJoinSection /></MemoryRouter>)
    expect(screen.getAllByTestId('club')).toHaveLength(3)
    // Prominent header: a real <h2> heading ("Clubs to join" + a total-count chip).
    expect(screen.getByRole('heading', { name: /Clubs to join/ })).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('See all →')).toBeInTheDocument()
  })

  it('puts near-you clubs first in the preview', () => {
    clubs.data = [club('far', 'Far', 'Austin, TX'), club('near', 'Near', 'Dallas, TX')]
    render(<MemoryRouter><ClubsToJoinSection /></MemoryRouter>)
    expect(screen.getAllByTestId('club-name').map((n) => n.textContent)[0]).toBe('Near')
  })

  it('renders NOTHING when there are no joinable clubs and no pending (no bland empty state)', () => {
    // The old "no clubs around" / "you're in every club" empty states are gone — the
    // section self-hides; the cold-start hub shows a warm welcome in its place instead.
    clubs.data = [club('m', 'Mine', 'Dallas, TX', 'member')] // a member of all visible clubs
    const { container } = render(<MemoryRouter><ClubsToJoinSection /></MemoryRouter>)
    expect(screen.queryByText(/No clubs around here yet/)).toBeNull()
    expect(screen.queryByText(/You're in every club we know/)).toBeNull()
    expect(screen.queryByText(/Clubs to join/)).toBeNull()
    expect(container).toBeEmptyDOMElement() // truly nothing (no pending either)
  })

  it('lists requested clubs in a "Pending approval" group with a "Waiting for approval" pill (no Request)', () => {
    myClubs.data = [club('p1', 'Aces High', 'Dallas, TX', 'pending'), club('p2', 'Green Felt', 'Dallas, TX', 'pending')]
    clubs.data = [club('j', 'River Rats', 'Dallas, TX')]
    render(<MemoryRouter><ClubsToJoinSection /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /Pending approval/ })).toBeInTheDocument()
    expect(screen.getByText('Aces High')).toBeInTheDocument()
    expect(screen.getByText('Green Felt')).toBeInTheDocument()
    expect(screen.getAllByText('Waiting for approval')).toHaveLength(2)
    // joinable still shown below
    expect(screen.getByRole('heading', { name: /Clubs to join/ })).toBeInTheDocument()
  })

  it('with pending requests but no joinable clubs, shows the pending group and NOT the dead-end empty state', () => {
    myClubs.data = [club('p1', 'Aces High', 'Dallas, TX', 'pending')]
    clubs.data = []
    render(<MemoryRouter><ClubsToJoinSection /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /Pending approval/ })).toBeInTheDocument()
    expect(screen.queryByText(/You're in every club we know/)).toBeNull()
  })
})
