import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RelationshipPills } from './RelationshipPills'

describe('RelationshipPills', () => {
  it('host: Available · Playing · Hosting in order, with counts', () => {
    render(<RelationshipPills value="hosting" onChange={() => {}} isHost counts={{ available: 2, playing: 1, hosting: 3 }} />)
    const tabs = screen.getAllByRole('tab').map((t) => t.textContent)
    expect(tabs).toEqual(['Available (2)', 'Playing (1)', 'Hosting (3)'])
  })

  it('player: only Available · Playing (no Hosting)', () => {
    render(<RelationshipPills value="playing" onChange={() => {}} isHost={false} />)
    const tabs = screen.getAllByRole('tab').map((t) => t.textContent)
    expect(tabs).toEqual(['Available', 'Playing'])
    expect(screen.queryByText('Hosting')).toBeNull()
  })

  it('fires onChange with the picked relationship', () => {
    const onChange = vi.fn()
    render(<RelationshipPills value="hosting" onChange={onChange} isHost />)
    fireEvent.click(screen.getByText('Available'))
    expect(onChange).toHaveBeenCalledWith('available')
  })
})
