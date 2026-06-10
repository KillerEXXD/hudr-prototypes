/**
 * Unit tests for HighlightsPanel component
 *
 * Tests the tournament highlights slideover panel including:
 * - Rendering states (open, closed, loading, error, empty)
 * - Highlight card display and formatting
 * - Selection and interaction behavior
 * - Accessibility features
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HighlightsPanel } from '../HighlightsPanel'
import type { TournamentHighlight } from '@/stores/replayerStore'

// =====================
// Test Fixtures
// =====================

const createMockHighlight = (overrides: Partial<TournamentHighlight> = {}): TournamentHighlight => ({
  handId: 'hand-1',
  handNumber: 42,
  title: 'Big Bluff',
  description: 'Hero bluffs the river for a huge pot',
  players: ['Alice', 'Bob'],
  potSize: 25000,
  street: 'river',
  tags: ['bluff', 'hero'],
  ...overrides,
})

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  highlights: [] as TournamentHighlight[],
  selectedHighlightId: null,
  currentHandId: undefined,
  onSelectHighlight: vi.fn(),
  isLoading: false,
  error: null,
  tournamentName: 'WSOP Main Event',
}

// =====================
// Rendering Tests
// =====================

describe('HighlightsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should not render when closed', () => {
      render(<HighlightsPanel {...defaultProps} isOpen={false} />)

      // Panel returns null when closed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should render when open', () => {
      render(<HighlightsPanel {...defaultProps} isOpen={true} />)

      // Header shows "Highlights"
      expect(screen.getByText('Highlights')).toBeInTheDocument()
    })

    it('should display tournament name', () => {
      render(<HighlightsPanel {...defaultProps} tournamentName="EPT Monte Carlo" />)

      expect(screen.getByText('EPT Monte Carlo')).toBeInTheDocument()
    })

    it('should render close button with icon', () => {
      render(<HighlightsPanel {...defaultProps} />)

      // Close button is an icon button in the header
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('should have accessible dialog role', () => {
      render(<HighlightsPanel {...defaultProps} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('should display loading skeletons when loading', () => {
      const { container } = render(<HighlightsPanel {...defaultProps} isLoading={true} />)

      // Component shows skeleton cards with animate-pulse class
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should display 3 skeleton items when loading', () => {
      const { container } = render(<HighlightsPanel {...defaultProps} isLoading={true} />)

      // HighlightSkeleton renders 3 skeleton cards
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBe(3)
    })
  })

  describe('error state', () => {
    it('should display error title when error exists', () => {
      const error = new Error('Network error')
      render(<HighlightsPanel {...defaultProps} error={error} />)

      // ErrorState component shows "Failed to load highlights" as title
      expect(screen.getByText('Failed to load highlights')).toBeInTheDocument()
    })

    it('should display error message from error object', () => {
      const error = new Error('Network error')
      render(<HighlightsPanel {...defaultProps} error={error} />)

      // The error message is displayed below the title
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('should display empty message when no highlights', () => {
      render(<HighlightsPanel {...defaultProps} highlights={[]} />)

      expect(screen.getByText('No highlights yet')).toBeInTheDocument()
    })

    it('should display helpful description in empty state', () => {
      render(<HighlightsPanel {...defaultProps} highlights={[]} />)

      // EmptyState shows this description
      expect(screen.getByText('Highlights from this tournament will appear here')).toBeInTheDocument()
    })
  })

  describe('highlight cards', () => {
    it('should render all highlights', () => {
      const highlights = [
        createMockHighlight({ handId: 'h1', title: 'First Highlight' }),
        createMockHighlight({ handId: 'h2', title: 'Second Highlight' }),
        createMockHighlight({ handId: 'h3', title: 'Third Highlight' }),
      ]
      render(<HighlightsPanel {...defaultProps} highlights={highlights} />)

      expect(screen.getByText('First Highlight')).toBeInTheDocument()
      expect(screen.getByText('Second Highlight')).toBeInTheDocument()
      expect(screen.getByText('Third Highlight')).toBeInTheDocument()
    })

    it('should display hand number with Hand # prefix', () => {
      const highlights = [createMockHighlight({ handNumber: 99 })]
      render(<HighlightsPanel {...defaultProps} highlights={highlights} />)

      // Format is "Hand #99"
      expect(screen.getByText('Hand #99')).toBeInTheDocument()
    })

    it('should format pot size with K suffix for thousands', () => {
      const highlights = [createMockHighlight({ potSize: 50000 })]
      render(<HighlightsPanel {...defaultProps} highlights={highlights} />)

      // formatPotSize returns "50.00K" for 50000
      expect(screen.getByText('50.00K')).toBeInTheDocument()
    })

    it('should format pot size with M suffix for millions', () => {
      const highlights = [createMockHighlight({ potSize: 1500000 })]
      render(<HighlightsPanel {...defaultProps} highlights={highlights} />)

      // formatPotSize returns "1.50M" for 1500000
      expect(screen.getByText('1.50M')).toBeInTheDocument()
    })

    it('should display player count as number', () => {
      const highlights = [createMockHighlight({ players: ['Charlie', 'Diana'] })]
      render(<HighlightsPanel {...defaultProps} highlights={highlights} />)

      // Component shows player count as number with Users icon
      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should display description', () => {
      const highlights = [createMockHighlight({ description: 'An epic showdown' })]
      render(<HighlightsPanel {...defaultProps} highlights={highlights} />)

      expect(screen.getByText('An epic showdown')).toBeInTheDocument()
    })

    it('should display tags when present', () => {
      const highlights = [createMockHighlight({ tags: ['bluff', 'hero', 'all-in'] })]
      render(<HighlightsPanel {...defaultProps} highlights={highlights} />)

      expect(screen.getByText('bluff')).toBeInTheDocument()
      expect(screen.getByText('hero')).toBeInTheDocument()
      expect(screen.getByText('all-in')).toBeInTheDocument()
    })
  })

  describe('selection', () => {
    it('should call onSelectHighlight when clicking a highlight', () => {
      const onSelectHighlight = vi.fn()
      const highlights = [createMockHighlight({ handId: 'h1' })]
      render(<HighlightsPanel {...defaultProps} highlights={highlights} onSelectHighlight={onSelectHighlight} />)

      // Find the highlight card button by title text
      const card = screen.getByText('Big Bluff').closest('button')
      expect(card).not.toBeNull()
      fireEvent.click(card!)

      expect(onSelectHighlight).toHaveBeenCalledWith(highlights[0])
    })

    it('should mark selected highlight with border styling', () => {
      const highlights = [createMockHighlight({ handId: 'h1' })]
      const { container } = render(
        <HighlightsPanel {...defaultProps} highlights={highlights} selectedHighlightId="h1" />
      )

      // Selected card has bg-white/15 and border styling
      const selectedCard = container.querySelector('.bg-white\\/15')
      expect(selectedCard).toBeInTheDocument()
    })

    it('should mark currently playing highlight with Playing badge', () => {
      const highlights = [createMockHighlight({ handId: 'h1' })]
      render(<HighlightsPanel {...defaultProps} highlights={highlights} currentHandId="h1" />)

      // Component shows "Playing" badge text
      expect(screen.getByText('Playing')).toBeInTheDocument()
    })

    it('should show ring styling for currently playing highlight', () => {
      const highlights = [createMockHighlight({ handId: 'h1' })]
      const { container } = render(
        <HighlightsPanel {...defaultProps} highlights={highlights} currentHandId="h1" />
      )

      // Currently playing has ring-2 styling
      const playingCard = container.querySelector('.ring-2')
      expect(playingCard).toBeInTheDocument()
    })
  })

  describe('close behavior', () => {
    it('should call onClose when clicking close button', () => {
      const onClose = vi.fn()
      render(<HighlightsPanel {...defaultProps} onClose={onClose} />)

      // Find the close button (icon button in header)
      const buttons = screen.getAllByRole('button')
      // The first button after the panel header is the close button
      const closeButton = buttons.find((btn) => btn.querySelector('svg'))
      expect(closeButton).toBeDefined()
      fireEvent.click(closeButton!)

      expect(onClose).toHaveBeenCalled()
    })

    it('should call onClose when clicking backdrop', () => {
      const onClose = vi.fn()
      render(<HighlightsPanel {...defaultProps} onClose={onClose} />)

      // Click on the backdrop (the outer semi-transparent div with aria-hidden)
      const dialog = screen.getByRole('dialog')
      const backdrop = dialog.previousSibling as Element
      expect(backdrop).not.toBeNull()
      fireEvent.click(backdrop)

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('should have aria-label on dialog', () => {
      render(<HighlightsPanel {...defaultProps} />)

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Tournament highlights')
    })

    it('should have focusable elements within panel', () => {
      const highlights = [createMockHighlight()]
      render(<HighlightsPanel {...defaultProps} highlights={highlights} />)

      // Close button and highlight cards should be focusable buttons
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('should have heading in panel', () => {
      render(<HighlightsPanel {...defaultProps} />)

      // Panel uses h3 for "Highlights" heading
      expect(screen.getByText('Highlights')).toBeInTheDocument()
    })
  })

  describe('street badges', () => {
    it('should display street badge for preflop', () => {
      const highlights = [createMockHighlight({ street: 'preflop' })]
      render(<HighlightsPanel {...defaultProps} highlights={highlights} />)

      expect(screen.getByText('Preflop')).toBeInTheDocument()
    })

    it('should display street badge for showdown', () => {
      const highlights = [createMockHighlight({ street: 'showdown' })]
      render(<HighlightsPanel {...defaultProps} highlights={highlights} />)

      expect(screen.getByText('Showdown')).toBeInTheDocument()
    })

    it('should display street badges for all streets', () => {
      const streets = ['flop', 'turn', 'river'] as const
      streets.forEach((street) => {
        const highlights = [createMockHighlight({ street, handId: street })]
        const { unmount } = render(<HighlightsPanel {...defaultProps} highlights={highlights} />)

        const expectedLabel = street.charAt(0).toUpperCase() + street.slice(1)
        expect(screen.getByText(expectedLabel)).toBeInTheDocument()
        unmount()
      })
    })
  })

  describe('sorting and footer', () => {
    it('should sort highlights by pot size descending', () => {
      const highlights = [
        createMockHighlight({ handId: 'h1', potSize: 10000, title: 'Small Pot' }),
        createMockHighlight({ handId: 'h2', potSize: 100000, title: 'Big Pot' }),
        createMockHighlight({ handId: 'h3', potSize: 50000, title: 'Medium Pot' }),
      ]
      render(<HighlightsPanel {...defaultProps} highlights={highlights} />)

      // First displayed should be Big Pot (100K), then Medium (50K), then Small (10K)
      const titles = screen.getAllByText(/Pot$/)
      expect(titles[0].textContent).toBe('Big Pot')
      expect(titles[1].textContent).toBe('Medium Pot')
      expect(titles[2].textContent).toBe('Small Pot')
    })

    it('should display footer with highlight count', () => {
      const highlights = [
        createMockHighlight({ handId: 'h1' }),
        createMockHighlight({ handId: 'h2' }),
        createMockHighlight({ handId: 'h3' }),
      ]
      render(<HighlightsPanel {...defaultProps} highlights={highlights} />)

      expect(screen.getByText('3 highlights available')).toBeInTheDocument()
    })

    it('should display singular form for one highlight', () => {
      const highlights = [createMockHighlight({ handId: 'h1' })]
      render(<HighlightsPanel {...defaultProps} highlights={highlights} />)

      expect(screen.getByText('1 highlight available')).toBeInTheDocument()
    })

    it('should not show footer when loading', () => {
      const highlights = [createMockHighlight()]
      render(<HighlightsPanel {...defaultProps} highlights={highlights} isLoading={true} />)

      expect(screen.queryByText(/highlights? available/)).not.toBeInTheDocument()
    })

    it('should not show footer when error', () => {
      const highlights = [createMockHighlight()]
      render(<HighlightsPanel {...defaultProps} highlights={highlights} error={new Error('Failed')} />)

      expect(screen.queryByText(/highlights? available/)).not.toBeInTheDocument()
    })
  })
})
