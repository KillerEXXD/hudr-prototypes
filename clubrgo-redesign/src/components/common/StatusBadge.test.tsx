import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('renders a pulsing red dot before "Running" for the in-play phase', () => {
    const { container } = render(<StatusBadge phase="live" />)
    expect(screen.getByText('Running')).toBeInTheDocument()
    const dot = container.querySelector('.animate-pulse')
    expect(dot).toBeTruthy()
    expect(dot?.className).toContain('bg-accent-red')
  })

  it('shows "Registration open" with no live dot', () => {
    const { container } = render(<StatusBadge phase="registration" />)
    expect(screen.getByText('Registration open')).toBeInTheDocument()
    expect(container.querySelector('.animate-pulse')).toBeNull()
  })

  it('shows "Completed" with no live dot', () => {
    const { container } = render(<StatusBadge phase="completed" />)
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(container.querySelector('.animate-pulse')).toBeNull()
  })
})
