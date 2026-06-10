/**
 * Unit tests for SpeedControl component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SpeedControl, SpeedCycleButton } from '../SpeedControl'
import { PRESET_SPEEDS } from '@/stores/replayerStore'

// =====================
// SpeedControl Tests
// =====================

describe('SpeedControl', () => {
  let mockOnSpeedChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnSpeedChange = vi.fn()
  })

  describe('rendering', () => {
    it('should render all preset speed buttons', () => {
      render(<SpeedControl speed={1} onSpeedChange={mockOnSpeedChange} />)

      PRESET_SPEEDS.forEach((speed) => {
        expect(screen.getByRole('button', { name: `Set playback speed to ${speed}x` })).toBeInTheDocument()
      })
    })

    it('should display speed values with x suffix', () => {
      render(<SpeedControl speed={1} onSpeedChange={mockOnSpeedChange} />)

      expect(screen.getByText('0.75x')).toBeInTheDocument()
      expect(screen.getByText('1x')).toBeInTheDocument()
      expect(screen.getByText('1.5x')).toBeInTheDocument()
    })

    it('should mark current speed as active', () => {
      render(<SpeedControl speed={1.5} onSpeedChange={mockOnSpeedChange} />)

      const button15x = screen.getByRole('button', { name: 'Set playback speed to 1.5x' })
      expect(button15x).toHaveAttribute('aria-pressed', 'true')
    })

    it('should mark non-current speeds as inactive', () => {
      render(<SpeedControl speed={1} onSpeedChange={mockOnSpeedChange} />)

      const button075x = screen.getByRole('button', { name: 'Set playback speed to 0.75x' })
      expect(button075x).toHaveAttribute('aria-pressed', 'false')
    })

    it('should apply custom className', () => {
      const { container } = render(
        <SpeedControl speed={1} onSpeedChange={mockOnSpeedChange} className="custom-class" />
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('interactions', () => {
    it('should call onSpeedChange when clicking a preset button', () => {
      render(<SpeedControl speed={1} onSpeedChange={mockOnSpeedChange} />)

      const button075x = screen.getByRole('button', { name: 'Set playback speed to 0.75x' })
      fireEvent.click(button075x)

      expect(mockOnSpeedChange).toHaveBeenCalledWith(0.75)
    })

    it('should call onSpeedChange with correct speed for each preset', () => {
      render(<SpeedControl speed={1} onSpeedChange={mockOnSpeedChange} />)

      PRESET_SPEEDS.forEach((speed) => {
        const button = screen.getByRole('button', { name: `Set playback speed to ${speed}x` })
        fireEvent.click(button)
        expect(mockOnSpeedChange).toHaveBeenCalledWith(speed)
      })
    })

    it('should handle clicking already active speed', () => {
      render(<SpeedControl speed={1} onSpeedChange={mockOnSpeedChange} />)

      const button1x = screen.getByRole('button', { name: 'Set playback speed to 1x' })
      fireEvent.click(button1x)

      expect(mockOnSpeedChange).toHaveBeenCalledWith(1)
    })
  })

  describe('slider', () => {
    it('should not render slider by default', () => {
      render(<SpeedControl speed={1} onSpeedChange={mockOnSpeedChange} />)

      expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    })

    it('should render slider when showSlider is true', () => {
      render(<SpeedControl speed={1} onSpeedChange={mockOnSpeedChange} showSlider />)

      expect(screen.getByRole('slider', { name: 'Fine-tune playback speed' })).toBeInTheDocument()
    })

    it('should display current speed value with slider', () => {
      render(<SpeedControl speed={1.3} onSpeedChange={mockOnSpeedChange} showSlider />)

      expect(screen.getByText('1.3x')).toBeInTheDocument()
    })

    it('should call onSpeedChange when slider value changes', () => {
      render(<SpeedControl speed={1} onSpeedChange={mockOnSpeedChange} showSlider />)

      const slider = screen.getByRole('slider', { name: 'Fine-tune playback speed' })
      fireEvent.change(slider, { target: { value: '1.7' } })

      expect(mockOnSpeedChange).toHaveBeenCalledWith(1.7)
    })

    it('should have correct min/max/step attributes', () => {
      render(<SpeedControl speed={1} onSpeedChange={mockOnSpeedChange} showSlider />)

      const slider = screen.getByRole('slider', { name: 'Fine-tune playback speed' })
      expect(slider).toHaveAttribute('min', '0.5')
      expect(slider).toHaveAttribute('max', '3')
      expect(slider).toHaveAttribute('step', '0.1')
    })
  })

  describe('size variants', () => {
    it('should apply small size classes by default', () => {
      render(<SpeedControl speed={1} onSpeedChange={mockOnSpeedChange} />)

      const button = screen.getByRole('button', { name: 'Set playback speed to 1x' })
      expect(button).toHaveClass('h-6')
    })

    it('should apply medium size classes when size="md"', () => {
      render(<SpeedControl speed={1} onSpeedChange={mockOnSpeedChange} size="md" />)

      const button = screen.getByRole('button', { name: 'Set playback speed to 1x' })
      expect(button).toHaveClass('h-8')
    })
  })

  describe('active state detection', () => {
    it('should handle floating point comparison for active state', () => {
      // Speed might be 0.9999999 due to floating point, should still match 1
      render(<SpeedControl speed={1.0000001} onSpeedChange={mockOnSpeedChange} />)

      const button1x = screen.getByRole('button', { name: 'Set playback speed to 1x' })
      expect(button1x).toHaveAttribute('aria-pressed', 'true')
    })

    it('should not mark near speeds as active beyond threshold', () => {
      render(<SpeedControl speed={1.02} onSpeedChange={mockOnSpeedChange} />)

      const button1x = screen.getByRole('button', { name: 'Set playback speed to 1x' })
      expect(button1x).toHaveAttribute('aria-pressed', 'false')
    })
  })
})

// =====================
// SpeedCycleButton Tests
// =====================

describe('SpeedCycleButton', () => {
  let mockOnSpeedChange: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnSpeedChange = vi.fn()
  })

  describe('rendering', () => {
    it('should display current speed', () => {
      render(<SpeedCycleButton speed={1} onSpeedChange={mockOnSpeedChange} />)

      expect(screen.getByText('1.0x')).toBeInTheDocument()
    })

    it('should display speed with one decimal place', () => {
      render(<SpeedCycleButton speed={1.5} onSpeedChange={mockOnSpeedChange} />)

      expect(screen.getByText('1.5x')).toBeInTheDocument()
    })

    it('should have correct aria-label', () => {
      render(<SpeedCycleButton speed={1} onSpeedChange={mockOnSpeedChange} />)

      expect(screen.getByRole('button', { name: 'Cycle playback speed' })).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<SpeedCycleButton speed={1} onSpeedChange={mockOnSpeedChange} className="custom-class" />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('cycling behavior', () => {
    it('should cycle to next speed on click', () => {
      render(<SpeedCycleButton speed={0.75} onSpeedChange={mockOnSpeedChange} />)

      fireEvent.click(screen.getByRole('button'))

      expect(mockOnSpeedChange).toHaveBeenCalledWith(1)
    })

    it('should cycle from 1x to 1.5x', () => {
      render(<SpeedCycleButton speed={1} onSpeedChange={mockOnSpeedChange} />)

      fireEvent.click(screen.getByRole('button'))

      expect(mockOnSpeedChange).toHaveBeenCalledWith(1.5)
    })

    it('should wrap from last speed to first', () => {
      render(<SpeedCycleButton speed={1.5} onSpeedChange={mockOnSpeedChange} />)

      fireEvent.click(screen.getByRole('button'))

      expect(mockOnSpeedChange).toHaveBeenCalledWith(0.75)
    })

    it('should start at first preset if current speed is not a preset', () => {
      render(<SpeedCycleButton speed={0.8} onSpeedChange={mockOnSpeedChange} />)

      fireEvent.click(screen.getByRole('button'))

      expect(mockOnSpeedChange).toHaveBeenCalledWith(0.75)
    })
  })
})
